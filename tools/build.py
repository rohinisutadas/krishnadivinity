import re
import os

root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
core_path = os.path.join(root, 'backend', 'core.mjs')
gs_path = os.path.join(root, 'google-apps-script', 'Core.gs')

with open(core_path, 'r', encoding='utf-8') as f:
    core_content = f.read()

# Replace "export " at the start of lines
gs_content = '// GENERATED: run npm run build or python tools/build.py after editing backend/core.mjs\n'
gs_content += re.sub(r'^export ', '', core_content, flags=re.MULTILINE)

with open(gs_path, 'w', encoding='utf-8') as f:
    f.write(gs_content)

print("Synchronized backend/core.mjs -> google-apps-script/Core.gs successfully.")
