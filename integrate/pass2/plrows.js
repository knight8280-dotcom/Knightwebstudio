// Every price-list row at every 10px: lines taken by the name, the leader's drawn width, and where the price sits.
// node plrows.js BASE [path,path] [from] [to]
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8720';
const PATHS = (process.argv[3] || '/,/services/,/consulting/,/pricing/,/about/,/start/,/web-design-baton-rouge/,/web-design-gonzales/').split(',');
const FROM = +(process.argv[4] || 320), TO = +(process.argv[5] || 1920);
(async () => {
  const b = await chromium.launch();
  const res = {};
  for (const path of PATHS) {
    const ctx = await b.newContext({ viewport: { width: 320, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto(BASE + path, { waitUntil: 'load' });
    await p.evaluate(() => { document.querySelectorAll('details').forEach(d => d.open = false); return document.fonts.ready; });
    for (let w = FROM; w <= TO; w += 10) {
      await p.setViewportSize({ width: w, height: 900 });
      await p.waitForTimeout(60);
      const rows = await p.evaluate(() => [...document.querySelectorAll('.pl-row')].map(row => {
        const n = row.querySelector('.pl-name'), d = row.querySelector('.dots'), pr = row.querySelector('.pl-price');
        if (!n || !pr) return null;
        const nr = n.getBoundingClientRect(), prr = pr.getBoundingClientRect();
        if (!nr.width) return null;
        const lh = parseFloat(getComputedStyle(n).lineHeight);
        let dw = null;
        if (d && getComputedStyle(d).display !== 'none') {
          const b4 = getComputedStyle(d, '::before');
          const drawn = b4.content !== 'none' && b4.display !== 'none';
          const box = d.getBoundingClientRect().width;
          dw = getComputedStyle(d).borderBottomStyle === 'dotted' ? box : (drawn ? Math.max(0, box - parseFloat(b4.marginLeft || 0)) : 0);
        }
        return { t: n.textContent.trim().slice(0, 26), lines: Math.round(nr.height / lh), plines: Math.round(prr.height / parseFloat(getComputedStyle(pr).lineHeight)), under: prr.top > nr.bottom - 4, dots: dw === null ? null : Math.round(dw), gap: Math.round(prr.left - nr.right), over: prr.right > row.getBoundingClientRect().right + 1 };
      }).filter(Boolean));
      for (const r of rows) {
        const k = path + ' | ' + r.t;
        (res[k] = res[k] || []).push([w, r]);
      }
    }
    await ctx.close();
  }
  await b.close();
  const fmt = ws => { if (!ws.length) return '-'; const runs = []; let s = ws[0], prev = ws[0]; for (const w of ws.slice(1)) { if (w !== prev + 10) { runs.push(s === prev ? '' + s : s + '-' + prev); s = w; } prev = w; } runs.push(s === prev ? '' + s : s + '-' + prev); return runs.join(','); };
  for (const [k, arr] of Object.entries(res)) {
    const wrap = arr.filter(([, r]) => r.lines > 1).map(([w]) => w);
    const under = arr.filter(([, r]) => r.under).map(([w]) => w);
    const stub = arr.filter(([, r]) => r.dots !== null && r.dots > 0 && r.dots < 16).map(([w]) => w);
    const nodots = arr.filter(([, r]) => r.dots === 0 && !r.under).map(([w]) => w);
    const pw = arr.filter(([, r]) => r.plines > 1).map(([w]) => w);
    const over = arr.filter(([, r]) => r.over).map(([w]) => w);
    const tight = arr.filter(([, r]) => !r.under && r.gap < 11).map(([w]) => w);
    console.log(k.padEnd(52) + ' name wraps@' + fmt(wrap) + '  price under@' + fmt(under) + '  stub@' + fmt(stub) + '  noleader@' + fmt(nodots) + (pw.length ? '  PRICE-WRAPS@' + fmt(pw) : '') + (over.length ? '  OVER@' + fmt(over) : '') + (tight.length ? '  TIGHT@' + fmt(tight) : ''));
  }
})();
