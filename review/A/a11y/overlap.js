// Text-on-text overlap and text spilling out of its own box, with and without the WCAG 1.4.12 text-spacing overrides.
const { chromium, BASE, PAGES, slug, ctxFor } = require('./lib');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const widths = arg('widths', '390,1280').split(',').map(Number); const pages = arg('pages', PAGES.join(',')).split(',');
const SPACING = `*{line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important} p{margin-bottom:2em !important}`;
const detect = () => {
  const sel = el => { const p = []; for (let e = el; e && e !== document.body && p.length < 3; e = e.parentElement) p.unshift(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '')); return p.join('>'); };
  const items = []; const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (tw.nextNode()) { const n = tw.currentNode; const txt = n.textContent.trim(); if (!txt) continue; const pe = n.parentElement;
    if (!pe || pe.closest('script,style,noscript,.sr-only,[hidden],svg,.skip-link,.hp,option,[aria-hidden="true"]')) continue; if (!pe.checkVisibility({ checkVisibilityCSS: true })) continue;
    if (pe.closest('.site-header,.topbar,.mobile-cta')) continue;
    let tiny = false; for (let a = pe; a && a !== document.body; a = a.parentElement) { const b = a.getBoundingClientRect(); if (b.width <= 2 && b.height <= 2) { tiny = true; break; } } if (tiny) continue;
    const range = document.createRange(); range.selectNodeContents(n);
    for (const r of range.getClientRects()) if (r.width > 1 && r.height > 1) items.push({ pe, txt, l: r.left, t: r.top + scrollY, r: r.right, b: r.bottom + scrollY }); }
  const out = []; const seen = new Set();
  items.sort((a, b) => a.t - b.t);
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) { const A = items[i], B = items[j]; if (B.t > A.b) break; if (A.pe === B.pe || A.pe.contains(B.pe) || B.pe.contains(A.pe)) continue;
    const ox = Math.min(A.r, B.r) - Math.max(A.l, B.l), oy = Math.min(A.b, B.b) - Math.max(A.t, B.t); const minH = Math.min(A.b - A.t, B.b - B.t);
    if (ox > 3 && oy > Math.max(4, minH * 0.3)) { const k = sel(A.pe) + ' X ' + sel(B.pe); if (!seen.has(k)) { seen.add(k); out.push(`y=${Math.round(A.t)} "${A.txt.slice(0, 30)}" [${sel(A.pe)}] overlaps "${B.txt.slice(0, 30)}" [${sel(B.pe)}] by ${Math.round(ox)}x${Math.round(oy)}`); } } }
  // text spilling out of the element that paints a box around it (button, pill, card with background or border)
  for (const it of items) { for (let a = it.pe; a && a !== document.body; a = a.parentElement) { const cs = getComputedStyle(a); const boxed = (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') || parseFloat(cs.borderTopWidth) + parseFloat(cs.borderLeftWidth) > 0 || cs.backgroundImage !== 'none';
      if (!boxed || cs.display === 'inline') continue; const b = a.getBoundingClientRect(); const T = b.top + scrollY, Bm = b.bottom + scrollY;
      if (it.r > b.right + 2 || it.l < b.left - 2 || it.b > Bm + 3 || it.t < T - 3) { const k = 'spill ' + sel(a) + sel(it.pe); if (!seen.has(k)) { seen.add(k); out.push(`y=${Math.round(it.t)} SPILL "${it.txt.slice(0, 30)}" [${sel(it.pe)}] out of [${sel(a)}] by R${Math.round(it.r - b.right)} L${Math.round(b.left - it.l)} B${Math.round(it.b - Bm)} T${Math.round(T - it.t)}`); } }
      break; } }
  return out;
};
(async () => {
  const b = await chromium.launch();
  for (const w of widths) for (const path of pages) {
    const ctx = await ctxFor(b, { w, h: 800, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(350);
    await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true)); await p.waitForTimeout(100);
    const base = new Set(await p.evaluate(detect));
    await p.addStyleTag({ content: SPACING }); await p.waitForTimeout(300);
    const sp = await p.evaluate(detect);
    const strip = s => s.replace(/^y=\d+ /, '').replace(/ by .*$/, '');
    const baseK = new Set([...base].map(strip));
    console.log(`\n=== ${path} @${w} baseline=${base.size} spaced=${sp.length}`);
    for (const s of base) console.log('   BASE  ' + s.slice(0, 300));
    for (const s of sp) if (!baseK.has(strip(s))) console.log('   SPACED ' + s.slice(0, 300));
    await ctx.close();
  }
  await b.close();
})();
