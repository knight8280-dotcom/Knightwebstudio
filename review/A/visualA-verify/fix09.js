const { open, done, close, shotEl } = require('./lib');
const path = require('path');
const FIX = `@media (min-width: 1100px) { @supports (grid-template-rows: subgrid) {
  .board-tiers { grid-template-rows: repeat(4, auto); }
  .board-tiers li, .board-tiers .tier { display: grid; grid-template-columns: minmax(0, 1fr); grid-row: span 4; grid-template-rows: subgrid; row-gap: 0; align-items: start; }
} }`;
(async () => {
  for (const p of ['/', '/start/', '/web-design-baton-rouge/']) for (const w of [1100, 1160, 1179, 1280, 1440]) {
    const page = await open(p, w);
    const m = () => page.evaluate(() => { const ts = [...document.querySelectorAll('.board-tiers .tier')]; return { kids: ts.map(t => t.children.length).join(''), noteTop: ts.map(t => Math.round(t.querySelector('.tier-note').getBoundingClientRect().top + scrollY)), amtTop: ts.map(t => Math.round(t.querySelector('.tier-amt').getBoundingClientRect().top + scrollY)), planTop: ts.map(t => Math.round(t.querySelector('.tier-plan').getBoundingClientRect().top + scrollY)), boardH: Math.round(document.querySelector('.board-tiers').getBoundingClientRect().height), tierH: ts.map(t => Math.round(t.getBoundingClientRect().height)) }; });
    const before = await m();
    await page.addStyleTag({ content: FIX });
    const after = await m();
    const off = before.noteTop[0];
    console.log(p, w, 'kids', before.kids, '| before note', before.noteTop.map(v => v - off).join(','), 'boardH', before.boardH, '| after note', after.noteTop.map(v => v - after.noteTop[0]).join(','), 'boardH', after.boardH, 'tierH', after.tierH.join(','), 'amtΔ', after.amtTop[0] - before.amtTop[0], 'planΔ', after.planTop[0] - before.planTop[0]);
    if (p === '/' && w === 1100) await shotEl(page, '.board-tiers', path.join(__dirname, 'fix09_home_1100_subgrid.png'), 20);
    await done(page);
  }
  await close();
})();
