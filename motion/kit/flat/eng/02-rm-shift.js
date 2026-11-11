// Under reduced motion (site CSS kills animations) what does the visitor see before the script upgrades? Measure document geometry before/after.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8730/kit/flat/demo.html';
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [1440, 900]]) for (const cfg of [{ rm: 'reduce' }, { rm: 'no-preference' }, { rm: 'no-preference', motionOff: true }]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: cfg.rm });
    await ctx.route(/\/(arc|spotlight)\.js/, async r => { await new Promise(x => setTimeout(x, 900)); r.continue(); });
    await ctx.addInitScript((off) => { if (off) new MutationObserver((m, o) => { if (document.documentElement) { document.documentElement.setAttribute('data-motion', 'off'); o.disconnect(); } }).observe(document, { childList: true });
      window.__cls = 0; window.__shifts = [];
      new PerformanceObserver(l => { for (const e of l.getEntries()) { window.__cls += e.value; window.__shifts.push(e.value.toFixed(4) + '@' + Math.round(e.startTime) + (e.hadRecentInput ? ' (input)' : '')); } }).observe({ type: 'layout-shift', buffered: true }); }, !!cfg.motionOff);
    const p = await ctx.newPage();
    await p.goto(URL, { waitUntil: 'commit' }); await p.waitForTimeout(600);
    const geo = () => p.evaluate(() => ({ live: !!document.querySelector('.is-live'), docH: document.documentElement.scrollHeight,
      arcH: Math.round(document.querySelector('#services .kws-arc').getBoundingClientRect().height), spotH: Math.round(document.querySelector('#work .kws-spot').getBoundingClientRect().height),
      workTop: Math.round(document.querySelector('#work').getBoundingClientRect().top + scrollY), items: [...document.querySelectorAll('#services .kws-arc li')].filter(li => li.getBoundingClientRect().height > 10).length }));
    const before = await geo();
    const tag = `${w}-${cfg.rm}${cfg.motionOff ? '-motionoff' : ''}`;
    await p.screenshot({ path: `rm-before-${tag}.png` });
    await p.waitForTimeout(1500);
    const after = await geo();
    await p.screenshot({ path: `rm-after-${tag}.png` });
    const cls = await p.evaluate(() => [window.__cls.toFixed(4), window.__shifts]);
    console.log(tag, 'before', JSON.stringify(before), 'after', JSON.stringify(after), 'CLS', JSON.stringify(cls));
    await ctx.close();
  }
  await b.close();
})();
