const fs = require('fs');

function updateIndex() {
  const filePath = 'd:/Website Krishna Divinity/work/krishna_divinity_site/index.html';
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Mobile-friendly header with permanent Student Portal link
  const oldHeader = '<header><div class="container nav"><a class="brand" href="index.html"><img src="assets/logo.jpg" alt="Krishna Divinity" class="brand-logo" width="42" height="42"><span>KRISHNA DIVINITY<small>Wisdom • Skills • Meaningful Living</small></span></a><nav class="navlinks"><a href="#programs">Programs</a><a href="#why">Why Us</a><a href="#instructor">Instructor</a><a href="https://t.me/+zrMP1VqfFBQzNjE1" target="_blank" rel="noopener" style="color:#0284c7;">✈ Telegram</a><a href="portal.html" class="btn btn-light" style="padding:6px 12px;font-size:13px;">🎓 Student Portal</a><a class="btn btn-primary" href="gita.html">Start Learning</a></nav></div></header>';
  
  const newHeader = '<header><div class="container nav"><a class="brand" href="index.html"><img src="assets/logo.jpg" alt="Krishna Divinity" class="brand-logo" width="42" height="42"><span>KRISHNA DIVINITY<small>Wisdom • Skills • Meaningful Living</small></span></a><div style="display:flex;align-items:center;gap:10px;"><a href="portal.html" class="btn btn-light" style="padding:6px 12px;font-size:13px;background:#fef3c7;color:#92400e;border:1px solid #fde68a;font-weight:700;">🎓 Student Portal</a><nav class="navlinks"><a href="#programs">Programs</a><a href="#why">Why Us</a><a href="#instructor">Instructor</a><a href="https://t.me/+zrMP1VqfFBQzNjE1" target="_blank" rel="noopener" style="color:#0284c7;">✈ Telegram</a><a class="btn btn-primary" href="gita.html">Start Learning</a></nav></div></div></header>';

  if (content.includes(oldHeader)) {
    content = content.replace(oldHeader, newHeader);
    console.log('index.html: Header updated');
  }

  // 2. Hero actions Student Portal button
  const oldActions = '<div class="hero-actions"><a class="btn btn-primary" href="gita.html">Explore Bhagavad Gita</a><a class="btn btn-secondary" href="ai.html">Explore AI Course</a></div>';
  const newActions = '<div class="hero-actions"><a class="btn btn-primary" href="gita.html">Explore Bhagavad Gita</a><a class="btn btn-secondary" href="ai.html">Explore AI Course</a><a class="btn btn-light" href="portal.html" style="border-color:#cbd5e1;color:#1e293b;font-weight:600;">🎓 Student Portal</a></div>';

  if (content.includes(oldActions)) {
    content = content.replace(oldActions, newActions);
    console.log('index.html: Hero actions updated');
  }

  // 3. Enrolled student banner right after hero
  const banner = '\n<div class="container" style="margin-top:-20px;margin-bottom:36px;"><div style="background:#fdfaf3;border:1px solid #fde68a;border-radius:12px;padding:16px 22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;box-shadow:0 2px 6px rgba(0,0,0,0.03);"><div style="display:flex;align-items:center;gap:14px;"><span style="font-size:32px;">🎓</span><div><strong style="color:#92400e;font-size:16px;display:block;">Already Enrolled in a Course? (पहले से नामांकित हैं?)</strong><p style="margin:3px 0 0;font-size:13px;color:#78350f;">Log in to access your Bhagavad Gita & AI video lectures, class recordings, and downloadable PDF study notes.</p></div></div><a href="portal.html" class="btn btn-primary" style="background:#b45309;padding:10px 22px;font-size:14px;white-space:nowrap;">Enter Student Portal →</a></div></div>';

  if (!content.includes('Already Enrolled in a Course?')) {
    const heroEnd = '</section>';
    const firstEnd = content.indexOf(heroEnd);
    if (firstEnd !== -1) {
      content = content.slice(0, firstEnd + heroEnd.length) + banner + content.slice(firstEnd + heroEnd.length);
      console.log('index.html: Enrolled banner added');
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

function updateGita() {
  const filePath = 'd:/Website Krishna Divinity/work/krishna_divinity_site/gita.html';
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Mobile-friendly header with permanent Student Portal link
  const oldHeader = '<header><div class="container nav"><a class="brand" href="index.html"><img src="assets/logo.jpg" alt="Krishna Divinity" class="brand-logo" width="42" height="42"><span>KRISHNA DIVINITY<small>Gita Foundation Course</small></span></a><nav class="navlinks"><a href="#why">Why this course</a><a href="#class">Class format</a><a href="https://t.me/+zrMP1VqfFBQzNjE1" target="_blank" rel="noopener" style="color:#0284c7;">✈ Telegram</a><a href="portal.html" class="btn btn-light" style="padding:6px 12px;font-size:13px;">🎓 Student Portal</a><a class="btn btn-primary" href="registration.html?course=gita&amp;plan=gita-lifetime">Enroll ₹108</a></nav></div></header>';

  const newHeader = '<header><div class="container nav"><a class="brand" href="index.html"><img src="assets/logo.jpg" alt="Krishna Divinity" class="brand-logo" width="42" height="42"><span>KRISHNA DIVINITY<small>Gita Foundation Course</small></span></a><div style="display:flex;align-items:center;gap:10px;"><a href="portal.html" class="btn btn-light" style="padding:6px 12px;font-size:13px;background:#fef3c7;color:#92400e;border:1px solid #fde68a;font-weight:700;">🎓 Student Portal</a><nav class="navlinks"><a href="#why">Why this course</a><a href="#class">Class format</a><a href="https://t.me/+zrMP1VqfFBQzNjE1" target="_blank" rel="noopener" style="color:#0284c7;">✈ Telegram</a><a class="btn btn-primary" href="registration.html?course=gita&amp;plan=gita-lifetime">Enroll ₹108</a></nav></div></div></header>';

  if (content.includes(oldHeader)) {
    content = content.replace(oldHeader, newHeader);
    console.log('gita.html: Header updated');
  }

  // 2. Add Classroom link banner in hero
  const enrolledNotice = '\n<div style="margin-top:14px;padding:10px 14px;background:#fdfaf3;border:1px solid #fde68a;border-radius:8px;font-size:13px;color:#92400e;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;"><span>🎓 <strong>Already enrolled?</strong> Access classroom videos & notes directly:</span><a href="classroom.html?course=gita" style="color:#b45309;font-weight:700;text-decoration:underline;">Open Gita Classroom →</a></div>';

  if (!content.includes('Open Gita Classroom →')) {
    const regTarget = 'Complete your enrollment to unlock immediate access to classroom recordings, PDF notes, and live batch Zoom links.</p>';
    if (content.includes(regTarget)) {
      content = content.replace(regTarget, regTarget + enrolledNotice);
      console.log('gita.html: Classroom link added to enrollment box');
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

function updateAi() {
  const filePath = 'd:/Website Krishna Divinity/work/krishna_divinity_site/ai.html';
  let content = fs.readFileSync(filePath, 'utf8');

  // Mobile-friendly header with permanent Student Portal link
  const oldHeader = '<header><div class="container nav"><a class="brand" href="index.html"><img src="assets/logo.jpg" alt="Krishna Divinity" class="brand-logo" width="42" height="42"><span>KRISHNA DIVINITY<small>Practical AI Course</small></span></a><nav class="navlinks"><a href="#skills">10 Skills</a><a href="#pricing">Pricing</a><a href="https://t.me/+zrMP1VqfFBQzNjE1" target="_blank" rel="noopener" style="color:#0284c7;">✈ Telegram</a><a href="portal.html" class="btn btn-light" style="padding:6px 12px;font-size:13px;">🎓 Student Portal</a><a class="btn btn-secondary" href="#pricing">Join From ₹108</a></nav></div></header>';

  const newHeader = '<header><div class="container nav"><a class="brand" href="index.html"><img src="assets/logo.jpg" alt="Krishna Divinity" class="brand-logo" width="42" height="42"><span>KRISHNA DIVINITY<small>Practical AI Course</small></span></a><div style="display:flex;align-items:center;gap:10px;"><a href="portal.html" class="btn btn-light" style="padding:6px 12px;font-size:13px;background:#ede9fe;color:#5b21b6;border:1px solid #ddd6fe;font-weight:700;">🎓 Student Portal</a><nav class="navlinks"><a href="#skills">10 Skills</a><a href="#pricing">Pricing</a><a href="https://t.me/+zrMP1VqfFBQzNjE1" target="_blank" rel="noopener" style="color:#0284c7;">✈ Telegram</a><a class="btn btn-secondary" href="#pricing">Join From ₹108</a></nav></div></div></header>';

  if (content.includes(oldHeader)) {
    content = content.replace(oldHeader, newHeader);
    console.log('ai.html: Header updated');
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

updateIndex();
updateGita();
updateAi();
console.log('All page navigation updates completed.');
