// Reflow (320), zoom 200% (640x400), text spacing overrides: find text that is clipped, off-screen or spilling out of its box.
// node reflow.js [--modes w320,w320short,zoom200,spacing390,spacing1280] [--pages ...] [--theme light] [--shots]
const { chromium, BASE, PAGES, slug, ctxFor } = require('./lib');
const fs = require('fs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const MODES = { w320: { w: 320, h: 568 }, w320short: { w: 320, h: 256 }, zoom200: { w: 640, h: 400 }, spacing390: { w: 390, h: 844, spacing: true }, spacing1280: { w: 1280, h: 800, spacing: true }, spacing320: { w: 320, h: 568, spacing: true }, base390: { w: 390, h: 844 }, base1280: { w: 1280, h: 800 }, spacing820: { w: 820, h: 1000, spacing: true }, spacing1024: { w: 1024, h: 768, spacing: true } };
const modes = arg('modes', 'w320,zoom200,spacing390,spacing1280').split(',');
const pages = arg('pages', PAGES.join(',')).split(',');
const theme = arg('theme', 'light'); const shots = process.argv.includes('--shots');
const SPACING = `*{line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important} p{margin-bottom:2em !important}`;
const detect = () => {
  const vw = document.documentElement.clientWidth; const out = []; const seen = new Set();
  const sel = el => { const p = []; for (let e = el; e && e !== document.body && p.length < 3; e = e.parentElement) p.unshift(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 3).join('.') : '')); return p.join('>'); };
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (tw.nextNode()) {
    const n = tw.currentNode; const txt = n.textContent.trim(); if (!txt) continue;
    const pe = n.parentElement; if (!pe || pe.closest('script,style,noscript,.sr-only,[hidden],svg,.skip-link,.hp,option')) continue;
    if (!pe.checkVisibility({ checkVisibilityCSS: true })) continue;
    let tiny=false; for(let a=pe;a&&a!==document.body;a=a.parentElement){const b=a.getBoundingClientRect(); const c=getComputedStyle(a); if(b.width<=2&&b.height<=2&&c.overflow!=='visible'){tiny=true;break;}} if(tiny) continue;
    const range = document.createRange(); range.selectNodeContents(n);
    const rects = [...range.getClientRects()].filter(r => r.width > 0.5 && r.height > 0.5);
    for (const r of rects) {
      const probs = [];
      if (r.right > vw + 1.5) probs.push(`off-right by ${Math.round(r.right - vw)}px`);
      if (r.left < -1.5) probs.push(`off-left by ${Math.round(-r.left)}px`);
      // own box spill (fixed height / nowrap)
      for (let a = pe; a && a !== document.documentElement; a = a.parentElement) {
        const cs = getComputedStyle(a); const ox = cs.overflowX, oy = cs.overflowY; if (ox === 'visible' && oy === 'visible') continue;
        if (a === document.body) continue;
        const b = a.getBoundingClientRect(); const bl = parseFloat(cs.borderLeftWidth), br = parseFloat(cs.borderRightWidth), bt = parseFloat(cs.borderTopWidth), bb = parseFloat(cs.borderBottomWidth);
        const L = b.left + bl, R = b.right - br, T = b.top + bt, B = b.bottom - bb;
        const scrollX = /auto|scroll/.test(ox), scrollY = /auto|scroll/.test(oy);
        if (ox !== 'visible' && (r.right > R + 2 || r.left < L - 2)) probs.push((scrollX ? 'h-scroll in ' : 'CLIPPED-x by ') + sel(a) + ` (${Math.round(Math.max(r.right - R, L - r.left))}px)`);
        if (oy !== 'visible' && (r.bottom > B + 3 || r.top < T - 3) && !scrollY) probs.push('CLIPPED-y by ' + sel(a) + ` (${Math.round(Math.max(r.bottom - B, T - r.top))}px)`);
      }
      if (probs.length) { const k = sel(pe) + '|' + probs.join(';'); if (!seen.has(k)) { seen.add(k); out.push({ el: sel(pe), text: txt.slice(0, 50), probs, y: Math.round(r.top + scrollY) }); } }
    }
  }
  // non-text boxes off the edge
  for (const el of document.querySelectorAll('main img, main svg, main .btn, main button, main input, main select, main textarea, main table, main figure, .site-header *, .site-footer a, .mobile-cta a, .topbar a')) {
    if (!el.checkVisibility({ checkVisibilityCSS: true }) || el.closest('.sr-only,.hp,[hidden]')) continue; const r = el.getBoundingClientRect(); if (r.width < 2) continue;
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    if (r.right > vw + 1.5 || r.left < -1.5) { const k = sel(el) + '|box'; if (!seen.has(k)) { seen.add(k); out.push({ el: sel(el), text: '', probs: [`BOX off-edge L${Math.round(r.left)} R${Math.round(r.right)} vw${vw}`], y: Math.round(r.top + scrollY) }); } }
  }
  return { vw, docW: document.documentElement.scrollWidth, bodyW: document.body.scrollWidth, docH: document.documentElement.scrollHeight, out };
};
(async () => {
  const b = await chromium.launch(); const res = {};
  for (const m of modes) for (const path of pages) {
    const M = MODES[m]; const ctx = await ctxFor(b, { w: M.w, h: M.h, theme, reduced: true, mobile: false });
    const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(350);
    if (M.spacing) { await p.addStyleTag({ content: SPACING }); await p.waitForTimeout(250); }
    // open every details so content inside is laid out
    await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true)); await p.waitForTimeout(100);
    const r = await p.evaluate(detect);
    res[`${m} ${path}`] = r;
    if (shots) await p.screenshot({ path: `shots/reflow/${m}_${slug(path)}_${theme}.png`, fullPage: true });
    console.log(`${m} ${path} vw=${r.vw} docW=${r.docW} bodyW=${r.bodyW} issues=${r.out.length}`);
    for (const o of r.out.slice(0, 40)) console.log(`    y=${o.y} ${o.el} "${o.text}" :: ${o.probs.join(' ; ')}`);
    await ctx.close();
  }
  fs.writeFileSync(`out/reflow_${modes.join('-')}_${theme}.json`, JSON.stringify(res, null, 1));
  await b.close();
})();
