// The held space. (1) The kit scripts never arrive but the head snippet has set html.kws-hold: the space is held exactly like the live
// carousel, and after 4s the plain list comes back in its script-off layout. The hold is a class and a timer, so it must behave the
// same with reduced motion on. (2) Calling the remover after the hold has ended gives the whole list back at once.
const { chromium, say, done, open } = require('./lib');
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1440]) for (const rm of [false, true]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: w < 700 ? 2 : 1, reducedMotion: rm ? 'reduce' : 'no-preference' });
    await ctx.route(/\/(arc|spotlight)\.js/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8730/kit/flat/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(500);
    const look = () => p.evaluate(() => ['#services .kws-arc', '#work .kws-spot'].map(s => { const el = document.querySelector(s); const lis = [...el.querySelectorAll('li')].filter(li => li.getBoundingClientRect().height > 10);
      return { h: Math.round(el.getBoundingClientRect().height), showing: lis.length, cols: new Set(lis.map(li => Math.round(li.getBoundingClientRect().left))).size }; }));
    const early = await look();
    if (!rm) { await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.querySelector('#services').getBoundingClientRect().top + scrollY - 70); }); await p.waitForTimeout(200); await p.screenshot({ path: `${__dirname}/../shots/held-${w}-before-script.png` }); }
    await p.waitForTimeout(4200); const late = await look();
    if (!rm) await p.screenshot({ path: `${__dirname}/../shots/held-${w}-script-never-came.png` });
    const cols = w < 700 ? 1 : 3;
    say(`${w}px${rm ? ', reduced motion' : ''}: one item held at first; after 4s all nine and all three are back, ${cols} across as with script off`,
      early.every(x => x.showing === 1) && late[0].showing === 9 && late[1].showing === 3 && late.every(x => x.cols === cols), `held ${early.map(x => x.h + 'px').join(' and ')}; list ${late.map(x => x.h + 'px, ' + x.cols + ' across').join(' and ')}`);
    await ctx.close();
  }
  { const { ctx, p } = await open(b); await p.waitForTimeout(4200);
    const r = await p.evaluate(() => [['arc', '#services .kws-arc'], ['spotlight', '#work .kws-spot']].map(([name, s]) => { const el = document.querySelector(s); KWS[name].mount(el)();
      return [...el.querySelectorAll('li')].filter(li => li.getBoundingClientRect().height > 10).length; }));
    say('the remover, called once the hold has ended, gives the whole plain list back at once', r[0] === 9 && r[1] === 3, r.join(' and ') + ' items showing');
    await ctx.close(); }
  await done(b);
})();
