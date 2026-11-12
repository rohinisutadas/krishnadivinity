const fs = require('fs');

const file = 'work/krishna_divinity_site/assets/admin.js';
let content = fs.readFileSync(file, 'utf8');

const target = `    // Build personalized WhatsApp welcome message
    const cleanNumber = data.phone.replace(/[^0-9]/g, '');
    const welcomeMsg = \`Hare Krishna \${data.name} Ji! 🙏\\n\\nKrishna Divinity me aapka swagat hai. Aapka course enrollment safalta-purvak confirm ho gaya hai!\\n\\n📚 Course: \${data.courseName}\\n✅ Status: Confirmed & Active\\n\\n▶ Aap neeche diye gaye link par click karke turant classes shuru kar sakte hain:\\n\${classroomUrl}\\n\\n🎓 Student Learning Portal:\\nhttps://krishnadivinity.in/portal.html\\n(Aap apne WhatsApp number \${data.phone} se kabhi bhi login kar sakte hain)\\n\\n✈ Official Telegram Community (Live Zoom links ke liye):\\nhttps://t.me/+zrMP1VqfFBQzNjE1\\n\\nKisi bhi sahayata ke liye aap humein isi number par WhatsApp kar sakte hain.\\n\\nHare Krishna! 🌸\\n- Rohini Suta Dasa\\nKrishna Divinity\`;`;

const replacement = `    // Build personalized WhatsApp welcome message
    const cleanNumber = data.phone.replace(/[^0-9]/g, '');
    const paidTgLink = data.courseId === 'ai' ? 'https://t.me/+ZlaykICRsNswZDI9' : 'https://t.me/+aBgI6ELFZSI4Mzdl';
    const paidTgName = data.courseId === 'ai' ? 'Paid AI Batch Group' : 'Paid Gita Batch Group';
    const welcomeMsg = \`Hare Krishna \${data.name} Ji! 🙏\\n\\nKrishna Divinity me aapka swagat hai. Aapka course enrollment safalta-purvak confirm ho gaya hai!\\n\\n📚 Course: \${data.courseName}\\n✅ Status: Confirmed & Active\\n\\n▶ Aap neeche diye gaye link par click karke turant classes shuru kar sakte hain:\\n\${classroomUrl}\\n\\n🎓 Student Learning Portal:\\nhttps://krishnadivinity.in/portal.html\\n(Aap apne WhatsApp number \${data.phone} se kabhi bhi login kar sakte hain)\\n\\n✈ \${paidTgName} (Live Zoom links ke liye):\\n\${paidTgLink}\\n\\nKisi bhi sahayata ke liye aap humein isi number par WhatsApp kar sakte hain.\\n\\nHare Krishna! 🌸\\n- Rohini Suta Dasa\\nKrishna Divinity\`;`;

if (content.replace(/\r\n/g, '\n').includes(target.replace(/\r\n/g, '\n'))) {
  content = content.replace(/\r\n/g, '\n').replace(target.replace(/\r\n/g, '\n'), replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('admin.js updated successfully!');
} else {
  console.log('target not found in admin.js');
}
