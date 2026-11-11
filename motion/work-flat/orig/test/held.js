// The kit scripts never arrive (blocked) but html.js is set: the space is held like the live carousel, and after 4s the plain list comes back.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const rm of [false, true]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: rm ? 'reduce' : 'no-preference' });
    await ctx.route(/\/(arc|spotlight)\.js/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8730/kit/flat/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(500);
    const look = () => p.evaluate(() => ['#services .kws-arc', '#work .kws-spot'].map(s => { const el = document.querySelector(s); const lis = [...el.querySelectorAll('li')];
      return { h: Math.round(el.getBoundingClientRect().height), showing: lis.filter(li => li.getBoundingClientRect().height > 10).length, js: document.documentElement.classList.contains('js') }; }));
    const early = await look();
    if (!rm) { await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.querySelector('#services').getBoundingClientRect().top + scrollY - 70); }); await p.waitForTimeout(200); await p.screenshot({ path: __dirname + '/../shots/held-390-before-script.png' }); }
    await p.waitForTimeout(4200); const late = await look();
    if (!rm) await p.screenshot({ path: __dirname + '/../shots/held-390-script-never-came.png' });
    const ok = rm ? early.every(x => x.showing > 1) && late[0].showing === 9 && late[1].showing === 3 : early.every(x => x.showing === 1) && late[0].showing === 9 && late[1].showing === 3;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${rm ? 'reduced motion' : 'normal'}: at 0.5s ${JSON.stringify(early.map(x => [x.h, x.showing]))} (height, items showing); at 4.7s ${JSON.stringify(late.map(x => [x.h, x.showing]))}; html.js still set: ${late[0].js}`); if (!ok) bad++;
    await ctx.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
