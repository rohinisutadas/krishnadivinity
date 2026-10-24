import http.server
import socketserver
import os
import json
import urllib.request
import base64
import uuid

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'krishna_divinity_site'))
ENV_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env'))

env = {}
if os.path.exists(ENV_FILE):
    with open(ENV_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip()

PORT = 4174

PLANS = {
    'gita-lifetime': {'course': 'gita', 'name': 'Bhagavad Gita Foundation Course (Lifetime)', 'price': 108, 'validity': 'lifetime', 'validityDays': 0, 'validityLabel': 'Lifetime Access'},
    'ai-3m': {'course': 'ai', 'name': 'Practical AI Course (3 Months)', 'price': 108, 'validity': '3_months', 'validityDays': 90, 'validityLabel': '3 Months Access'},
    'ai-1y': {'course': 'ai', 'name': 'Practical AI Course (1 Year)', 'price': 500, 'validity': '1_year', 'validityDays': 365, 'validityLabel': '1 Year Access'},
    'ai-lifetime': {'course': 'ai', 'name': 'Practical AI Course (Lifetime)', 'price': 1080, 'validity': 'lifetime', 'validityDays': 0, 'validityLabel': 'Lifetime Access'},
    'gita-complete': {'course': 'gita', 'name': 'Bhagavad Gita Foundation Course', 'price': 108, 'validity': 'lifetime', 'validityDays': 0, 'validityLabel': 'Lifetime Access'},
    'ai-live': {'course': 'ai', 'name': 'AI Live Classes (3 Months)', 'price': 108, 'validity': '3_months', 'validityDays': 90, 'validityLabel': '3 Months Access'},
    'ai-complete': {'course': 'ai', 'name': 'AI Live + Recorded Course (Lifetime)', 'price': 1080, 'validity': 'lifetime', 'validityDays': 0, 'validityLabel': 'Lifetime Access'}
}

DB = {
    'registrations': {}
}

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

class DevHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def send_response(self, code, message=None):
        super().send_response(code, message)
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')

    def do_GET(self):
        url_path = self.path.split('?')[0]
        if url_path == '/api/register':
            self.send_json({'enabled': True, 'demo': False})
            return
        super().do_GET()

    def do_POST(self):
        url_path = self.path.split('?')[0]
        content_length = int(self.headers.get('Content-Length', 0))
        raw_body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
        try:
            body = json.loads(raw_body)
        except Exception:
            body = {}

        if url_path == '/api/register':
            reg_id = 'REG-' + str(uuid.uuid4())[:18]
            plan_key = body.get('plan', 'gita-lifetime')
            plan = PLANS.get(plan_key, PLANS['gita-lifetime'])

            receipt = {
                'registrationId': reg_id,
                'plan': plan_key,
                'name': plan['name'],
                'course': plan['course'],
                'amountDue': plan['price'],
                'status': 'pending_payment',
                'validity': plan['validity'],
                'validityLabel': plan['validityLabel']
            }
            DB['registrations'][reg_id] = {
                'receipt': receipt,
                'student': body
            }
            self.send_json({'ok': True, 'receipt': receipt})
            return

        elif url_path == '/api/create-order':
            reg_id = body.get('registrationId', '')
            plan_key = body.get('plan', 'gita-lifetime')
            plan = PLANS.get(plan_key, PLANS['gita-lifetime'])
            amount_paise = plan['price'] * 100

            key_id = env.get('RAZORPAY_KEY_ID', '')
            key_sec = env.get('RAZORPAY_KEY_SECRET', '')

            if not key_id or not key_sec:
                self.send_json({'error': 'Razorpay keys not configured.'}, 503)
                return

            auth = base64.b64encode(f"{key_id}:{key_sec}".encode()).decode()
            req = urllib.request.Request(
                'https://api.razorpay.com/v1/orders',
                data=json.dumps({
                    'amount': amount_paise,
                    'currency': 'INR',
                    'receipt': reg_id[:40],
                    'notes': {'registration_id': reg_id, 'plan': plan_key}
                }).encode(),
                headers={
                    'Authorization': f'Basic {auth}',
                    'Content-Type': 'application/json'
                }
            )
            try:
                with urllib.request.urlopen(req, timeout=15) as resp:
                    order = json.loads(resp.read().decode())
                    self.send_json({
                        'ok': True,
                        'orderId': order.get('id'),
                        'amount': order.get('amount'),
                        'currency': order.get('currency', 'INR'),
                        'keyId': key_id,
                        'plan': plan_key,
                        'registrationId': reg_id
                    })
                    return
            except Exception as e:
                self.send_json({'error': f'Razorpay order creation failed: {e}'}, 502)
                return

        elif url_path == '/api/verify-payment':
            reg_id = body.get('registrationId', '')
            payment_id = body.get('razorpay_payment_id', 'pay_mock_' + str(uuid.uuid4())[:8])
            if reg_id in DB['registrations']:
                DB['registrations'][reg_id]['receipt']['status'] = 'confirmed'
                DB['registrations'][reg_id]['receipt']['paymentId'] = payment_id

            self.send_json({
                'ok': True,
                'confirmed': True,
                'paymentId': payment_id,
                'registrationId': reg_id
            })
            return

        self.send_response(404)
        self.end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

if __name__ == '__main__':
    with ThreadedHTTPServer(('127.0.0.1', PORT), DevHandler) as httpd:
        print(f"Krishna Divinity Local Website running at: http://127.0.0.1:{PORT}")
        print("Threaded server ready with no-cache headers.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
