// How the closing group's demo behaves with this group's new files (read-only look; nothing of theirs is changed).
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); await c.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8730/kit/closing/demo.html'); await p.waitForTimeout(3000);
  const r = await p.evaluate(() => ({ motionJs: !!(window.KWS && KWS.motion), layers: [...document.querySelectorAll('.kws-shader')].map(e => ({ host: (e.parentElement.className || '').split(' ').slice(0, 2).join('.'), live: e.classList.contains('is-live'), glints: e.querySelectorAll('.kws-glints i').length })), buttons: [...document.querySelectorAll('.kws-motion')].map(e => e.hidden) }));
  console.log(JSON.stringify(r, null, 1)); console.log('errors', errs);
  await b.close();
})();
