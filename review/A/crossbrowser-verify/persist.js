// OB-01: does the broken legend persist through what a visitor does? No screenshots until the end.
const { webkit } = require(process.env.PWCORE);
const BASE = process.env.BASE || 'http://localhost:8720';
(async () => {
  const b = await webkit.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
  const p = await ctx.newPage();
  await p.goto(BASE + '/contact/', { waitUntil: 'load' });
  const m = async (label) => console.log('  ', label.padEnd(34), await p.evaluate(() => { const l = document.querySelector('fieldset legend'), r = l.getBoundingClientRect(), f = l.parentElement.getBoundingClientRect(); return `legend ${Math.round(r.width)}x${Math.round(r.height)} fieldset ${Math.round(f.width)}x${Math.round(f.height)} scrollY ${Math.round(scrollY)}`; }));
  console.log((await p.evaluate(() => navigator.userAgent)).match(/Version\/[\d.]+/)[0], BASE);
  await m('after load');
  await p.waitForTimeout(3000); await m('3s later');
  // real wheel scrolling down to the form
  await p.evaluate(async () => { document.documentElement.style.scrollBehavior = 'auto'; for (let i = 0; i < 40; i++) { window.scrollBy(0, 120); await new Promise(r => setTimeout(r, 80)); if (document.querySelector('fieldset').getBoundingClientRect().top < 300) break; } });
  await p.waitForTimeout(800); await m('after wheel scroll to form');
  await p.locator('#name, [name=name]').first().fill('Pat'); await m('after typing a name');
  await p.locator('.chip input').nth(1).check({ force: true }); await m('after ticking a chip');
  await p.locator('textarea').first().fill('hello\nthere\nthis is\nmultiline'); await m('after typing details');
  await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(400); await m('rotated to landscape');
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400); await m('rotated back');
  await p.locator('.chip input').nth(1).uncheck({ force: true });
  await p.locator('form button[type=submit], form .btn-primary').first().click({ force: true }).catch(e => console.log('submit click failed'));
  await p.waitForTimeout(600); await m('after submitting with errors');
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('fieldset').scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(300);
  await m('before screenshot 1');
  await p.screenshot({ path: `shots/persist_${process.env.PWLABEL}_1.png` });
  await m('after screenshot 1');
  await p.screenshot({ path: `shots/persist_${process.env.PWLABEL}_2.png` });
  await m('after screenshot 2');
  await b.close();
})().catch(e => { console.log('ERR', String(e.message).slice(0, 800)); process.exit(1); });
