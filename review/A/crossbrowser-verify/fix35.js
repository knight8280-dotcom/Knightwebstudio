// OB-03 stopgap and OB-05 fix, checked with the files patched in flight
const pw = require(process.env.PWCORE); const eng = pw[process.env.ENGINE]; const fs = require('fs');
const css = fs.readFileSync('/home/user/Knightwebstudio/assets/css/styles.css', 'utf8') + '\n.appt-title { white-space: nowrap; }\n';
const js0 = fs.readFileSync('/home/user/Knightwebstudio/assets/js/main.js', 'utf8'); const js = js0.replace('navToggle.focus();', 'navToggle.focus({ preventScroll: true });'); if (js === js0) throw new Error('anchor');
(async () => {
  const b = await eng.launch();
  // OB-03
  const out = [];
  for (const w of [980, 1040, 1100, 1160, 1200, 1280, 1440, 1920]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
    await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
    await ctx.route('**/assets/css/styles.css*', r => r.fulfill({ contentType: 'text/css', body: css }));
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const t = document.querySelector('.appt-title'), c = t.closest('.appt'); const rng = document.createRange(); rng.selectNodeContents(t); const tr = rng.getBoundingClientRect(); const cr = c.getBoundingClientRect(); const pr = parseFloat(getComputedStyle(c).paddingRight); return { h: +t.getBoundingClientRect().height.toFixed(1), over: +(tr.right - (cr.right - pr)).toFixed(2), card: +cr.width.toFixed(2), band: Math.round(document.querySelector('.cta-band').getBoundingClientRect().height), docOver: document.documentElement.scrollWidth - innerWidth }; });
    out.push(`${w}: title ${r.h}px high, text past the card's inner edge by ${r.over}px, card ${r.card}, band ${r.band}, page overflow ${r.docOver}`);
    await ctx.close();
  }
  console.log(` ${process.env.ENGINE} OB-03 with nowrap`); out.forEach(o => console.log('    ' + o));
  // OB-05
  for (const [w, h] of [[390, 844], [1000, 800]]) for (const patched of [false, true]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
    if (patched) await ctx.route('**/assets/js/main.js*', r => r.fulfill({ contentType: 'application/javascript', body: js }));
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.waitForTimeout(400);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 3000); }); await p.waitForTimeout(400);
    const c = await p.evaluate(() => { const e = document.querySelector('#nav-toggle').getBoundingClientRect(); return [e.left + e.width / 2, e.top + e.height / 2]; });
    await p.mouse.click(c[0], c[1]); await p.waitForTimeout(600); await p.keyboard.press('Escape'); await p.waitForTimeout(800);
    const r = await p.evaluate(() => ({ y: Math.round(scrollY), focus: document.activeElement.id, exp: document.querySelector('#nav-toggle').getAttribute('aria-expanded') }));
    console.log(` ${process.env.ENGINE} OB-05 ${w}px ${patched ? 'patched ' : 'as shipped'}: after open+Escape scrollY 3000 -> ${r.y}, focus on #${r.focus}, expanded=${r.exp}`);
    await ctx.close();
  }
  await b.close();
})().catch(e => { console.log('ERR', String(e.message).slice(0, 800)); process.exit(1); });
