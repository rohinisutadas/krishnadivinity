import os

site_dir = r'D:\Website Krishna Divinity\work\krishna_divinity_site'
for f in os.listdir(site_dir):
    if f.endswith('.html'):
        p = os.path.join(site_dir, f)
        with open(p, 'r', encoding='utf-8') as fp:
            content = fp.read()
        if 'assets/styles.css' in content and 'assets/styles.css?v=2' not in content:
            new_content = content.replace('assets/styles.css', 'assets/styles.css?v=2')
            with open(p, 'w', encoding='utf-8') as fp:
                fp.write(new_content)
            print(f"Updated {f} -> styles.css?v=2")
