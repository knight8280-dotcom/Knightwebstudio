const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/process/', '/work/']) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(500);
    const before = await p.evaluate(() => [...document.querySelectorAll('.reveal')].map(e => [e.className, getComputedStyle(e).opacity, getComputedStyle(e).transform]));
    await p.emulateMedia({ media: 'print' }); await p.waitForTimeout(700);
    const after = await p.evaluate(() => [...document.querySelectorAll('.reveal')].map(e => [e.className, getComputedStyle(e).opacity, getComputedStyle(e).transform]));
    console.log(path, 'screen (not scrolled):', JSON.stringify(before), '\n   print:', JSON.stringify(after));
    await p.screenshot({ path: `snaps/print_${path.replace(/\//g, '')}.png`, fullPage: true });
    await ctx.close();
  }
  // stamp landing frames (motion allowed), phone
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/process/', { waitUntil: 'load' }); await p.waitForTimeout(500);
  const info = await p.evaluate(async () => {
    const st = document.querySelector('.stamp'); const out = [];
    const y0 = st.getBoundingClientRect().top + scrollY;
    for (let y = y0 - innerHeight - 60; y < y0 - innerHeight + 200; y += 10) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); const r = st.getBoundingClientRect(); const bar = document.getElementById('mobile-cta'); const br = bar.getBoundingClientRect(); if (st.classList.contains('visible')) { out.push({ y, stampTop: Math.round(r.top), stampBottom: Math.round(r.bottom), barShown: bar.classList.contains('show'), barTop: Math.round(br.top), vh: innerHeight }); break; } }
    return out;
  });
  console.log('stamp becomes visible at:', JSON.stringify(info));
  await b.close();
})();
