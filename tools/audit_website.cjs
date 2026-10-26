const fs = require('fs');
const path = require('path');

const siteDir = path.join(__dirname, '..', 'krishna_divinity_site');
const htmlFiles = fs.readdirSync(siteDir).filter(f => f.endsWith('.html'));

console.log('Auditing HTML files in:', siteDir);
console.log('Files:', htmlFiles);

let errors = [];
let warnings = [];
let externalUrls = new Set();

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(siteDir, file), 'utf8');

  // 1. Check local assets
  const assetRegex = /(?:src|href)=["'](assets\/[^"'#?]+)/g;
  let m;
  while ((m = assetRegex.exec(content)) !== null) {
    const assetPath = path.join(siteDir, m[1]);
    if (!fs.existsSync(assetPath)) {
      errors.push(`[${file}] Missing local asset: ${m[1]}`);
    }
  }

  // 2. Check internal HTML links
  const linkRegex = /href=["']([^"'#:]+\.html)(?:#([^"']*))?["']/g;
  while ((m = linkRegex.exec(content)) !== null) {
    const targetFile = m[1];
    const targetAnchor = m[2];
    const targetPath = path.join(siteDir, targetFile);
    if (!fs.existsSync(targetPath)) {
      errors.push(`[${file}] Broken HTML link to: ${targetFile}`);
    } else if (targetAnchor) {
      const targetContent = fs.readFileSync(targetPath, 'utf8');
      if (!targetContent.includes('id="' + targetAnchor + '"') && !targetContent.includes('name="' + targetAnchor + '"')) {
        warnings.push(`[${file}] Anchor #${targetAnchor} not found in ${targetFile}`);
      }
    }
  }

  // 3. Check same-page anchor links
  const anchorRegex = /href=["']#([a-zA-Z0-9_-]+)["']/g;
  while ((m = anchorRegex.exec(content)) !== null) {
    const anchorId = m[1];
    if (!content.includes('id="' + anchorId + '"') && !content.includes('name="' + anchorId + '"')) {
      errors.push(`[${file}] Broken same-page anchor: #${anchorId}`);
    }
  }

  // 4. Collect external links
  const extRegex = /href=["'](https?:\/\/[^"']+)["']/g;
  while ((m = extRegex.exec(content)) !== null) {
    externalUrls.add(m[1]);
  }
});

console.log('\n====================================');
console.log('1. ASSET & INTERNAL LINK INTEGRITY');
console.log('====================================');
console.log('Errors (' + errors.length + '):');
errors.forEach(e => console.log('  ❌ ' + e));
console.log('Warnings (' + warnings.length + '):');
warnings.forEach(w => console.log('  ⚠️ ' + w));
if (errors.length === 0 && warnings.length === 0) {
  console.log('  ✅ ALL internal assets, pages, and anchors are 100% valid!');
}

console.log('\n====================================');
console.log('2. EXTERNAL LINKS FOUND');
console.log('====================================');
const uniqueExt = Array.from(externalUrls);
console.log('Total external links:', uniqueExt.length);
uniqueExt.forEach(u => console.log('  🔗 ' + u));

async function checkExternal() {
  console.log('\n====================================');
  console.log('3. TESTING EXTERNAL URLS');
  console.log('====================================');
  for (const url of uniqueExt) {
    if (url.includes('schema.org') || url.includes('w3.org')) continue;
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        redirect: 'follow',
        signal: AbortSignal.timeout(8000)
      });
      console.log('  [' + res.status + '] ' + url);
    } catch(err) {
      // try GET
      try {
        const res2 = await fetch(url, {
          method: 'GET',
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          redirect: 'follow',
          signal: AbortSignal.timeout(8000)
        });
        console.log('  [' + res2.status + '] (GET) ' + url);
      } catch (err2) {
        console.log('  [FAILED] ' + url + ' -> ' + err2.message);
      }
    }
  }
}

checkExternal();
