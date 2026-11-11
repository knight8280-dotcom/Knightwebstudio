// OB-02 fix check: with the proposed padding rule, does anything move when chips are ticked? Also crop a picture of ticked chips.
const pw = require(process.env.PWCORE); const eng = pw[process.env.ENGINE];
const FIX = process.env.FIXCSS || '.chip :checked + span { padding-inline: calc((var(--s-4) - .3em) / 2); }';
(async () => {
  const b = await eng.launch();
  for (const w of [360, 390, 430, 820, 1100, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 }, hasTouch: w < 900 });
    await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/contact/', { waitUntil: 'load' }); await p.addStyleTag({ content: FIX }); await p.waitForTimeout(400);
    const snap = () => p.evaluate(() => JSON.stringify([...document.querySelectorAll('.chip')].map(c => { const r = c.getBoundingClientRect(); return [+(r.left).toFixed(1), +(r.top + scrollY).toFixed(1), +r.width.toFixed(1)]; }).concat([[document.querySelector('fieldset.field').getBoundingClientRect().height]])));
    const before = await snap(); let moved = 0;
    const n = await p.locator('.chip input').count();
    for (let i = 0; i < n; i++) { await p.locator('.chip input').nth(i).check({ force: true }); if ((await snap()) !== before) moved++; }
    const all = await snap();
    console.log(`  ${process.env.ENGINE} ${w}: states that moved something: ${moved} of ${n}; all ticked same as none: ${all === before}`);
    if (w === 390) { await p.locator('.chip input').nth(3).uncheck({ force: true }); await p.locator('.chip input').nth(5).uncheck({ force: true }); const el = await p.$('fieldset.field'); await el.screenshot({ path: `shots/chipfix_${process.env.ENGINE}_${process.env.TAG || 'reviewer'}.png` }); }
    await ctx.close();
  }
  await b.close();
})().catch(e => { console.log('ERR', String(e.message).slice(0, 800)); process.exit(1); });
