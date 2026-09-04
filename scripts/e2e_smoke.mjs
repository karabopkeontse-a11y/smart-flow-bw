import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const server = spawn('python3', ['-m', 'http.server', '4173'], {cwd: process.cwd(), stdio: 'ignore'});
const wait = ms => new Promise(r => setTimeout(r, ms));
const fail = msg => { throw new Error(msg); };
try {
  await wait(700); const browser = await chromium.launch({headless:true}); const page = await browser.newPage(); const errors=[];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`)); page.on('console', m => { if(m.type()==='error') errors.push(`console: ${m.text()}`); }); page.on('dialog', d => d.dismiss());
  await page.goto('http://127.0.0.1:4173/index.html', {waitUntil:'domcontentloaded'}); await wait(2200);
  if(await page.locator('.tab').count() < 7) fail('Navigation/account tab did not initialize');
  if(await page.locator('#suggestions .prompt').count() < 20) fail('Thothi has fewer than 20 guided prompts');
  if(!(await page.locator('#mToday').innerText()).includes('L')) fail('Overview metrics did not initialize');
  const h0=await page.locator('#timeLabel').innerText(); await page.locator('[data-action="next"]').click(); await wait(100); const h1=await page.locator('#timeLabel').innerText(); if(h0===h1) fail('Next simulation time button did not move time');
  await page.locator('[data-action="prev"]').click(); await wait(100); if(await page.locator('#timeLabel').innerText()!==h0) fail('Previous simulation time button did not restore time');
  await page.locator('#scenario').selectOption('high'); await wait(100); if(!(await page.locator('#alertsList').innerText()).includes('High flow / burst risk')) fail('Scenario did not update Alerts');
  await page.locator('[data-action="run"]').click(); await wait(4800); if(await page.locator('#timeLabel').innerText()!=='23:00') fail('24-hour test did not complete at 23:00'); if(await page.locator('[data-action="run"]').isDisabled()) fail('Run button remained disabled after test completion');
  await page.locator('[data-tab="thothi"]').click(); await page.locator('#suggestions .prompt').filter({hasText:'What am I looking at?'}).click(); await wait(350); if(!(await page.locator('#chat').innerText()).includes('Smart Flow command view')) fail('Thothi guided question did not produce deterministic answer');
  await page.locator('#sfAccountBtn').click(); await wait(100); await page.locator('button:has-text("Sign in")').click(); await wait(100);
  const roles=await page.locator('select[name="role"] option').allTextContents(); if(!roles.some(x=>x.includes('Normal user'))||!roles.some(x=>x.includes('Administrator'))) fail('Role-aware sign-in selector missing user/admin options');
  await page.locator('select[name="role"]').selectOption('user'); await page.locator('input[name="email"]').fill('demo@smartflow.local'); await page.locator('input[name="password"]').fill('demo1234'); await page.locator('.sf-box button:has-text("Sign in")').click(); await wait(250);
  if((await page.evaluate(()=>JSON.parse(localStorage.getItem('sf.session')||'null')))?.email!=='demo@smartflow.local') fail('Demo user sign-in failed');
  await page.locator('[data-tab="save"]').click(); await page.getByRole('button',{name:'+ Add action',exact:true}).click(); await wait(200); if(!await page.locator('#sfRuntimeModal').count()) fail('Add Action did not create runtime modal');
  await page.locator('input[name="text"]').fill('E2E test saving action'); await page.locator('.sf-box button:has-text("Add action")').click(); await wait(200); if(!(await page.locator('#tasks').innerText()).includes('E2E test saving action')) fail('Add Action failed');
  const task=page.locator('#tasks .task').filter({hasText:'E2E test saving action'}).first(); await task.locator('input[type="checkbox"]').check(); await wait(100); await task.locator('button:has-text("Cancel")').click(); await wait(100); await task.locator('button:has-text("Restore")').click(); await wait(100); await task.locator('button:has-text("Delete")').click(); await wait(150); if((await page.locator('#tasks').innerText()).includes('E2E test saving action')) fail('Task delete failed');
  if(errors.length) fail(errors.join('\n')); console.log('Smart Flow BW E2E smoke test: PASS'); console.log('Simulation, Thothi, role selector, Save Water CRUD and normal-user account flow passed.'); await browser.close();
} finally { server.kill('SIGTERM'); }
