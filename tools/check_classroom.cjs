const { spawn } = require('child_process');

async function testClassroom() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const proc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--user-data-dir=C:\\Users\\Alex\\AppData\\Local\\Temp\\chrome-classroom-profile'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const url = 'https://krishnadivinity.in/classroom.html?course=gita';
  const tabRes = await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent(url), { method: 'PUT' });
  const tab = await tabRes.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  await new Promise((resolve) => {
    let msgId = 1;
    const send = (method, params = {}) => ws.send(JSON.stringify({ id: msgId++, method, params }));

    ws.onopen = () => {
      send('Runtime.enable');
      send('Log.enable');
      send('Network.enable');
      send('Page.enable');
    };

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
        console.log('  [Console]', text);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        console.log('  [JS EXCEPTION]', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
      } else if (msg.method === 'Network.responseReceived') {
        const resp = msg.params.response;
        if (resp.status >= 400) console.log('  [HTTP ' + resp.status + ']', resp.url);
      }
    };

    setTimeout(() => {
      const evalExpr = "JSON.stringify({" +
        "title: document.title," +
        "videoFrameSrc: document.getElementById('video-frame')?.src," +
        "videoFrameHidden: document.getElementById('video-frame')?.hidden," +
        "videoComingSoonHidden: document.getElementById('video-coming-soon')?.hidden," +
        "lessonTitle: document.getElementById('lesson-title')?.textContent," +
        "moduleCount: document.querySelectorAll('.module-group').length," +
        "lessonCount: document.querySelectorAll('.lesson-item').length," +
        "pdfButtons: Array.from(document.querySelectorAll('#pdf-buttons-container a')).map(function(a){ return { text: a.textContent.trim(), href: a.href }; })" +
      "})";

      const origOnMsg = ws.onmessage;
      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === 9999) {
          console.log('\n================ CLASSROOM DOM STATE ================');
          console.log(JSON.parse(msg.result.result?.value || '{}'));
          ws.close();
          resolve();
        } else {
          origOnMsg(evt);
        }
      };
      send('Runtime.evaluate', { id: 9999, expression: evalExpr, returnByValue: true });
    }, 4500);
  });

  await fetch('http://127.0.0.1:9224/json/close/' + tab.id);
  proc.kill();
}
testClassroom();
