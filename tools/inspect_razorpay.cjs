const { spawn } = require('child_process');

async function testRzp() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const proc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--disable-gpu',
    '--user-data-dir=C:\\Users\\Alex\\AppData\\Local\\Temp\\chrome-rzp-profile'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const url = 'https://krishnadivinity.in/registration.html';
  const tabRes = await fetch('http://127.0.0.1:9225/json/new?' + encodeURIComponent(url), { method: 'PUT' });
  const tab = await tabRes.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  let msgId = 1;
  const send = (method, params = {}) => ws.send(JSON.stringify({ id: msgId++, method, params }));

  ws.onopen = () => {
    send('Runtime.enable');
    send('Network.enable');
    send('Page.enable');
  };

  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Network.responseReceived') {
      const resp = msg.params.response;
      if (resp.url.includes('razorpay.com') && (resp.status >= 400 || resp.url.includes('order') || resp.url.includes('qr') || resp.url.includes('payment'))) {
        console.log(`[RZP Network ${resp.status}] ${resp.url}`);
      }
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      if (text.includes('Razorpay') || text.includes('order') || text.includes('error')) {
        console.log('[Console]', text);
      }
    }
  };

  // Wait 3s then submit registration form
  setTimeout(() => {
    console.log('Submitting form...');
    send('Runtime.evaluate', {
      expression: `
        document.getElementById('full_name').value = 'Test User';
        document.getElementById('email').value = 'test@example.com';
        document.getElementById('whatsapp').value = '+917356052212';
        document.getElementById('consent').checked = true;
        document.getElementById('submit-registration').click();
      `
    });
  }, 3000);

  // After 10s inspect state
  setTimeout(async () => {
    console.log('Inspecting checkout iframe...');
    send('Runtime.evaluate', {
      id: 8888,
      expression: `
        ({
          buttonText: document.getElementById('submit-registration')?.textContent,
          hasRzpIframe: !!document.querySelector('iframe.razorpay-checkout-frame'),
          iframeSrc: document.querySelector('iframe.razorpay-checkout-frame')?.src
        })
      `,
      returnByValue: true
    });
  }, 10000);

  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id === 8888) {
      console.log('DOM State:', msg.result.result?.value);
      setTimeout(() => {
        ws.close();
        proc.kill();
      }, 1000);
    }
  };
}
testRzp();
