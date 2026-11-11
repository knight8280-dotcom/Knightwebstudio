const { open, done, close } = require('./lib');
(async () => {
  for (const p of ['/', '/web-design-gonzales/']) for (const w of [1100, 1179, 1279, 1280]) {
    const page = await open(p, w);
    await page.addStyleTag({ content: '@media (min-width:1100px) and (max-width:1279.98px){ .tier-plan { min-height: 4.5em; } }' });
    const r = await page.evaluate(() => [...document.querySelectorAll('.board-tiers .tier')].map(t => Math.round(t.querySelector('.tier-plan').getBoundingClientRect().height) + '/' + Math.round(t.querySelector('.tier-note').getBoundingClientRect().top + scrollY)));
    console.log('VA-09 4.5em', p, w, r.join(' '), 'overflowX', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
    await done(page);
  }
  // VA-10 nowrap on the receipt and Commerce note
  for (const w of [360, 390, 430]) {
    const page = await open('/consulting/', w);
    const r = await page.evaluate(() => { const s = [...document.querySelectorAll('.receipt li span:first-child')].find(x => /up to 5 pages/.test(x.textContent)); s.innerHTML = s.innerHTML.replace('5 pages', '<span class="nowrap">5 pages</span>'); const li = s.closest('li'); return { nameW: Math.round(s.getBoundingClientRect().width), nameH: Math.round(s.getBoundingClientRect().height), rowW: Math.round(li.getBoundingClientRect().width), rowScrollW: li.scrollWidth, overflowX: document.documentElement.scrollWidth - innerWidth }; });
    console.log('VA-10 receipt nowrap', w, JSON.stringify(r));
    await done(page);
  }
  for (const w of [1100, 1280, 1440]) {
    const page = await open('/start/', w);
    const r = await page.evaluate(() => { const n = document.querySelector('.board-tiers li:nth-child(4) .tier-note'); const before = n.getBoundingClientRect().height; n.innerHTML = n.innerHTML.replace('6 months', '<span class="nowrap">6 months</span>'); return { has: /nowrap">6 months/.test(n.innerHTML), before: Math.round(before), after: Math.round(n.getBoundingClientRect().height), html: n.innerHTML.slice(0, 160) }; });
    console.log('VA-10 start commerce nowrap', w, JSON.stringify(r));
    await done(page);
  }
  await close();
})();
