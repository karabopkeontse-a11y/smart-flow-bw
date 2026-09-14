from pathlib import Path
import re
import subprocess

ROOT = Path('.')
INDEX = ROOT / 'index.html'
JS_FILES = ['app.js', 'local-core.js', 'auth-admin.js', 'smartflow-runtime.js', 'upgrade.js']

if not INDEX.exists():
    raise SystemExit('index.html is missing')

html = INDEX.read_text(encoding='utf-8')
required = [
    'Smart Flow BW', 'Before Your Bill', 'Thothi', 'Overnight leak',
    'High flow / burst risk', 'Usage improving', 'Evening spike',
    'id="overview"', 'id="alerts"', 'id="save"', 'id="devices"',
    'id="account"', 'Run 24h', 'smartflow-runtime.js', 'auth-admin.js'
]
missing = [x for x in required if x not in html]
if missing:
    raise SystemExit('Missing Smart Flow surface: ' + ', '.join(missing))

tabs = set(re.findall(r'data-tab="([^"]+)"', html))
screens = set(re.findall(r'<section id="([^"]+)"', html))
expected = {'overview', 'bill', 'alerts', 'thothi', 'save', 'devices', 'account'}
if not expected <= tabs:
    raise SystemExit('Navigation tabs missing: ' + ', '.join(sorted(expected - tabs)))
if not expected <= screens:
    raise SystemExit('Navigation screens missing: ' + ', '.join(sorted(expected - screens)))

for name in JS_FILES:
    p = ROOT / name
    if not p.exists() or p.stat().st_size == 0:
        raise SystemExit(f'Missing runtime file: {name}')
    subprocess.run(['node', '--check', str(p)], check=True)

if not (ROOT / 'icon.svg').exists():
    raise SystemExit('Smart Flow brand icon is missing')
if not (ROOT / 'upgrade.js').read_text(encoding='utf-8').strip():
    raise SystemExit('Repair layer is empty')

print('Smart Flow hardening validation: PASS')
print('Navigation: ' + ', '.join(sorted(expected)))
print('JavaScript syntax: PASS')
print('Brand asset: PASS')
print('Repair layer: PASS')
