from pathlib import Path
site=Path(__file__).resolve().parents[1]/'krishna_divinity_site'
for path in site.glob('*.html'):
    text=path.read_text(encoding='utf-8')
    replacements={
      'A monk in the Hare Krishna Movement':'A monk in the Krishna Consciousness Movement for the last 15 years',
      'Complete AI LMS Course':'AI Live + Recorded Course',
      'Complete LMS course':'AI Live + Recorded Course',
      'Complete LMS option':'AI Live + Recorded Course',
      'Complete LMS access':'Live + recorded-course access',
      'Complete LMS ₹1,080':'Live + Recorded ₹1,080',
      'Complete LMS':'AI Live + Recorded Course',
      'AI LMS':'AI Live + Recorded',
      'Get LMS Course':'Get Live + Recorded Course',
      'LMS enrolment coming soon':'Register for Live + Recorded Course',
      'LMS Option':'Live + Recorded Option',
      'complete structured AI LMS course':'AI Live + Recorded Course',
      'structured digital access through the LMS':'live classes plus recorded lessons through your student login',
      'structured permanent access':'recorded lessons and learning resources',
      'permanent structured digital access':'live classes plus recorded lessons',
      'Permanent organized access':'Live classes + recorded lessons',
      'structured permanent digital access':'live classes plus recorded lessons',
      'permanent LMS access':'recorded-course access',
      'complete structured LMS course':'AI Live + Recorded Course',
      'structured LMS access':'recorded lessons and student login',
      'LMS access':'Recorded lessons + student login',
      'LMS login':'student login',
      'Module-by-module LMS':'Organized lessons through your student login',
      'Live + LMS access':'Live + recorded lessons',
      'Live + LMS':'Live + recorded lessons',
      'recordings and LMS':'recordings and student login',
      'Recordings + LMS':'Recordings + student login',
      'Live classes + recordings + LMS':'Live classes + recordings + student login',
      'LMS included':'recorded lessons included',
      'structured LMS':'recorded course',
      'upgrade to LMS':'upgrade to Live + Recorded',
      'Upgrade to LMS':'Upgrade to Live + Recorded',
      'complete LMS':'recorded-course',
      'through the LMS':'through your student login',
      'Separate LMS':'Separate recorded-course',
      'No separate LMS fee':'No separate recorded-course fee',
      'Website preview · Enrolment and payments are not open yet.':'Course website preview · Payments are not open yet.'
    }
    for old,new in replacements.items():text=text.replace(old,new)
    if path.name in ('ai.html','gita.html'):
        course='ai' if path.name=='ai.html' else 'gita'
        text=text.replace('Registration preview','Course registration')
        text=text.replace('Enrolment will open once the batch schedule and payment setup are ready. No personal details or payments are collected in this preview.','Complete the registration form to join the next available batch. If no batch is available, you will be added to the waiting list. No payment is collected on this form.')
        text=text.replace(f'href="{course}-success.html">Preview next steps',f'href="registration.html?course={course}">Register for the course')
        text=text.replace('Registration is not open yet. This preview shows the planned course information and next steps.','Your course is preselected on the registration form. Registration becomes available once the student-record system is connected.')
        text=text.replace('href="#lms-register"','href="registration.html?course=ai&amp;plan=ai-complete"')
        text=text.replace('<button class="btn btn-primary" type="button" disabled>Register for Live + Recorded Course</button>','<a class="btn btn-primary" href="registration.html?course=ai&amp;plan=ai-complete">Register for Live + Recorded Course</a>')
        if course=='ai':
            text=text.replace('<li>Complete recorded course</li>','<li>10 live AI modules</li><li>Complete recorded course</li>')
    path.write_text(text,encoding='utf-8')
css=site/'assets/styles.css'
with css.open('a',encoding='utf-8') as f:f.write('''
/* Registration */
.registration-layout{display:grid;grid-template-columns:1fr 1fr;gap:42px;align-items:start}
.registration-layout h1{font-size:clamp(36px,5vw,58px)}
.registration-layout h2{font-size:26px}
fieldset{margin:0;padding:0;border:0;min-width:0}
fieldset:disabled{opacity:.55}
.consent{display:flex;gap:12px;align-items:flex-start;font-weight:500;margin:24px 0 12px}
.consent input{width:20px;height:20px;flex:0 0 20px;margin-top:4px}
.consent a{text-decoration:underline}
.optional{font-weight:400;color:var(--muted)}
.field-error{display:block;color:#a32121;font-size:13px}
.form-message{padding:12px;background:#fff0ee;border:1px solid #c94939;color:#8b1b13;border-radius:8px}
[aria-invalid="true"]{border-color:#b52929}
.honeypot,.sr-only{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
@media(max-width:800px){.registration-layout{grid-template-columns:1fr;gap:24px}}
''')
print('Updated agreed course copy and registration links.')
