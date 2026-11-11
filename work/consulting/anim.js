// Motion check with motion allowed: the ledger bars and the mock sequences end in their resting state.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 }, isMobile: w < 700, hasTouch: w < 700 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/consulting/'); await p.waitForTimeout(600);
    const read = () => p.evaluate(() => ({
      sheetVisible: document.querySelector('.sheet').classList.contains('visible'),
      bars: [...document.querySelectorAll('.ledger-bar span')].map(e => getComputedStyle(e).transform),
      seq: [...document.querySelectorAll('.seq')].map(e => getComputedStyle(e).opacity).join(''),
    }));
    console.log(w, 'before scroll', JSON.stringify(await read()));
    await p.evaluate(() => document.querySelector('.sheet').scrollIntoView({ block: 'center' }));
    await p.waitForTimeout(150); console.log(w, 'at 150ms', JSON.stringify((await read()).bars));
    await p.waitForTimeout(1200); console.log(w, 'after 1.35s', JSON.stringify(await read()));
    // walk the whole page so every reveal fires, then confirm nothing is left hidden
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 500) { await p.evaluate(v => scrollTo(0, v), y); await p.waitForTimeout(120); }
    await p.waitForTimeout(900);
    const left = await p.evaluate(() => [...document.querySelectorAll('main .reveal, main .seq, .ledger-bar span')].filter(e => { const cs = getComputedStyle(e); return +cs.opacity < 1 || (cs.transform !== 'none' && cs.transform !== 'matrix(1, 0, 0, 1, 0, 0)'); }).map(e => e.className));
    console.log(w, 'still hidden or moved after a full scroll:', JSON.stringify(left));
    await ctx.close();
  }
  await b.close();
})();
