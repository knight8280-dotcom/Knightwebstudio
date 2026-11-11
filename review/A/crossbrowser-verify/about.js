// OB-06: the About business card tagline, lines per width; does this build support container queries?
const { webkit } = require(process.env.PWCORE);
(async () => {
  const b = await webkit.launch(); const out = [];
  for (const w of [980, 1024, 1040, 1100, 1180, 1279, 1280, 1366]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
    await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/about/', { waitUntil: 'load' }); await p.waitForTimeout(700);
    const r = await p.evaluate(() => { const s = document.querySelector('.bizcard-top span'); const rng = document.createRange(); rng.selectNodeContents(s); const tops = [...new Set([...rng.getClientRects()].map(x => Math.round(x.top)))]; const c = document.querySelector('.bizcard'); return { cq: CSS.supports('container-type', 'inline-size'), lines: tops.length, card: Math.round(c.getBoundingClientRect().width), text: s.textContent.trim(), vis: getComputedStyle(c).opacity }; });
    out.push(`${w}: ${r.lines} line(s), card ${r.card}px, containerQueries=${r.cq}`);
    if (w === 1024 || w === 980) { const el = await p.$('.bizcard'); await el.screenshot({ path: `shots/about_${process.env.PWLABEL}_${w}.png` }); if (w === 1024) await p.screenshot({ path: `shots/about_${process.env.PWLABEL}_${w}_page.png` }); }
    await ctx.close();
  }
  console.log((await (async () => { const p = await b.newPage(); const u = await p.evaluate(() => navigator.userAgent); return u.match(/Version\/[\d.]+/)[0]; })())); out.forEach(o => console.log('   ' + o));
  await b.close();
})().catch(e => { console.log('ERR', String(e.message).slice(0, 800)); process.exit(1); });
