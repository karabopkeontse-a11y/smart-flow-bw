from pathlib import Path
p=Path('smartflow-runtime.js')
s=p.read_text(encoding='utf-8')
old="const sug=$('suggestions');if(sug)sug.innerHTML=PROMPTS.map(p=>`<button class=\"prompt\" onclick=\"sfAsk(${JSON.stringify(p)})\">${esc(p)}</button>`).join('');window.sfAsk=p=>{const i=$('chatInput');if(i)i.value=p;askInternal(p)};"
new="const sug=$('suggestions');if(sug){sug.innerHTML=PROMPTS.map(p=>`<button class=\"prompt\" type=\"button\" data-prompt=\"${esc(p)}\">${esc(p)}</button>`).join('');sug.querySelectorAll('.prompt').forEach(b=>b.onclick=()=>sfAsk(b.dataset.prompt||''));}window.sfAsk=p=>{const i=$('chatInput');if(i)i.value=p;askInternal(p)};"
if old not in s:
    raise SystemExit('Expected Thothi prompt renderer not found')
p.write_text(s.replace(old,new,1),encoding='utf-8')
