// Photograph the ground behind every line of text over the moving backgrounds, frame after frame, with the words made
// invisible (text-fill only: the text keeps its computed colour, which the shader reads). Shaders run 25x faster.
// node t_contrast.js [frames] [only]   → contrast/<case>/f-XX.png + rects.json ; then python3 t_contrast.py
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const BASE = 'http://localhost:8730/kit/light/';
const N = +(process.argv[2] || 24), ONLY = process.argv[3] || '';
const CASES = [];
for (const theme of ['light', 'dark']) for (const [w, h, dsf] of [[390, 1300, 2], [1440, 1000, 1]]) {
  CASES.push({ url: 'demo.html', theme, w, h, dsf, host: '#top', name: 'site-wash' });
  CASES.push({ url: 'demo.html', theme, w, h, dsf, host: '.cta-band', name: 'site-band-gold' });
  CASES.push({ url: 'demo.html', theme, w, h, dsf, host: '.demo-brand-head', name: 'brand2-wash' });
  CASES.push({ url: 'demo.html', theme, w, h, dsf, host: '.demo-brand-band', name: 'brand2-band' });
  CASES.push({ url: 'portable.html?theme=' + theme, theme, w, h, dsf, host: '.top', name: 'brand3-wash' });
  CASES.push({ url: 'portable.html?theme=' + theme, theme, w, h, dsf, host: '.block', name: 'brand3-band' });
  CASES.push({ url: 'portable.html?theme=' + theme, theme, w, h, dsf, host: '.block.gradient', name: 'brand3-gradient-still' });
}
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  for (const cs of CASES) {
    const id = `${cs.name}-${cs.w}-${cs.theme}`;
    if (ONLY && !id.includes(ONLY)) continue;
    const dir = path.join(__dirname, 'contrast', id); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const c = await b.newContext({ viewport: { width: cs.w, height: cs.h }, deviceScaleFactor: cs.dsf, colorScheme: cs.theme });
    await c.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await c.newPage();
    await p.addInitScript(t => { try { localStorage.setItem('theme', t); localStorage.setItem('bare-theme', t); localStorage.setItem('kws-motion', 'on'); sessionStorage.setItem('kws-crest', '1'); } catch (e) {} }, cs.theme);
    await p.goto(BASE + cs.url, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500);
    await p.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'start', behavior: 'instant' }), cs.host);
    await p.evaluate(() => scrollBy({ top: -90, behavior: 'instant' }));
    await p.waitForTimeout(900);
    const info = await p.evaluate(sel => {
      const host = document.querySelector(sel), hb = host.getBoundingClientRect(), out = [];
      const tw = document.createTreeWalker(host, NodeFilter.SHOW_TEXT); let n;
      while ((n = tw.nextNode())) {
        if (!/\S/.test(n.data)) continue; const e = n.parentElement; if (e.closest('svg, .kws-shader, .sr-only, .kws-sr, [hidden]')) continue;
        const st = getComputedStyle(e); if (st.visibility === 'hidden' || st.display === 'none') continue;
        const r = document.createRange(); r.selectNodeContents(n);
        for (const q of r.getClientRects()) { if (q.width < 2 || q.height < 2) continue; if (q.bottom < 0 || q.top > innerHeight) continue; out.push({ x: q.left, y: q.top, w: q.width, h: q.height, color: st.color, fs: parseFloat(st.fontSize), fw: +st.fontWeight || 400, text: n.data.trim().slice(0, 28), cls: (e.className || e.tagName).toString().slice(0, 24) }); }
      }
      return { rects: out, host: { x: hb.left, y: hb.top, w: hb.width, h: hb.height } };
    }, cs.host);
    // hide the words (their computed colour stays), speed the shaders up
    await p.addStyleTag({ content: `${cs.host}, ${cs.host} * { -webkit-text-fill-color: transparent !important; text-shadow: none !important; text-decoration-color: transparent !important; } ${cs.host} .btn svg, ${cs.host} .ico, ${cs.host} .kws-glints, ${cs.host} .mark::after { opacity: 0 !important; }` });
    const live = await p.evaluate(async sel => { const host = document.querySelector(sel), out = []; host.querySelectorAll(':scope > .kws-shader').forEach(el => { KWS.shader.mount(el)(); KWS.shader.mount(el, { speed: 25 }); out.push(el.dataset.shader); }); await new Promise(r => setTimeout(r, 800)); return out.join() + ' live:' + !!host.querySelector(':scope > .kws-shader.is-live'); }, cs.host);
    const clip = { x: 0, y: Math.max(0, info.host.y), width: cs.w, height: Math.min(cs.h - Math.max(0, info.host.y), info.host.h + Math.min(0, info.host.y)) };
    info.clip = clip; info.dsf = cs.dsf;
    for (let i = 0; i < N; i++) { await p.screenshot({ path: path.join(dir, `f-${String(i).padStart(2, '0')}.png`), clip }); await p.waitForTimeout(330); }
    fs.writeFileSync(path.join(dir, 'rects.json'), JSON.stringify(info));
    console.log(id, 'text rects', info.rects.length, live);
    await c.close();
  }
  await b.close();
})();
