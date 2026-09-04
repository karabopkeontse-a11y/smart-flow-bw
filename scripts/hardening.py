from pathlib import Path

root=Path('.')
idx=root/'index.html'
auth=root/'auth-admin.js'
run=root/'smartflow-runtime.js'
sw=root/'sw.js'

def replace_once(p, old, new):
    s=p.read_text(encoding='utf-8')
    if old not in s:
        raise SystemExit(f'Expected patch target missing in {p}: {old[:80]}')
    p.write_text(s.replace(old,new,1),encoding='utf-8')

replace_once(idx,
 '<button class="btn soft" data-action="run">▶ Run 24h test</button>',
 '<button class="btn soft" data-action="run">▶ Run 24h test</button><button class="btn soft" data-action="stop" hidden>■ Stop</button>')
replace_once(idx,
 '<div class="billbox"><div class="label">End-of-cycle forecast</div><div class="billnum" id="billForecast">P0</div></div>',
 '<div class="billbox"><div class="label">End-of-cycle forecast</div><div class="billnum" id="billForecast">P0</div><div class="delta good" id="billThothiStatus">Thothi active · monitoring</div></div>')
replace_once(idx,
 '</script><script src="./auth-admin.js"></script><script src="./smartflow-runtime.js"></script></body></html>',
 '</script><script src="./auth-admin.js"></script><script src="./smartflow-runtime.js"></script><script>if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}</script></body></html>')

s=auth.read_text(encoding='utf-8')
s=s.replace("<button class=\"btn soft\" onclick=\"sfAdminLoginUI()\">🛡 Administrator</button>", "")
old="window.sfLoginUI=()=>modal('Sign in','<form class=\"sf-form\" onsubmit=\"event.preventDefault();sfDoLogin(this)\"><label>Email</label><input name=\"email\" type=\"email\" required autocomplete=\"username\"><label>Password</label><input name=\"password\" type=\"password\" required autocomplete=\"current-password\"><button class=\"btn dark\">Sign in</button><div class=\"sf-muted\">Demo user: demo@smartflow.local / demo1234</div></form>');window.sfAdminLoginUI=()=>modal('Administrator sign in','<form class=\"sf-form\" onsubmit=\"event.preventDefault();sfDoLogin(this)\"><label>Administrator email</label><input name=\"email\" type=\"email\" value=\"admin@smartflow.local\" required autocomplete=\"username\"><label>Administrator password</label><input name=\"password\" type=\"password\" required autocomplete=\"current-password\"><button class=\"btn dark\">Enter Admin Console</button><div class=\"sf-muted\">Seeded deadline admin: admin@smartflow.local / SmartFlowAdmin!2026</div></form>');"
new="window.sfLoginUI=()=>modal('Sign in to Smart Flow','<form class=\"sf-form\" onsubmit=\"event.preventDefault();sfDoLogin(this)\"><label>Sign in as</label><select name=\"role\"><option value=\"user\">Normal user</option><option value=\"admin\">Administrator</option></select><label>Email</label><input name=\"email\" type=\"email\" required autocomplete=\"username\"><label>Password</label><input name=\"password\" type=\"password\" required autocomplete=\"current-password\"><button class=\"btn dark\">Sign in</button><div class=\"sf-muted\">User demo: demo@smartflow.local / demo1234</div><div class=\"sf-muted\">Admin demo: admin@smartflow.local / SmartFlowAdmin!2026</div></form>');window.sfAdminLoginUI=window.sfLoginUI;"
if old not in s: raise SystemExit('Old login UI not found')
s=s.replace(old,new,1)
old="window.sfDoLogin=async f=>{try{await login(f.email.value,f.password.value);sfClose();await refreshAuth();alert('Signed in successfully.')}catch(e){alert(e.message)}};"
new="window.sfDoLogin=async f=>{try{const u=await login(f.email.value,f.password.value);if(f.role?.value&&u.role!==f.role.value){setSession(null);throw Error('That account does not have the selected sign-in role.');}sfClose();await refreshAuth();alert(u.role==='admin'?'Administrator signed in successfully.':'Signed in successfully.')}catch(e){alert(e.message)}};"
if old not in s: raise SystemExit('Old login handler not found')
s=s.replace(old,new,1)
auth.write_text(s,encoding='utf-8')

replace_once(run,
 "if($('cyclePct'))$('cyclePct').textContent='47%';if($('cycleFill'))$('cycleFill').style.width='47%';",
 "if($('cyclePct'))$('cyclePct').textContent='47%';if($('cycleFill'))$('cycleFill').style.width='47%';if($('billThothiStatus'))$('billThothiStatus').textContent=S.playing?'Thothi active · running 24h test':'Thothi active · monitoring';")
s=run.read_text(encoding='utf-8')
start=s.index('window.runScenario=')
end=s.index('function wire()',start)
s=s[:start]+'''function setRunControls(){const run=document.querySelector('[data-action="run"]'),stop=document.querySelector('[data-action="stop"]');if(run)run.disabled=S.playing;if(stop)stop.hidden=!S.playing}\nwindow.runScenario=()=>{if(S.playing)return;S.playing=true;S.runId++;const id=S.runId;let h=0;emotion('excited');setRunControls();renderAll();toast('Running 24-hour intelligence test…');const timer=setInterval(()=>{if(id!==S.runId){clearInterval(timer);return}S.hour=h;renderAll();h++;if(h>23){clearInterval(timer);S.playing=false;S.hour=23;setRunControls();renderAll();emotion('celebrating');toast('24-hour test complete');message('24-hour simulation complete. Overview, forecast, alerts and Thothi followed the same timeline. 💧')}},180)};\nwindow.stopScenario=()=>{S.runId++;S.playing=false;setRunControls();renderAll();emotion('happy');toast('Simulation stopped')};\n'''+s[end:]
s=s.replace("document.querySelectorAll('[data-action=\"run\"]').forEach(b=>b.onclick=runScenario);", "document.querySelectorAll('[data-action=\"run\"]').forEach(b=>b.onclick=runScenario);document.querySelectorAll('[data-action=\"stop\"]').forEach(b=>b.onclick=stopScenario);setRunControls();",1)
run.write_text(s,encoding='utf-8')

sw.write_text('''const CACHE="smart-flow-bw-v5";\nconst APP=["./","./index.html","./manifest.webmanifest","./sw.js","./icon.svg","./auth-admin.js","./smartflow-runtime.js"];\nself.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)).then(()=>self.skipWaiting())));\nself.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));\nself.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(caches.match(e.request).then(cached=>{const live=fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>cached||caches.match("./index.html"));return cached||live}))});\n''',encoding='utf-8')
