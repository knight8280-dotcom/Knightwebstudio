// Photograph the ground behind every line of text over the moving backgrounds: words made transparent, shaders 25x faster, N frames per case.
// Writes contrast/<case>/f-XX.png and rects.json; analyse with t9_contrast.py
const { launch, ctx, URL, PORT } = require('./common');
const fs = require('fs'), path = require('path');
const N = +(process.argv[2] || 24), ONLY = process.argv[3] || '', GOLD = process.argv[4] === 'gold';
const CASES = [];
for (const theme of ['light', 'dark']) for (const [w, h, dsf] of [[390, 1300, 2], [1440, 1000, 1]]) {
  CASES.push({ page: 'demo', url: URL, theme, w, h, dsf, host: '#top', name: 'wash' });
  CASES.push({ page: 'demo', url: URL, theme, w, h, dsf, host: '.cta-band', name: 'band' });
  CASES.push({ page: 'demo', url: URL, theme, w, h, dsf, host: '.demo-brand-head', name: 'brand2-wash' });
  CASES.push({ page: 'demo', url: URL, theme, w, h, dsf, host: '.demo-brand-band', name: 'brand2-band' });
  CASES.push({ page: 'bare', url: PORT, theme, w, h, dsf, host: '.top', name: 'brand3-wash' });
  CASES.push({ page: 'bare', url: PORT, theme, w, h, dsf, host: '.block', name: 'brand3-band' });
}
if (GOLD) { CASES.length = 0; for (const theme of ['light', 'dark']) for (const [w, h, dsf] of [[390, 1300, 2], [1440, 1000, 1]]) CASES.push({ page: 'demo', url: URL, theme, w, h, dsf, host: '.cta-band', name: 'bandgold', gold: true }); }
(async () => {
  const b = await launch();
  for (const cs of CASES) {
    const id = `${cs.page}-${cs.name}-${cs.w}-${cs.theme}`;
    if (ONLY && !id.includes(ONLY)) continue;
    const dir = path.join(__dirname, 'contrast', id); fs.mkdirSync(dir, { recursive: true });
    const c = await ctx(b, { viewport: { width: cs.w, height: cs.h }, deviceScaleFactor: cs.dsf, colorScheme: cs.theme });
    const p = await c.newPage();
    await p.addInitScript(t => { try { localStorage.setItem('theme', t); localStorage.setItem('bare-theme', t); localStorage.setItem('kws-motion', 'on'); sessionStorage.setItem('kws-crest', '1'); } catch (e) {} }, cs.theme);
    await p.goto(cs.url, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500);
    await p.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'start', behavior: 'instant' }), cs.host);
    await p.evaluate(() => scrollBy({ top: -90, behavior: 'instant' }));
    await p.waitForTimeout(900);
    if (cs.gold) { await p.evaluate(() => { const c = document.querySelector('.cta-band .cta-copy'); const e = document.createElement('p'); e.className = 'eyebrow'; e.textContent = 'Free · 30 minutes · no pitch'; c.insertBefore(e, c.firstChild); const f = document.createElement('p'); f.className = 'fine'; f.innerHTML = 'Fixed prices, published up front. <a href="/pricing/">See pricing</a>'; c.appendChild(f); KWS.shader.refresh(); }); await p.waitForTimeout(600); }
    // text rects + colours
    const info = await p.evaluate(sel => {
      const host = document.querySelector(sel), hb = host.getBoundingClientRect(); const out = [];
      const tw = document.createTreeWalker(host, NodeFilter.SHOW_TEXT); let n;
      while ((n = tw.nextNode())) {
        if (!/\S/.test(n.data)) continue; const e = n.parentElement; if (e.closest('svg, .kws-shader, .sr-only, [hidden]')) continue;
        const st = getComputedStyle(e); if (st.visibility === 'hidden' || st.display === 'none') continue;
        const r = document.createRange(); r.selectNodeContents(n);
        for (const q of r.getClientRects()) { if (q.width < 2 || q.height < 2) continue; if (q.bottom < 0 || q.top > innerHeight) continue; out.push({ x: q.left, y: q.top, w: q.width, h: q.height, color: st.color, fs: parseFloat(st.fontSize), fw: +st.fontWeight || 400, text: n.data.trim().slice(0, 28), cls: (e.className || e.tagName).toString().slice(0, 24) }); }
      }
      return { rects: out, host: { x: hb.left, y: hb.top, w: hb.width, h: hb.height }, vw: innerWidth, vh: innerHeight, motion: document.documentElement.getAttribute('data-motion'), theme: document.documentElement.getAttribute('data-theme') };
    }, cs.host);
    // hide the words, speed the shaders up
    await p.addStyleTag({ content: `${cs.host}, ${cs.host} * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; text-decoration-color: transparent !important; caret-color: transparent !important; } ${cs.host} .btn svg, ${cs.host} .ico { opacity: 0 !important; }` });
    const live = await p.evaluate(sel => { const host = document.querySelector(sel); const out = []; host.querySelectorAll(':scope > .kws-shader').forEach(el => { KWS.shader.mount(el)(); KWS.shader.mount(el, { speed: 25 }); out.push(el.dataset.shader); }); return out; }, cs.host);
    await p.waitForTimeout(700);
    const clip = { x: 0, y: Math.max(0, info.host.y), width: cs.w, height: Math.min(cs.h - Math.max(0, info.host.y), info.host.h + Math.min(0, info.host.y)) };
    info.clip = clip; info.dsf = cs.dsf; info.live = await p.evaluate(sel => !!document.querySelector(sel + ' > .kws-shader.is-live'), cs.host);
    for (let i = 0; i < N; i++) { await p.screenshot({ path: path.join(dir, `f-${String(i).padStart(2, '0')}.png`), clip }); await p.waitForTimeout(330); }
    // one more with the words back, for the record
    fs.writeFileSync(path.join(dir, 'rects.json'), JSON.stringify(info));
    console.log(id, 'rects', info.rects.length, 'layers', live.join(','), 'live', info.live, 'motion', info.motion, 'theme', info.theme);
    await c.close();
  }
  await b.close();
})();
