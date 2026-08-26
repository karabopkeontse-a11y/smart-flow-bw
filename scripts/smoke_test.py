from pathlib import Path
import re

asset = Path('android/app/src/main/assets/index.html')
auth = Path('android/app/src/main/assets/auth-admin.js')
text = asset.read_text(encoding='utf-8')
auth_text = auth.read_text(encoding='utf-8')

required = [
    'Smart Flow BW',
    'Water intelligence with Thothi AI',
    'Before Your Bill',
    'Thothi',
    'Overnight leak',
    'High flow / burst risk',
    'Usage improving',
    'Evening spike',
    'Smart Flow estimate — not an official WUC bill',
    'function renderAll',
    'function runScenario',
    'function advanceHour',
]
missing = [x for x in required if x not in text]
if missing:
    raise SystemExit('Missing required current demo features: ' + ', '.join(missing))

for x in ['indexedDB.open','admin@smartflow.local','SmartFlowAdmin!2026','createUser','sfAdminUI','sfHouseholdUI','sfOpenAccount']:
    if x not in auth_text:
        raise SystemExit(f'Missing account-layer feature: {x}')

remote_scripts = re.findall(r'<script[^>]+src=[\"\']https?://', text, flags=re.I)
if remote_scripts:
    raise SystemExit('Offline APK contains remote script dependencies')

if 'auth-admin.js' not in text:
    raise SystemExit('auth-admin.js is not wired into the APK HTML')

for tag in ['<html','<head','<body','</html>','id="modal"','id="thothi"']:
    if tag not in text:
        raise SystemExit(f'Missing current HTML structure: {tag}')

print('Smart Flow BW offline demo + account smoke test: PASS')
print(f'Asset size: {len(text):,} bytes')
print('Scenarios: normal, overnight leak, high flow, improving, evening spike')
print('Accounts: local user/admin database, household management, admin console')
print('Thothi: reactive droplet + chat + actions')
