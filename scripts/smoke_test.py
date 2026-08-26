from pathlib import Path
import re

asset = Path('android/app/src/main/assets/index.html')
auth = Path('android/app/src/main/assets/auth-admin.js')
if not asset.exists() or not auth.exists():
    raise SystemExit('Required Smart Flow APK assets are missing')

text = asset.read_text(encoding='utf-8')
auth_text = auth.read_text(encoding='utf-8')

# Validate product capabilities, not brittle legacy element IDs.
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
    'id="thothi"',
    'id="overview"',
    'id="alerts"',
]
missing = [x for x in required if x not in text]
if missing:
    raise SystemExit('Missing required current demo features: ' + ', '.join(missing))

account_features = [
    'indexedDB.open',
    'admin@smartflow.local',
    'SmartFlowAdmin!2026',
    'createUser',
    'sfAdminUI',
    'sfHouseholdUI',
    'sfOpenAccount',
]
missing_accounts = [x for x in account_features if x not in auth_text]
if missing_accounts:
    raise SystemExit('Missing account-layer feature(s): ' + ', '.join(missing_accounts))

# The APK must remain genuinely offline-capable.
remote_scripts = re.findall(r'<script[^>]+src=[\"\']https?://', text, flags=re.I)
remote_links = re.findall(r'<link[^>]+href=[\"\']https?://', text, flags=re.I)
if remote_scripts or remote_links:
    raise SystemExit('Offline APK contains remote script/style dependencies')

if 'auth-admin.js' not in text:
    raise SystemExit('auth-admin.js is not wired into the APK HTML')

for tag in ['<html', '<head', '<body', '</html>']:
    if tag not in text:
        raise SystemExit(f'Missing HTML structure: {tag}')

# Sanity-check that the main navigation and screens are represented.
tab_ids = re.findall(r'data-tab="([^"]+)"', text)
screen_ids = re.findall(r'<section id="([^"]+)"', text)
for expected in ['overview', 'bill', 'alerts', 'thothi', 'save']:
    if expected not in tab_ids or expected not in screen_ids:
        raise SystemExit(f'Missing navigation/screen: {expected}')

print('Smart Flow BW offline demo + account smoke test: PASS')
print(f'Asset size: {len(text):,} bytes')
print('Scenarios: normal, overnight leak, high flow, improving, evening spike')
print('Accounts: local user/admin database, household management, admin console')
print('Thothi: reactive droplet + chat + actions')
