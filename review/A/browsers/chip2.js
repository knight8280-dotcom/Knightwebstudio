const pw = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await pw.firefox.launch(); const ctx = await b.newContext({ viewport: { width: +process.env.W || 1440, height: 900 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/contact/?package=business');
  await p.click('#submit-btn');
  await p.fill('#name', 'Test Person'); await p.fill('#email', 'test@example.com'); await p.fill('#company', 'Test Co'); await p.fill('#message', 'A test enquiry with enough detail.');
  const loc = p.locator('input[name="services"][value="Automation"]');
  await loc.scrollIntoViewIfNeeded();
  const info = await loc.evaluate(el => { const r = el.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const hit = document.elementFromPoint(x, y); return { x, y, top: r.top, sy: scrollY, hit: hit ? hit.tagName + '.' + hit.className + '#' + hit.id : null, hdr: document.getElementById('site-header').getBoundingClientRect().bottom }; });
  console.log(JSON.stringify(info));
  try { await loc.check({ force: true, timeout: 3000 }); console.log('check ok'); } catch (e) { console.log('check failed:', String(e.message).split('\n')[0]); }
  const info2 = await loc.evaluate(el => { const r = el.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const hit = document.elementFromPoint(x, y); return { x, y, top: r.top, sy: scrollY, checked: el.checked, hit: hit ? hit.tagName + '.' + hit.className + '#' + hit.id : null }; });
  console.log(JSON.stringify(info2));
  await b.close();
})();
