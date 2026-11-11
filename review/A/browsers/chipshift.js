const pw = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await pw.webkit.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/contact/'); await p.waitForTimeout(600);
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('.chips').scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(200);
  const snap = () => p.evaluate(() => [...document.querySelectorAll('.chip')].map(c => { const r = c.getBoundingClientRect(); return c.textContent.trim() + '@' + Math.round(r.left) + ',' + Math.round(r.top) + ' w' + Math.round(r.width); }).join(' | ') + ' || fieldset h ' + Math.round(document.querySelector('fieldset').getBoundingClientRect().height));
  console.log('before      ', await snap());
  for (const v of ['E-commerce', 'SEO']) { const bb = await p.locator(`input[value="${v}"]`).boundingBox(); await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(200); console.log(('tap ' + v).padEnd(12), await snap()); }
  await p.screenshot({ path: 'view/chipshift_390.png' });
  await b.close();
})();
