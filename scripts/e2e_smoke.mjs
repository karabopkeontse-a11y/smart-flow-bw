import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const server = spawn('python3', ['-m', 'http.server', '4173'], {cwd: process.cwd(), stdio: 'ignore'});
const wait = ms => new Promise(r => setTimeout(r, ms));
const fail = msg => { throw new Error(msg); };
try {
  await wait(700);
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage();
  const errors=[];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if(m.type()==='error') errors.push(`console: ${m.text()}`); });
  page.on('dialog', d => d.dismiss());
  await page.goto('http://127.0.0.1:4173/index.html', {waitUntil:'domcontentloaded'});
  await wait(1800);

  if(await page.locator('.tab').count() < 7) fail('Navigation/account tabs did not initialize');
  if(!(await page.locator('#mToday').innerText()).includes('L')) fail('Overview metrics did not initialize');
  if(await page.locator('img[src="./icon.svg"]').count() < 1) fail('Smart Flow brand logo did not initialize');

  const h0=await page.locator('#timeLabel').innerText();
  await page.locator('[data-action="next"]').click(); await wait(120);
  const h1=await page.locator('#timeLabel').innerText(); if(h0===h1) fail('Next simulation time button did not move time');
  await page.locator('[data-action="prev"]').click(); await wait(120);
  if(await page.locator('#timeLabel').innerText()!==h0) fail('Previous simulation time button did not restore time');

  await page.locator('#scenario').selectOption('high'); await wait(180);
  if(!(await page.locator('#alertsList').innerText()).includes('High flow / burst risk')) fail('Scenario did not update Alerts');
  await page.locator('[data-tab="thothi"]').click(); await wait(150);
  if(!(await page.locator('#chat').innerText()).includes('Thothi report')) fail('Thothi did not receive the current scenario report');

  await page.locator('[data-action="run"]').click(); await wait(4800);
  if(await page.locator('#timeLabel').innerText()!=='23:00') fail('24-hour test did not complete at 23:00');

  // Guided questions: accept either the original prompt container or the runtime suggestion container.
  const q = page.locator('#prompts .prompt, #prompts button, #suggestions .prompt, #suggestions button').filter({hasText:'What am I looking at?'}).first();
  if(await q.count()===0) fail('Guided Thothi question is not clickable');
  await q.click(); await wait(250);
  if(!(await page.locator('#chat').innerText()).includes('Smart Flow command view')) fail('Guided question did not produce an answer');

  await page.locator('#sfAccountBtn').click(); await wait(100); await page.locator('button:has-text("Sign in")').click(); await wait(100);
  const roles=await page.locator('select[name="role"] option').allTextContents();
  if(!roles.some(x=>x.includes('Normal user'))||!roles.some(x=>x.includes('Administrator'))) fail('Role-aware sign-in selector missing user/admin options');
  await page.locator('select[name="role"]').selectOption('user');
  await page.locator('input[name="email"]').fill('demo@smartflow.local');
  await page.locator('input[name="password"]').fill('demo1234');
  await page.locator('.sf-box button:has-text("Sign in")').click(); await wait(350);
  if((await page.evaluate(()=>JSON.parse(localStorage.getItem('sf.session')||'null')))?.email!=='demo@smartflow.local') fail('Demo user sign-in failed');

  // Device flow: the repaired runtime must expose Add device after authentication.
  const deviceTab=page.locator('[data-tab="devices"]').first(); if(await deviceTab.count()) { await deviceTab.click(); } else { await page.locator('button:has-text("Devices")').first().click(); }
  await wait(200);
  const addDevice=page.locator('#sfDevicePanel button:has-text("Add device"), #devices button:has-text("Add device"), button:has-text("Add your first device")').first();
  if(await addDevice.count()===0) fail('Add device control did not initialize');
  await addDevice.click(); await wait(120);
  if(await page.locator('#sfDeviceModal').count()===0) fail('Add device did not open its form');
  await page.locator('#sfName').fill('E2E kitchen meter');
  await page.locator('#sfLocation').fill('Kitchen');
  await page.locator('#sfDeviceForm button:has-text("Save device")').click(); await wait(180);
  if(!(await page.locator('#sfDevices').innerText()).includes('E2E kitchen meter')) fail('Add device save failed');

  await page.locator('[data-tab="save"]').click(); await page.getByRole('button',{name:'+ Add action',exact:true}).click(); await wait(180);
  if(!await page.locator('#sfRuntimeModal').count()) fail('Add Action did not create runtime modal');
  await page.locator('input[name="text"]').fill('E2E test saving action'); await page.locator('.sf-box button:has-text("Add action")').click(); await wait(180);
  if(!(await page.locator('#tasks').innerText()).includes('E2E test saving action')) fail('Add Action failed');

  if(errors.length) fail(errors.join('\n'));
  console.log('Smart Flow BW E2E smoke test: PASS');
  console.log('Logo, navigation, simulation, Thothi reports/questions, sign-in, Add Device and Save Water CRUD passed.');
  await browser.close();
} finally { server.kill('SIGTERM'); }
