// A11Y-04: how is the current page marked in the phone menu? Compare every computed property of the current link with a sibling.
const { chromium } = require('playwright');
const BASE = 'http://localhost:8720';
const BLOCK = /plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com|web3forms\.com/;
const lum = c => { const v = c.map(x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
const rgb = s => s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
(async () => {
  const b = await chromium.launch();
  for (const scheme of ['light', 'dark']) for (const w of [390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 }, colorScheme: scheme });
    await ctx.route(BLOCK, r => r.abort());
    const p = await ctx.newPage();
    await p.goto(BASE + '/pricing/', { waitUntil: 'load' });
    if (w < 1100) { await p.click('#nav-toggle'); await p.waitForTimeout(600); }
    const d = await p.evaluate(() => {
      const cur = document.querySelector('#nav .nav-links [aria-current="page"]');
      const oth = [...document.querySelectorAll('#nav .nav-links a')].find(a => a !== cur);
      const diff = {};
      for (const pseudo of [null, '::before', '::after']) {
        const a = getComputedStyle(cur, pseudo), o = getComputedStyle(oth, pseudo);
        for (const k of a) { if (a[k] !== o[k] && !/^(width|inline-size|perspective-origin|transform-origin|block-size|height)$/.test(k)) diff[(pseudo || '') + k] = [a[k], o[k]]; }
      }
      return { cur: cur.textContent.trim(), oth: oth.textContent.trim(), diff, bg: getComputedStyle(document.querySelector('.nav')).backgroundColor, curColor: getComputedStyle(cur).color, othColor: getComputedStyle(oth).color, sr: cur.querySelector('.sr-only') ? cur.querySelector('.sr-only').textContent : null, html: cur.outerHTML };
    });
    console.log(`${scheme} ${w}: current "${d.cur}" vs "${d.oth}"`);
    console.log('   html:', d.html);
    console.log('   differing computed properties:', JSON.stringify(d.diff));
    try { console.log('   current vs other text colour contrast:', cr(rgb(d.curColor), rgb(d.othColor)).toFixed(2), '| current vs background:', cr(rgb(d.curColor), rgb(d.bg)).toFixed(2), d.curColor, d.othColor, d.bg); } catch (e) { console.log('   colours', d.curColor, d.othColor, d.bg); }
    if (w < 1100) await p.screenshot({ path: `shots/v04_menu_${scheme}_${w}.png` });
    await ctx.close();
  }
  await b.close();
})();
