const fs = require('fs');

const modalStyles = `
    /* Dual Payment Modal */
    .pay-modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; overflow-y: auto; }
    .pay-modal-card { background: #ffffff; border-radius: 16px; max-width: 520px; width: 100%; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.05); position: relative; max-height: 90vh; overflow-y: auto; box-sizing: border-box; }
    .pay-modal-close { position: absolute; top: 16px; right: 16px; background: #f1f5f9; border: none; font-size: 18px; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; color: #64748b; display: flex; align-items: center; justify-content: center; }
    .pay-modal-close:hover { background: #e2e8f0; color: #0f172a; }
    
    .pay-nav-tabs { display: flex; border: 1px solid #e2e8f0; border-radius: 10px; padding: 4px; background: #f8fafc; margin: 18px 0; gap: 4px; }
    .pay-nav-tab { flex: 1; padding: 10px 12px; border: none; background: transparent; font-weight: 600; font-size: 13px; border-radius: 7px; cursor: pointer; color: #64748b; transition: all 0.2s; text-align: center; }
    .pay-nav-tab.active { background: #ffffff; color: #b45309; box-shadow: 0 2px 4px rgba(0,0,0,0.06); font-weight: 700; }
    
    .upi-apps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 12px 0 16px; }
    .upi-app-link { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 14px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; border: 1px solid #cbd5e1; background: #ffffff; color: #1e293b; transition: all 0.15s; }
    .upi-app-link:hover { transform: translateY(-1px); box-shadow: 0 2px 5px rgba(0,0,0,0.08); }
    .upi-link-gpay { border-color: #34a853; color: #1e7e34; background: #f0fdf4; }
    .upi-link-phonepe { border-color: #5f259f; color: #5f259f; background: #faf5ff; }
    .upi-link-paytm { border-color: #00b9f5; color: #007bb5; background: #f0f9ff; }
    .upi-link-generic { border-color: #d97706; color: #92400e; background: #fffbeb; }

    .qr-container { text-align: center; margin: 14px 0; padding: 14px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
    .qr-img { border-radius: 8px; border: 1px solid #cbd5e1; background: #fff; padding: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
    
    .upi-info-badge { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #1e40af; margin-top: 12px; display: flex; justify-content: space-between; align-items: center; }
    .btn-copy-upi { background: #2563eb; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .btn-copy-upi:hover { background: #1d4ed8; }

    .step2-box { background: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 16px; margin-top: 18px; }
    .step2-box strong { color: #854d0e; font-size: 14px; display: block; margin-bottom: 4px; }
    .utr-row { display: flex; gap: 8px; margin-top: 10px; }
    .utr-row input { flex: 1; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 15px; font-family: monospace; }
    .utr-row button { padding: 10px 16px; font-size: 14px; white-space: nowrap; font-weight: 700; cursor: pointer; }
`;

