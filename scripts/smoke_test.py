from pathlib import Path
import re
asset=Path('android/app/src/main/assets/index.html'); auth=Path('android/app/src/main/assets/auth-admin.js'); runtime=Path('android/app/src/main/assets/smartflow-runtime.js')
if not asset.exists() or not auth.exists() or not runtime.exists(): raise SystemExit('Required Smart Flow APK assets are missing')
text=asset.read_text(encoding='utf-8'); auth_text=auth.read_text(encoding='utf-8'); runtime_text=runtime.read_text(encoding='utf-8')
required=['Smart Flow BW','Water intelligence with Thothi AI','Before Your Bill','Thothi','Overnight leak','High flow / burst risk','Usage improving','Evening spike','id="thothi"','id="overview"','id="alerts"','id="save"','id="devices"','id="devicePanel"','Sign in / Sign up']
missing=[x for x in required if x not in text]
if missing: raise SystemExit('Missing required current demo features: '+', '.join(missing))
account_features=['indexedDB.open','admin@smartflow.local','SmartFlowAdmin!2026','createUser','sfAdminUI','sfHouseholdUI','sfOpenAccount','sfSignupUI','Administrator']
missing=[x for x in account_features if x not in auth_text]
if missing: raise SystemExit('Missing account-layer feature(s): '+', '.join(missing))
runtime_features=['data-action=\\"prev\\"','data-action=\\"next\\"','data-action=\\"run\\"','PROMPTS=','sfTaskDelete','sfAddHouseholdDevice','sfHouseholdDetail','sfRecordReading','__smartFlowRuntimeReady']
missing=[x for x in runtime_features if x not in runtime_text]
if missing: raise SystemExit('Missing runtime feature(s): '+', '.join(missing))
if re.findall(r'<script[^>]+src=[\"\']https?://',text,re.I) or re.findall(r'<link[^>]+href=[\"\']https?://',text,re.I): raise SystemExit('Offline APK contains remote dependencies')
if 'auth-admin.js' not in text or 'smartflow-runtime.js' not in text: raise SystemExit('Required runtime/account scripts are not wired into APK HTML')
for tag in ['<html','<head','<body','</html>']:
 if tag not in text: raise SystemExit(f'Missing HTML structure: {tag}')
tabs=re.findall(r'data-tab="([^"]+)"',text); screens=re.findall(r'<section id="([^"]+)"',text)
for expected in ['overview','bill','alerts','thothi','save','devices']:
 if expected not in tabs or expected not in screens: raise SystemExit(f'Missing navigation/screen: {expected}')
print('Smart Flow BW offline + accounts + runtime smoke test: PASS'); print(f'Asset size: {len(text):,} bytes'); print('Guest preview, sign-in, sign-up, admin, households, devices, simulation and Thothi surfaces present.')
