const fs = require('fs');

const file = 'work/krishna_divinity_site/assets/receipt.js';
let content = fs.readFileSync(file, 'utf8');

const target = `  if (classroomEnterBtn) {
    classroomEnterBtn.href = \`classroom.html?course=\${targetCourse}\`;
  }`;

// handle both CRLF and LF
const regex = /if\s*\(classroomEnterBtn\)\s*\{\s*classroomEnterBtn\.href\s*=\s*`classroom\.html\?course=\$\{targetCourse\}`;?\s*\}/;

const replacement = `if (classroomEnterBtn) {
    classroomEnterBtn.href = \`classroom.html?course=\${targetCourse}\`;
  }
  const telegramBtn = document.querySelector('#telegram-join-btn');
  if (telegramBtn) {
    if (isAi) {
      telegramBtn.href = 'https://t.me/+ZlaykICRsNswZDI9';
      telegramBtn.textContent = '✈ Join Paid AI Batch Group (Telegram)';
    } else {
      telegramBtn.href = 'https://t.me/+aBgI6ELFZSI4Mzdl';
      telegramBtn.textContent = '✈ Join Paid Gita Batch Group (Telegram)';
    }
  }`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('receipt.js updated successfully!');
} else {
  console.log('Regex did not match receipt.js');
}
