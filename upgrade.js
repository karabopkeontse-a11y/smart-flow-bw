/* Smart Flow BW — safe functional upgrade layer
 * Loaded by sw.js after the original UI. It preserves the existing visual system and adds
 * persistent device/task management without rewriting the original prototype.
 */
(function(){
  'use strict';
  const KEY='smartflow.upgrade.v1';
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{devices:[],tasks:null,selected:null}}catch(e){return {devices:[],tasks:null,selected:null}}};
  const save=s=>localStorage.setItem(KEY,JSON.stringify(s));
  const db=load();
  if(!Array.isArray(db.devices))db.devices=[];
  if(!Array.isArray(db.tasks))db.tasks=null;

  const style=document.createElement('style');
  style.textContent=`
    .sf-device-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
    .sf-device{position:relative;overflow:hidden}
    .sf-device.offline{opacity:.72}
    .sf-status{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;padding:5px 8px;border-radius:999px;background:#eaf8f2;color:var(--good)}
    .sf-status.off{background:#f2f4f6;color:var(--muted)}
    .sf-dot{width:7px;height:7px;border-radius:50%;background:currentColor}
    .sf-reading{font-size:27px;font-weight:850;margin:12px 0 2px}
    .sf-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}
    .sf-mini{font-size:12px;color:var(--muted)}
    .sf-modal{position:fixed;inset:0;background:#08243d66;z-index:100;display:none;align-items:center;justify-content:center;padding:16px}
    .sf-modal.open{display:flex}.sf-modal-card{width:min(680px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:20px;box-shadow:0 24px 70px #08243d55;padding:20px}
    .sf-form{display:grid;grid-template-columns:1fr 1fr;gap:12px}.sf-form .full{grid-column:1/-1}
    .sf-form label{font-size:12px;color:var(--muted);font-weight:750;display:block;margin-bottom:6px}
    .sf-form input,.sf-form select{width:100%;padding:11px;border:1px solid var(--line);border-radius:10px;background:#fff}
    .sf-history{max-height:230px;overflow:auto;border:1px solid var(--line);border-radius:12px;margin-top:12px}
    .sf-history-row{display:grid;grid-template-columns:1fr 1fr 1fr;padding:9px 11px;border-bottom:1px solid var(--line);font-size:12px}.sf-history-row:last-child{border:0}
    .sf-empty{padding:34px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:16px}
    .sf-admin{background:linear-gradient(135deg,#08243d,#0c6db8);color:#fff}
    @media(max-width:850px){.sf-device-grid{grid-template-columns:1fr 1fr}.sf-form{grid-template-columns:1fr}.sf-form .full{grid-column:auto}}
    @media(max-width:520px){.sf-device-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const uid=()=>crypto.randomUUID?crypto.randomUUID():'sf-'+Date.now()+'-'+Math.random().toString(16).slice(2);
  const toast=m=>{if(typeof window.showToast==='function')window.showToast(m);else alert(m)};

  function ensureTasks(){
    if(db.tasks===null){
      db.tasks=[{t:'Check taps and toilets for silent flow',done:false,status:'open'},{t:'Review overnight usage before bed',done:false,status:'open'}];save(db);
    }
  }

  function seedDevice(){
    if(db.devices.length)return;
    db.devices=[{id:uid(),name:'Main house meter',location:'Gaborone',type:'Household meter',active:true,createdAt:new Date().toISOString(),readings:[{litres:0,flow:0,at:new Date().toISOString()}]}];save(db);
  }

  function installNav(){
    const nav=document.querySelector('.tabs');if(!nav||nav.querySelector('[data-tab="devices"]'))return;
    const b=document.createElement('button');b.className='tab';b.dataset.tab='devices';b.textContent='📡 Devices';
    const saveTab=nav.querySelector('[data-tab="save"]');nav.insertBefore(b,saveTab||null);
    b.addEventListener('click',()=>window.openTab('devices'));
  }

  function installScreen(){
    if($('devices'))return;
    const main=document.querySelector('main.wrap');if(!main)return;
    const sec=document.createElement('section');sec.id='devices';sec.className='screen';
    sec.innerHTML=`<div class="hero"><div><h1>Your devices.</h1><p>Monitor each meter independently — one household can have many water points.</p></div><button class="btn dark" id="sfAdd">+ Add device</button></div><div class="card"><div class="row"><div><h2 style="margin:0">Device monitor</h2><div class="note">Test mode until physical meter hardware is connected.</div></div><span class="sf-status"><span class="sf-dot"></span><span id="sfDeviceCount">0 active</span></span></div><div id="sfDevices" style="margin-top:14px"></div></div>`;
    const save=main.querySelector('#save');main.insertBefore(sec,save||null);
    $('sfAdd').onclick=()=>openEditor();
  }

  function openEditor(device){
    let modal=$('sfDeviceModal');if(!modal){
      modal=document.createElement('div');modal.id='sfDeviceModal';modal.className='sf-modal';
      modal.innerHTML=`<div class="sf-modal-card"><div class="row"><div><h2 id="sfModalTitle" style="margin:0">Add device</h2><p class="note">Give this meter a clear identity so its readings never get mixed with another device.</p></div><button class="btn soft" id="sfClose">Close</button></div><form class="sf-form" id="sfDeviceForm"><input type="hidden" id="sfId"><div><label>Device name</label><input id="sfName" required placeholder="Kitchen meter"></div><div><label>Location</label><input id="sfLocation" required placeholder="Kitchen / Main house"></div><div><label>Meter type</label><select id="sfType"><option>Household meter</option><option>Sub-meter</option><option>Tank sensor</option><option>Smart flow sensor</option></select></div><div><label>Starting reading (L)</label><input id="sfLitres" type="number" min="0" step="0.1" value="0"></div><div class="full"><button class="btn dark" style="width:100%">Save device</button></div></form></div>`;
      document.body.appendChild(modal);$('sfClose').onclick=()=>modal.classList.remove('open');
      modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open')});
      $('sfDeviceForm').onsubmit=e=>{e.preventDefault();const id=$('sfId').value;let d=db.devices.find(x=>x.id===id);if(d){d.name=$('sfName').value.trim();d.location=$('sfLocation').value.trim();d.type=$('sfType').value;d.active=d.active!==false}else{d={id:uid(),name:$('sfName').value.trim(),location:$('sfLocation').value.trim(),type:$('sfType').value,active:true,createdAt:new Date().toISOString(),readings:[]};const litres=Number($('sfLitres').value)||0;d.readings.push({litres,flow:0,at:new Date().toISOString()});db.devices.push(d)}save(db);modal.classList.remove('open');renderDevices();toast('Device saved successfully');};
    }
    $('sfModalTitle').textContent=device?'Edit device':'Add device';$('sfId').value=device?.id||'';$('sfName').value=device?.name||'';$('sfLocation').value=device?.location||'';$('sfType').value=device?.type||'Household meter';$('sfLitres').value=device?.readings?.[0]?.litres||0;modal.classList.add('open');setTimeout(()=>$('sfName').focus(),50);
  }

  function latest(d){return d.readings?.[0]||{litres:0,flow:0,at:d.createdAt}}
  function renderDevices(){
    const el=$('sfDevices');if(!el)return;const active=db.devices.filter(d=>d.active!==false).length;$('sfDeviceCount').textContent=`${active} active · ${db.devices.length} total`;
    if(!db.devices.length){el.innerHTML='<div class="sf-empty">No devices yet.<br><br><button class="btn dark" onclick="window.sfAddDevice()">Add your first device</button></div>';return}
    el.innerHTML='<div class="sf-device-grid">'+db.devices.map(d=>{const r=latest(d);const off=d.active===false;return `<div class="card sf-device ${off?'offline':''}"><div class="row"><b>${esc(d.name)}</b><span class="sf-status ${off?'off':''}"><span class="sf-dot"></span>${off?'Inactive':'Online'}</span></div><div class="sf-mini">📍 ${esc(d.location)} · ${esc(d.type)}</div><div class="sf-reading">${Number(r.litres||0).toLocaleString()} L</div><div class="sf-mini">Latest reading · ${Number(r.flow||0).toFixed(2)} L/min</div><div class="sf-mini">Last reading: ${new Date(r.at).toLocaleString()}</div><div class="sf-actions"><button class="btn dark" onclick="window.sfMonitor('${d.id}')">Monitor</button><button class="btn soft" onclick="window.sfEditDevice('${d.id}')">Edit</button><button class="btn soft" onclick="window.sfToggleDevice('${d.id}')">${off?'Activate':'Deactivate'}</button><button class="btn soft" onclick="window.sfDeleteDevice('${d.id}')">Delete</button></div></div>`}).join('')+'</div>';
  }

  function monitor(id){const d=db.devices.find(x=>x.id===id);if(!d)return;db.selected=id;save(db);let modal=$('sfMonitorModal');if(!modal){modal=document.createElement('div');modal.id='sfMonitorModal';modal.className='sf-modal';document.body.appendChild(modal);modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('open')})}const r=latest(d);const rows=(d.readings||[]).slice(0,20).map(x=>`<div class="sf-history-row"><span>${new Date(x.at).toLocaleString()}</span><span>${Number(x.litres||0).toFixed(1)} L</span><span>${Number(x.flow||0).toFixed(2)} L/min</span></div>`).join('')||'<div class="sf-empty">No readings yet.</div>';modal.innerHTML=`<div class="sf-modal-card"><div class="row"><div><h2 style="margin:0">${esc(d.name)}</h2><p class="note">📍 ${esc(d.location)} · ${esc(d.type)}</p></div><button class="btn soft" onclick="this.closest('.sf-modal').classList.remove('open')">Close</button></div><div class="grid" style="margin-top:14px"><div class="card metric"><div class="label">Latest reading</div><div class="value">${Number(r.litres||0).toFixed(1)} L</div></div><div class="card metric"><div class="label">Flow</div><div class="value">${Number(r.flow||0).toFixed(2)}</div><div class="delta">L/min</div></div></div><div class="section card" style="box-shadow:none;background:#f8fbfd"><div class="row"><h2>Test a reading</h2><span class="note">Simulator</span></div><form id="sfReadForm" class="sf-form" style="margin-top:10px"><div><label>Meter reading (L)</label><input id="sfReadLitres" type="number" min="0" step="0.1" required value="${Number(r.litres||0)}"></div><div><label>Flow (L/min)</label><input id="sfReadFlow" type="number" min="0" step="0.01" required value="${Number(r.flow||0)}"></div><div class="full"><button class="btn dark">Record reading</button></div></form></div><h2 style="margin-top:16px">Reading history</h2><div class="sf-history"><div class="sf-history-row" style="font-weight:800;background:#f5f9fc"><span>Time</span><span>Litres</span><span>Flow</span></div>${rows}</div></div>`;modal.classList.add('open');$('sfReadForm').onsubmit=e=>{e.preventDefault();const litres=Number($('sfReadLitres').value);const flow=Number($('sfReadFlow').value);d.readings.unshift({litres,flow,at:new Date().toISOString()});save(db);renderDevices();modal.classList.remove('open');toast(flow>5?'High flow recorded — check this device.':'Reading recorded');};}

  window.sfAddDevice=()=>openEditor();window.sfEditDevice=id=>{const d=db.devices.find(x=>x.id===id);if(d)openEditor(d)};window.sfMonitor=monitor;
  window.sfToggleDevice=id=>{const d=db.devices.find(x=>x.id===id);if(d){d.active=d.active===false;save(db);renderDevices();toast(d.active?'Device activated':'Device deactivated')}};
  window.sfDeleteDevice=id=>{const d=db.devices.find(x=>x.id===id);if(!d)return;if(confirm(`Delete ${d.name}? Its local test readings will also be removed.`)){db.devices=db.devices.filter(x=>x.id!==id);save(db);renderDevices();toast('Device removed')}};

  // Persist the beautiful existing Save Water task UI without changing its appearance.
  function renderPersistentTasks(){ensureTasks();const el=$('tasks');if(!el)return;el.innerHTML=db.tasks.map((x,i)=>`<div class="task"><input type="checkbox" ${x.done?'checked':''} onchange="window.sfTaskToggle(${i},this.checked)"><span style="text-decoration:${x.done?'line-through':'none'};opacity:${x.done?.55:1}">${esc(x.t)}</span><button class="btn soft" style="margin-left:auto" onclick="window.sfTaskDelete(${i})">×</button></div>`).join('')}
  window.sfTaskToggle=(i,v)=>{ensureTasks();if(db.tasks[i]){db.tasks[i].done=!!v;db.tasks[i].status=v?'completed':'open';save(db);renderPersistentTasks()}};
  window.sfTaskDelete=i=>{ensureTasks();db.tasks.splice(i,1);save(db);renderPersistentTasks()};
  window.addTask=function(){ensureTasks();const t=prompt('What water-saving action should we add?');if(t?.trim()){db.tasks.push({t:t.trim(),done:false,status:'open'});save(db);renderPersistentTasks();toast('Task created')}};
  window.renderTasks=renderPersistentTasks;

  function boot(){installNav();installScreen();seedDevice();ensureTasks();renderDevices();renderPersistentTasks();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
