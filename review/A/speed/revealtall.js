// Can every .reveal block actually be revealed? (IntersectionObserver threshold 0.08 with a bottom margin of 96px on phones / 24px.)
// A block taller than (viewport - margin) / 0.08 can never show 8% of itself, and stays invisible. Also: scroll every page to the end and count blocks still hidden.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const PAGES = ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/web-design-denham-springs/', '/web-design-gonzales/', '/web-design-prairieville/', '/privacy/', '/terms/', '/checkout/', '/checkout/success/', '/404.html'];
(async () => {
  const browser = await chromium.launch();
  for (const [vw, vh, mob] of [[390, 844, true], [844, 390, true], [320, 480, true], [667, 375, true], [1280, 600, false], [1920, 1080, false], [1024, 400, false]]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, isMobile: mob, hasTouch: mob });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    let worst = null, stuck = 0;
    for (const p of PAGES) {
      const page = await ctx.newPage(); await page.goto('http://localhost:8720' + p, { waitUntil: 'load' }); await page.waitForTimeout(300);
      const pre = await page.evaluate(() => { const foot = document.getElementById('mobile-cta') && matchMedia('(max-width: 1099.98px)').matches ? 96 : 24; const lim = (innerHeight - foot) / 0.08; let w = null; document.querySelectorAll('.reveal').forEach(el => { const h = el.getBoundingClientRect().height; if (!w || h > w.h) w = { h: Math.round(h), c: el.className.slice(0, 50), need: Math.round(h * 0.08), room: innerHeight - foot }; }); return { w, lim: Math.round(lim) }; });
      // read like a person: step down the page, then check what is still hidden
      await page.evaluate(async () => { const H = document.documentElement.scrollHeight; for (let y = 0; y <= H; y += Math.round(innerHeight * 0.6)) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); } window.scrollTo(0, H); await new Promise(r => setTimeout(r, 700)); });
      const left = await page.evaluate(() => [...document.querySelectorAll('.reveal:not(.visible)')].filter(e => e.getBoundingClientRect().height > 0).map(e => e.tagName.toLowerCase() + '.' + e.className.slice(0, 40) + ' h=' + Math.round(e.getBoundingClientRect().height) + ' "' + e.textContent.trim().replace(/\s+/g, ' ').slice(0, 40) + '"'));
      const seqLeft = await page.evaluate(() => [...document.querySelectorAll('.reveal .seq')].filter(e => getComputedStyle(e).opacity !== '1' && e.getBoundingClientRect().height > 0).length);
      if (pre.w && (!worst || pre.w.need / pre.w.room > worst.r)) worst = { r: pre.w.need / pre.w.room, p, ...pre.w };
      if (left.length || seqLeft) { stuck += left.length; console.log(`${vw}x${vh} ${p}: STILL HIDDEN after scrolling to the end: ${left.length} blocks, ${seqLeft} inner steps :: ${left.slice(0, 4).join(' | ')}`); }
      await page.close();
    }
    console.log(`-- ${vw}x${vh}: blocks left hidden after a full scroll: ${stuck}; tallest reveal block needs ${worst.need}px of ${worst.room}px available (${worst.p} ${worst.c}, ${worst.h}px tall)`);
    await ctx.close();
  }
  await browser.close();
})();
