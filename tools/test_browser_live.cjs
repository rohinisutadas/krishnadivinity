const { spawn } = require('child_process');

async function runBrowserAudit() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const proc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--user-data-dir=C:\\Users\\Alex\\AppData\\Local\\Temp\\chrome-test-profile'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  async function testPage(url) {
    console.log('\n=============================================');
    console.log('Testing live page:', url);
    console.log('=============================================');
    
    // Create tab
    const tabRes = await fetch('http://127.0.0.1:9223/json/new?' + encodeURIComponent(url), { method: 'PUT' });
    const tab = await tabRes.json();
    
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    
    await new Promise((resolve) => {
      let msgId = 1;
      const send = (method, params = {}) => {
        ws.send(JSON.stringify({ id: msgId++, method, params }));
      };

      ws.onopen = () => {
        send('Runtime.enable');
        send('Log.enable');
        send('Network.enable');
        send('Page.enable');
      };

      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
          const type = msg.params.type;
          const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
          console.log(`  [Console ${type.toUpperCase()}]`, text);
        } else if (msg.method === 'Runtime.exceptionThrown') {
          console.log('  [JS EXCEPTION]', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description || '');
        } else if (msg.method === 'Log.entryAdded') {
          console.log('  [BROWSER LOG ' + msg.params.entry.level + ']', msg.params.entry.text);
        } else if (msg.method === 'Network.responseReceived') {
          const resp = msg.params.response;
          if (resp.status >= 400) {
            console.log(`  [HTTP ${resp.status}]`, resp.url);
          }
        } else if (msg.method === 'Network.loadingFailed') {
          console.log('  [NETWORK FAILED]', msg.params.errorText, msg.params.type, 'canceled:', msg.params.canceled);
        }
      };

      // Let page execute scripts for 4 seconds
      setTimeout(async () => {
        // Evaluate DOM state
        const evalMsg = {
          id: 9999,
          method: 'Runtime.evaluate',
          params: {
            expression: `({
              title: document.title,
              availability: document.querySelector('#availability')?.textContent || '',
              fieldsDisabled: document.querySelector('#registration-fields')?.disabled,
              buttonText: document.querySelector('#submit-registration')?.textContent || '',
              coursesCount: document.querySelectorAll('.enrolled-card, .lesson-item').length
            })`,
            returnByValue: true
          }
        };
        
        ws.onmessage = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === 9999) {
            console.log('  [DOM STATE]', msg.result.result?.value);
            ws.close();
            resolve();
          }
        };
        ws.send(JSON.stringify(evalMsg));
      }, 4000);
    });

    // close tab
    await fetch('http://127.0.0.1:9223/json/close/' + tab.id);
  }

  try {
    await testPage('https://krishnadivinity.in/registration.html');
    await testPage('https://krishnadivinity.in/portal.html');
    await testPage('https://krishnadivinity.in/classroom.html?course=gita');
    await testPage('https://krishnadivinity.in/classroom.html?course=ai');
    await testPage('https://krishnadivinity.in/gita.html');
    await testPage('https://krishnadivinity.in/ai.html');
  } catch(err) {
    console.error('Audit error:', err);
  } finally {
    proc.kill();
  }
}

runBrowserAudit();
