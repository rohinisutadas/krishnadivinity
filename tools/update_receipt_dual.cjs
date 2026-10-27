const fs = require('fs');

// 1. Update registration-success.html
const successPath = 'd:/Website Krishna Divinity/work/krishna_divinity_site/registration-success.html';
let successHtml = fs.readFileSync(successPath, 'utf8');

const pendingBoxOld = `          <!-- Pending Payment State -->
          <div id="payment-pending-box" style="margin-top:16px;">
            <p style="margin-bottom:16px;">Complete your secure payment below to immediately unlock your course classroom and PDF notes.</p>
            <button id="pay-button" class="btn btn-primary btn-block" type="button" style="font-size:18px;padding:14px;">
              Pay Online (UPI, Cards, NetBanking)
            </button>
            <p id="payment-status" class="note" style="text-align:center;margin-top:12px;">
              🔒 100% Secure Checkout powered by Razorpay • 48-Hour Money-Back Guarantee
            </p>
          </div>`;

const pendingBoxNew = `          <!-- Pending Payment State with Dual Options -->
          <div id="payment-pending-box" style="margin-top:16px;">
            <p style="margin-bottom:12px;font-size:15px;color:#334155;">Choose how you want to complete your payment to immediately unlock your course:</p>
            
            <!-- Dual Option Tabs -->
            <div style="display:flex;border:1px solid #e2e8f0;border-radius:10px;padding:4px;background:#f8fafc;margin:14px 0;gap:4px;">
              <button type="button" id="tab-btn-upi-rec" style="flex:1;padding:10px;border:none;background:#fff;color:#b45309;font-weight:700;font-size:13px;border-radius:7px;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.06);">
                ⚡ Direct UPI (0% Fee, Instant)
              </button>
              <button type="button" id="tab-btn-rzp-rec" style="flex:1;padding:10px;border:none;background:transparent;color:#64748b;font-weight:600;font-size:13px;border-radius:7px;cursor:pointer;">
                💳 Cards / Netbanking
              </button>
            </div>

            <!-- Tab 1: Direct UPI -->
            <div id="content-tab-upi-rec">
              <!-- Mobile App Links -->
              <p style="font-weight:700;font-size:13px;color:#334155;margin:0 0 8px;">📱 Pay with 1-Tap on your Mobile App:</p>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
                <a id="rec-gpay" href="#" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;border:1px solid #34a853;background:#f0fdf4;color:#1e7e34;">🟢 Google Pay</a>
                <a id="rec-phonepe" href="#" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;border:1px solid #5f259f;background:#faf5ff;color:#5f259f;">🟣 PhonePe</a>
                <a id="rec-paytm" href="#" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;border:1px solid #00b9f5;background:#f0f9ff;color:#007bb5;">🔵 Paytm</a>
                <a id="rec-any" href="#" style="display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;border:1px solid #d97706;background:#fffbeb;color:#92400e;">🟡 Any UPI / BHIM</a>
              </div>

              <!-- Desktop QR Code -->
              <div style="text-align:center;padding:14px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:16px;">
                <p style="font-weight:700;font-size:13px;color:#334155;margin:0 0 10px;">💻 Scan with GPay, PhonePe, Paytm or any UPI App:</p>
                <div style="display:inline-block;background:#fff;padding:8px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                  <img id="rec-qr-img" src="" alt="Scan UPI QR" width="200" height="200" style="border-radius:8px;border:1px solid #cbd5e1;background:#fff;padding:6px;">
                </div>
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 14px;font-size:13px;color:#1e40af;margin-top:10px;display:flex;justify-content:space-between;align-items:center;">
                  <div style="text-align:left;">
                    <div>UPI ID: <strong style="font-family:monospace;">rohinisutadas-2@okhdfcbank</strong></div>
                    <div style="font-size:12px;color:#64748b;margin-top:2px;">Name: <strong>Roshan Verma</strong> • Amount: <strong id="rec-amt-display">₹108</strong></div>
                  </div>
                  <button type="button" id="rec-copy-upi" style="background:#2563eb;color:#fff;border:none;padding:4px 10px;border-radius:4px;font-size:12px;font-weight:600;cursor:pointer;">Copy</button>
                </div>
              </div>

              <!-- Step 2: UTR input -->
              <div style="background:#fefce8;border:1px solid #fef08a;border-radius:12px;padding:16px;">
                <strong style="color:#854d0e;font-size:14px;display:block;margin-bottom:4px;">✅ Step 2: Confirm Payment & Unlock Course</strong>
                <p class="note" style="margin:2px 0 0;font-size:12px;">Payment hone ke baad screen se 12-digit UPI Ref / UTR Number yahan enter karein:</p>
                <div style="display:flex;gap:8px;margin-top:10px;">
                  <input type="text" id="rec-utr-input" maxlength="22" placeholder="12-digit UTR (e.g. 429381293812)" style="flex:1;padding:10px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:15px;font-family:monospace;">
                  <button type="button" id="rec-confirm-utr-btn" class="btn btn-primary" style="background:#16a34a;border-color:#16a34a;padding:10px 16px;font-size:14px;white-space:nowrap;font-weight:700;cursor:pointer;">
                    Unlock Course →
                  </button>
                </div>
                <span id="rec-utr-error" class="field-error" style="display:none;margin-top:6px;"></span>
              </div>
            </div>

            <!-- Tab 2: Razorpay Gateway -->
            <div id="content-tab-rzp-rec" hidden style="text-align:center;padding:26px 12px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin-top:10px;">
              <span style="font-size:36px;">💳</span>
              <h3 style="margin:10px 0 6px;font-size:18px;color:#0f172a;">Pay via Debit Card, Credit Card or Netbanking</h3>
              <p class="note" style="max-width:380px;margin:0 auto 20px;font-size:13px;line-height:1.5;">Support for Visa, MasterCard, RuPay cards, and all major Indian NetBanking options via Razorpay secure gateway.</p>
              <button id="pay-button" class="btn btn-primary" type="button" style="font-size:16px;padding:12px 28px;">
                Open Razorpay Gateway →
              </button>
              <p id="payment-status" class="note" style="text-align:center;margin-top:10px;font-size:11px;color:#94a3b8;">
                🔒 256-bit SSL Encrypted • 48-Hour Money-Back Guarantee
              </p>
            </div>

          </div>`;

if (successHtml.includes('id="payment-pending-box"')) {
  successHtml = successHtml.replace(pendingBoxOld, pendingBoxNew);
  fs.writeFileSync(successPath, successHtml, 'utf8');
  console.log('registration-success.html updated with dual payment options!');
} else {
  console.log('payment-pending-box not found in registration-success.html');
}
