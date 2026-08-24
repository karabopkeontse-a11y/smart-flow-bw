from pathlib import Path
import re

asset = Path('android/app/src/main/assets/index.html')
text = asset.read_text(encoding='utf-8')
required = [
    'BEFORE YOUR BILL',
    'Thothi',
    'Overnight leak',
    'High flow',
    'Improving',
    'Smart Flow estimate — not an official WUC bill',
    'function setScenario',
    'function ask',
    'function addTask',
]
missing = [x for x in required if x not in text]
if missing:
    raise SystemExit('Missing required demo features: ' + ', '.join(missing))

# APK demo must remain usable offline: no remote JS/CSS dependencies.
remote_scripts = re.findall(r'<script[^>]+src=[\"\']https?://', text, flags=re.I)
if remote_scripts:
    raise SystemExit('Offline APK contains remote script dependencies')

# Basic structural checks.
for tag in ['<html', '<head', '<body', '</html>', 'id="modal"', 'id="messages"']:
    if tag not in text:
        raise SystemExit(f'Missing HTML structure: {tag}')

print('Smart Flow BW offline demo smoke test: PASS')
print(f'Asset size: {len(text):,} bytes')
print('Scenarios: normal, overnight leak, high flow, improving')
print('Thothi: reactive droplet + chat + actions')
