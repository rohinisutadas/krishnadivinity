from pathlib import Path
import re

site = Path(__file__).resolve().parents[1] / 'krishna_divinity_site'
for path in site.glob('*.html'):
    text = path.read_text(encoding='utf-8')
    text = text.replace('</head>', '<meta name="robots" content="noindex,nofollow"></head>')
    text = text.replace('<body>', '<body><aside class="preview-banner">Website preview · Enrolment and payments are not open yet.</aside>')
    text = re.sub(r'<form\b.*?</form>', lambda m: '<div class="form-card"><h3>Registration preview</h3><p>Enrolment will open once the batch schedule and payment setup are ready. No personal details or payments are collected in this preview.</p><a class="btn btn-secondary btn-block" href="' + ('gita-success.html' if path.name == 'gita.html' else 'ai-success.html') + '">Preview next steps</a></div>', text, flags=re.S)
    text = re.sub(r'This prototype form.*?(?=</p>)', 'Registration is not open yet. This preview shows the planned course information and next steps.', text)
    text = re.sub(r'Your details have been captured.*?(?=</p>)', 'This is a preview of the planned next steps. No registration or payment has taken place.', text)
    text = re.sub(r'<a class="btn (?:btn-primary|btn-secondary)" href="#">Join WhatsApp Group</a>', '<button class="btn btn-light" type="button" disabled>WhatsApp group coming soon</button>', text)
    text = text.replace('Replace the WhatsApp button with your actual group invite link before launch.', 'The group link will be available when enrolment opens.')
    text = text.replace('<a class="btn btn-primary" href="#register">Request LMS Access</a>', '<button class="btn btn-primary" type="button" disabled>LMS enrolment coming soon</button>')
    text = text.replace('Embed one of your strongest Bhagavad Gita YouTube sessions here so visitors can experience the teaching style, presentation and interaction.', 'A sample class will be available here soon.')
    text = text.replace('Use this area for one of your strongest demonstrations: thumbnail creation, presentation, website, AI video or another real project.', 'A practical AI demonstration will be available here soon.')
    text = text.replace('Replace this placeholder with your YouTube embed.', 'Sample video coming soon.').replace('Replace with your YouTube video embed.', 'Demo video coming soon.')
    text = re.sub(r'<section class="soft"><div class="container"><div class="section-head"><span class="eyebrow">Student experiences</span>.*?</section>', '', text, flags=re.S)
    path.write_text(text, encoding='utf-8')
(site / 'assets/site.js').write_text('// Preview only. Registration and payment collection are intentionally inactive.\n', encoding='utf-8')
with (site / 'assets/styles.css').open('a', encoding='utf-8') as f:
    f.write('''
/* Preview readiness and accessibility */
.preview-banner{padding:10px 18px;text-align:center;background:#f6e7bd;color:#493313;font-size:14px;font-weight:700}
.purple .card p{color:var(--muted)}
[id]{scroll-margin-top:100px}
.btn:disabled{opacity:.65;cursor:not-allowed;transform:none}
a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid #97700d;outline-offset:4px}
.hero-grid>*{min-width:0}
h1{overflow-wrap:anywhere}
@media(max-width:640px){.btn{text-align:center}.brand .mark{flex-shrink:0}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important}}
''')
(site / '_headers').write_text('/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n', encoding='utf-8')
(site / 'robots.txt').write_text('User-agent: *\nDisallow: /\n', encoding='utf-8')
print('Prepared', site)
