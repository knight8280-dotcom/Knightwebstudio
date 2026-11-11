const { webkit } = require(process.env.PWCORE || '/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await webkit.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8720/contact/?package=business'); await p.waitForTimeout(800);
  const pre = await p.evaluate(() => ({ js: document.documentElement.className, kws: window.kwsReady, pkg: document.getElementById('package').value, noValidate: document.getElementById('contact-form').noValidate, btn: (() => { const r = document.getElementById('submit-btn').getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; })(), scrollY }));
  console.log('before', JSON.stringify(pre));
  await p.click('#submit-btn'); await p.waitForTimeout(600);
  const post = await p.evaluate(() => ({ status: document.getElementById('form-status').textContent, statusClass: document.getElementById('form-status').className, invalid: [...document.querySelectorAll('.invalid')].map(e => e.id), active: document.activeElement.id || document.activeElement.tagName, url: location.href, btnText: document.getElementById('submit-btn').textContent, hit: (() => { const r = document.getElementById('submit-btn').getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return e && (e.id || e.tagName + '.' + e.className); })() }));
  console.log('after click', JSON.stringify(post));
  console.log('errors', JSON.stringify(errs.slice(0, 6)));
  await b.close();
})();
