const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 375, 380, 390]) for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 }, colorScheme: scheme, isMobile: true, hasTouch: true }); await ctx.route(/plausible\.io|calendly\.com|onrender\.com/, r => r.abort());
    await ctx.route(/hcaptcha\.com/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: `(function(){var s=document.getElementById('hcaptcha-slot');var f=document.createElement('iframe');f.style.cssText='width:303px;height:78px;border:0;background:#fafafa;display:block';f.title='hCaptcha';s.appendChild(f);var t=document.createElement('textarea');t.name='h-captcha-response';t.style.display='none';s.appendChild(t);})();` }));
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/contact/', { waitUntil: 'load' }); await p.waitForTimeout(700);
    const r = await p.evaluate(() => { const f = document.querySelector('#hcaptcha-slot iframe').getBoundingClientRect(); const form = document.getElementById('contact-form'); const fr = form.getBoundingClientRect(); const pad = parseFloat(getComputedStyle(form).paddingRight); return { iframe: [Math.round(f.left), Math.round(f.right), Math.round(f.width)], innerRight: Math.round(fr.right - pad), formRight: Math.round(fr.right), over: document.documentElement.scrollWidth - innerWidth, total: document.documentElement.scrollHeight }; });
    console.log(w, scheme, JSON.stringify(r), r.iframe[1] > r.innerRight ? 'WIDGET PAST THE FIELDS BY ' + (r.iframe[1] - r.innerRight) + 'px' : 'fits');
    if (scheme === 'dark' || w === 360) { await p.locator('.captcha-wrap').scrollIntoViewIfNeeded(); await p.evaluate(() => scrollBy(0, 150)); await p.waitForTimeout(500); await p.screenshot({ path: `${__dirname}/misc/captcha-${w}-${scheme}.png` }); }
    await ctx.close(); }
  await b.close();
})();
