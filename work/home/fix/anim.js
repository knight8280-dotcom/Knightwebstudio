// The hero phone's arrival: on load from 980px, on scroll below it. Samples opacity over time.
const { chromium } = require('playwright');
const sample = p => p.evaluate(() => { const op = e => +(+getComputedStyle(e).opacity).toFixed(2); const ph = document.querySelector('.hero-phone');
  const dots = [...ph.querySelectorAll('.bubble-typing i')].map(i => { const a = i.getAnimations()[0]; return a ? a.playState[0] + Math.round(a.currentTime) : '-'; });
  return { vis: ph.classList.contains('visible') ? 1 : 0, phone: op(ph), items: [...ph.querySelectorAll('.thread > li')].map(op).join(' '), dots: dots.join(' '), anims: document.getAnimations().length }; });
(async () => {
  const b = await chromium.launch();
  { // desktop: plays on load, without waiting for main.js
    for (const blockJs of [false, true]) {
      const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      if (blockJs) await ctx.route(/assets\/js\/main\.js/, r => r.abort());
      const p = await ctx.newPage(); const t0 = Date.now(); await p.goto('http://localhost:8720/', { waitUntil: 'commit' });
      console.log(blockJs ? '1280, main.js never arrives:' : '1280, on load:');
      for (const t of [150, 300, 450, 600, 800, 1200, 2500, 4600]) { await p.waitForTimeout(Math.max(0, t - (Date.now() - t0))); try { console.log('  ', String(Date.now() - t0).padStart(5), 'ms', JSON.stringify(await sample(p))); } catch (e) { console.log('  ', t, 'not ready'); } }
      await ctx.close();
    }
  }
  { // phone: hidden until it is scrolled to, then arrives; dots hop after that
    const ctx = await b.newContext({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/'); await p.waitForTimeout(1500);
    console.log('390x664, before scrolling:', JSON.stringify(await sample(p)));
    await p.evaluate(() => scrollTo(0, 560)); const t0 = Date.now();
    for (const t of [80, 200, 350, 500, 700, 1000, 1600, 3000, 5000]) { await p.waitForTimeout(Math.max(0, t - (Date.now() - t0))); console.log('  ', String(Date.now() - t0).padStart(5), 'ms after the scroll', JSON.stringify(await sample(p))); }
    await ctx.close();
  }
  await b.close();
})();