const modalHtml = `
  <!-- Dual Payment Choice Modal (Direct UPI & Razorpay) -->
  <div id="payment-choice-modal" class="pay-modal-backdrop" hidden>
    <div class="pay-modal-card">
      <button type="button" class="pay-modal-close" id="modal-close-btn" aria-label="Close modal">✕</button>
      
      <div style="text-align:center;">
        <span class="badge" style="background:#fef3c7;color:#92400e;">Step 2: Complete Payment</span>
        <h2 style="font-size:22px;margin:8px 0 4px;color:#0f172a;" id="modal-course-title">Course Enrollment</h2>
        <p class="note" style="margin:0 0 12px;" id="modal-plan-desc">Amount: <strong style="color:#b45309;font-size:18px;" id="modal-amount-display">₹108</strong></p>
      </div>

      <!-- Navigation Tabs: Direct UPI vs Cards/Netbanking -->
      <div class="pay-nav-tabs">
        <button type="button" id="tab-btn-upi" class="pay-nav-tab active">
          ⚡ Direct UPI (0% Fee, Instant)
        </button>
        <button type="button" id="tab-btn-razorpay" class="pay-nav-tab">
          💳 Cards / Netbanking
        </button>
      </div>

      <!-- Tab 1: Direct UPI -->
      <div id="content-tab-upi">
        
        <!-- Mobile 1-Tap UPI Apps Buttons -->
        <div id="mobile-upi-section">
          <p style="font-weight:700;font-size:13px;color:#334155;margin:0 0 8px;">📱 Pay with 1-Tap on your Mobile App:</p>
          <div class="upi-apps-grid">
            <a id="link-gpay" href="#" class="upi-app-link upi-link-gpay">
              <span>🟢 Google Pay</span>
            </a>
            <a id="link-phonepe" href="#" class="upi-app-link upi-link-phonepe">
              <span>🟣 PhonePe</span>
            </a>
            <a id="link-paytm" href="#" class="upi-app-link upi-link-paytm">
              <span>🔵 Paytm</span>
            </a>
            <a id="link-any-upi" href="#" class="upi-app-link upi-link-generic">
              <span>🟡 Any UPI / BHIM</span>
            </a>
          </div>
        </div>

        <!-- Desktop QR Code Section -->
        <div id="desktop-qr-section" class="qr-container">
          <p style="font-weight:700;font-size:13px;color:#334155;margin:0 0 10px;">💻 Scan with GPay, PhonePe, Paytm or any UPI App:</p>
          <div style="display:inline-block;background:#fff;padding:8px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <img id="qr-code-img" src="" alt="Scan UPI QR Code" width="200" height="200" class="qr-img">
          </div>
          
          <div class="upi-info-badge">
            <div style="text-align:left;">
              <div>UPI ID: <strong id="display-upi-id" style="font-family:monospace;">rohinisutadas-2@okhdfcbank</strong></div>
              <div style="font-size:12px;color:#64748b;margin-top:2px;">Name: <strong>Roshan Verma</strong> • Amount: <strong id="upi-badge-amount">₹108</strong></div>
            </div>
            <button type="button" id="copy-upi-btn" class="btn-copy-upi">Copy</button>
          </div>
        </div>

        <!-- Step 2: Verification by UTR Number -->
        <div class="step2-box">
          <strong>✅ Step 2: Confirm Payment & Unlock Course</strong>
          <p class="note" style="margin:2px 0 0;font-size:12px;">Payment hone ke baad Google Pay/PhonePe screen se 12-digit UPI Ref / UTR Number yahan enter karein:</p>
          
          <div class="utr-row">
            <input type="text" id="utr-number-input" maxlength="22" placeholder="12-digit UTR (e.g. 429381293812)" aria-label="12-digit UPI Reference Number">
            <button type="button" id="confirm-upi-payment-btn" class="btn btn-primary" style="background:#16a34a;border-color:#16a34a;">
              Unlock Course →
            </button>
          </div>
          <span id="utr-input-error" class="field-error" style="display:none;margin-top:6px;"></span>
        </div>

      </div>

      <!-- Tab 2: Razorpay (Cards / Netbanking) -->
      <div id="content-tab-razorpay" hidden>
        <div style="text-align:center;padding:26px 12px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin-top:10px;">
          <span style="font-size:36px;">💳</span>
          <h3 style="margin:10px 0 6px;font-size:18px;color:#0f172a;">Pay via Debit Card, Credit Card or Netbanking</h3>
          <p class="note" style="max-width:380px;margin:0 auto 20px;font-size:13px;line-height:1.5;">Support for Visa, MasterCard, RuPay cards, and all major Indian NetBanking options via Razorpay secure gateway.</p>
          
          <button type="button" id="open-razorpay-btn" class="btn btn-primary" style="font-size:16px;padding:12px 28px;">
            Open Razorpay Gateway →
          </button>
          <p class="note" style="font-size:11px;margin-top:10px;color:#94a3b8;">🔒 256-bit SSL Encrypted • PCI-DSS Compliant</p>
        </div>
      </div>

    </div>
  </div>
`;

// 1. Update registration.html
const regHtmlPath = 'd:/Website Krishna Divinity/work/krishna_divinity_site/registration.html';
let regHtml = fs.readFileSync(regHtmlPath, 'utf8');

// Insert styles before </style>
if (!regHtml.includes('.pay-modal-backdrop')) {
  regHtml = regHtml.replace('</style>', modalStyles + '\n  </style>');
}

// Insert modal before </main>
if (!regHtml.includes('id="payment-choice-modal"')) {
  regHtml = regHtml.replace('</main>', modalHtml + '\n  </main>');
}

fs.writeFileSync(regHtmlPath, regHtml, 'utf8');
console.log('registration.html updated successfully!');
