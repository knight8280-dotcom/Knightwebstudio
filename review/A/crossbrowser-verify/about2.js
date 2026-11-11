// OB-06: emulate a browser without container queries by stripping @container blocks + container-type from the stylesheet (what Safari 15 would ignore)
const pw = require(process.env.PWCORE); const eng = pw[process.env.ENGINE || 'webkit']; const fs = require('fs');
function strip(css) {
  // remove @container {...} blocks (balanced braces) and container-type declarations; make @supports (container-type...) false
  let out = '', i = 0;
  while (i < css.length) {
    const j = css.indexOf('@container', i);
    if (j < 0) { out += css.slice(i); break; }
    out += css.slice(i, j);
    let k = css.indexOf('{', j), depth = 1; k++;
    while (depth && k < css.length) { if (css[k] === '{') depth++; else if (css[k] === '}') depth--; k++; }
    i = k;
  }
  out = out.replace(/@supports\s+not\s*\(container-type:\s*inline-size\)/g, '@supports (display:block)').replace(/@supports\s*\(container-type:\s*inline-size\)/g, '@supports (display:nonesuch)');
  return out.replace(/container-type\s*:\s*[^;}]+;?/g, '');
}
(async () => {
  const css = fs.readFileSync('/home/user/Knightwebstudio/assets/css/styles.css', 'utf8'); const stripped = strip(css);
  const b = await eng.launch();
  for (const mode of ['as shipped', 'no container queries']) {
    const out = [];
    for (const w of [980, 1024, 1040, 1100, 1180, 1280]) {
      const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
      await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
      if (mode !== 'as shipped') await ctx.route('**/assets/css/styles.css*', r => r.fulfill({ contentType: 'text/css', body: stripped }));
      const p = await ctx.newPage(); await p.goto('http://localhost:8720/about/', { waitUntil: 'load' }); await p.waitForTimeout(900);
      const r = await p.evaluate(() => { const s = document.querySelector('.bizcard-top span'); const lh = parseFloat(getComputedStyle(s).lineHeight) || parseFloat(getComputedStyle(s).fontSize) * 1.2; const h = s.getBoundingClientRect().height; const c = document.querySelector('.bizcard'); return { h: +h.toFixed(1), lh: +lh.toFixed(1), card: Math.round(c.getBoundingClientRect().width), text: s.textContent.trim().replace(/\s+/g, ' '), disp: getComputedStyle(s).display }; });
      out.push(`${w}: tagline box ${r.h}px high (line ${r.lh}px) => ${Math.round(r.h / r.lh)} line(s), card ${r.card}px`);
      if (w === 1024) { const el = await p.$('.bizcard'); await el.screenshot({ path: `shots/about_${mode.replace(/ /g, '-')}_${w}.png` }); }
      await ctx.close();
    }
    console.log(mode); out.forEach(o => console.log('   ' + o));
  }
  await b.close();
})().catch(e => { console.log('ERR', String(e.message).slice(0, 800)); process.exit(1); });
