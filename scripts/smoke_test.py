from pathlib import Path
import re
asset=Path('android/app/src/main/assets/index.html'); auth=Path('android/app/src/main/assets/auth-admin.js')
if not asset.exists() or not auth.exists(): raise SystemExit('Required Smart Flow APK assets are missing')
text=asset.read_text(encoding='utf-8'); auth_text=auth.read_text(encoding='utf-8')
required=['Smart Flow BW','Water intelligence with Thothi AI','Before Your Bill','Thothi','Overnight leak','High flow / burst risk','Usage improving','Evening spike','id="thothi"','id="overview"','id="alerts"','id="save"','id="devices"','id="sfDevicePanel"','Sign in / Sign up']
missing=[x for x in required if x not in text]
if missing: raise SystemExit('Missing required current demo features: '+', '.join(missing))
account_features=['indexedDB.open','admin@smartflow.local','SmartFlowAdmin!2026','createUser','sfAdminUI','sfHouseholdUI','sfOpenAccount','sfSignupUI','Administrator']
missing=[x for x in account_features if x not in auth_text]
if missing: raise SystemExit('Missing account-layer feature(s): '+', '.join(missing))
if re.findall(r'<script[^>]+src=[\"\']https?://',text,re.I) or re.findall(r'<link[^>]+href=[\"\']https?://',text,re.I): raise SystemExit('Offline APK contains remote dependencies')
if 'auth-admin.js' not in text: raise SystemExit('auth-admin.js is not wired into APK HTML')
for tag in ['<html','<head','<body','</html>']:
 if tag not in text: raise SystemExit(f'Missing HTML structure: {tag}')
tabs=re.findall(r'data-tab="([^"]+)"',text); screens=re.findall(r'<section id="([^"]+)"',text)
for expected in ['overview','bill','alerts','thothi','save','devices']:
 if expected not in tabs or expected not in screens: raise SystemExit(f'Missing navigation/screen: {expected}')
print('Smart Flow BW 1.0 offline + accounts smoke test: PASS'); print(f'Asset size: {len(text):,} bytes'); print('Guest preview, sign-in, sign-up, admin, households, devices and Thothi surfaces present.')
