const fs = require('fs');

const keyId = 'rzp_live_TqtLjeTj9XYzsx';
const keySecret = 'waim48eDyWWgSau61OpX7vKz';
const auth = Buffer.from(keyId + ':' + keySecret).toString('base64');
const sheetId = '1PgupS-wlHJcqDAsP8HskS9YMysHL2Mqf8yyy2QAK3dA';

async function fetchAllRazorpayPayments() {
  let allPayments = [];
  let skip = 0;
  const count = 100;
  while (true) {
    const res = await fetch(`https://api.razorpay.com/v1/payments?count=${count}&skip=${skip}`, {
      headers: { Authorization: 'Basic ' + auth }
    });
    const data = await res.json();
    if (!data.items || data.items.length === 0) break;
    allPayments.push(...data.items);
    if (data.items.length < count) break;
    skip += count;
  }
  return allPayments;
}

function parseCsv(text) {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const rows = [];
  for (const line of lines) {
    const pattern = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g;
    const row = [];
    let match;
    while ((match = pattern.exec(line)) !== null) {
      let val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
      row.push(val !== undefined ? val : '');
      if (match.index === pattern.lastIndex) pattern.lastIndex++;
    }
    rows.push(row);
  }
  return rows;
}

async function fetchTab(tab) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
  const res = await fetch(url);
  const text = await res.text();
  return parseCsv(text);
}

async function run() {
  const rzp = await fetchAllRazorpayPayments();
  const capturedRzp = rzp.filter(p => p.status === 'captured');
  
  const payRows = await fetchTab('Payments');
  const regRows = await fetchTab('Registrations');
  const stuRows = await fetchTab('Students');

  console.log(`=== FULL RECONCILIATION AUDIT REPORT ===`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Total Captured Payments in Razorpay: ${capturedRzp.length}`);
  console.log(`Total Payments Recorded in Google Sheet: ${payRows.length - 1}`);

  // Create lookup maps
  const sheetPaymentsByRzpId = new Map();
  for (let i = 1; i < payRows.length; i++) {
    const row = payRows[i];
    const rzpId = row[3]; // provider_payment_id
    sheetPaymentsByRzpId.set(rzpId, row);
  }

  const regMap = new Map();
  for (let i = 1; i < regRows.length; i++) {
    const r = regRows[i];
    regMap.set(r[0], r); // registration_id -> row
  }

  const stuMap = new Map();
  for (let i = 1; i < stuRows.length; i++) {
    const s = stuRows[i];
    stuMap.set(s[0], s); // student_id -> row
  }

  console.log('\n--- ALL 33 CAPTURED PAYMENTS IN RAZORPAY ---');
  let missingCount = 0;
  let matchedCount = 0;

  for (let i = 0; i < capturedRzp.length; i++) {
    const p = capturedRzp[i];
    const inSheet = sheetPaymentsByRzpId.has(p.id);
    const dateStr = new Date(p.created_at * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const regId = p.notes?.registration_id || 'N/A';
    const regRow = regMap.get(regId);
    const stuId = regRow ? regRow[2] : null;
    const stuRow = stuId ? stuMap.get(stuId) : null;
    const studentName = stuRow ? stuRow[1] : (p.notes?.name || 'Unknown');

    const statusMark = inSheet ? '[SYNCED IN SHEET]' : '[MISSING IN SHEET]';
    if (inSheet) matchedCount++; else missingCount++;

    console.log(`${i+1}. ${statusMark} ${p.id} | ₹${p.amount/100} | ${dateStr} | Student: ${studentName} (${p.email}) | Plan: ${p.notes?.plan || 'N/A'} | Reg: ${regId} | Status in Reg: ${regRow ? regRow[8] : 'NOT FOUND'}`);
  }

  console.log(`\nSummary: Synced: ${matchedCount}, Missing: ${missingCount}`);

  console.log('\n--- ALL PAYMENTS IN GOOGLE SHEET THAT ARE NOT IN RAZORPAY ---');
  for (let i = 1; i < payRows.length; i++) {
    const row = payRows[i];
    const pId = row[3];
    const existsInRzp = capturedRzp.some(p => p.id === pId);
    if (!existsInRzp) {
      console.log(`Sheet Row ${i}: Ref=${row[0]}, RegId=${row[1]}, ProviderPaymentId=${row[3]}, Amount=₹${row[4]}, Status=${row[6]}, PaidAt=${row[7]}`);
    }
  }
}

run().catch(console.error);
