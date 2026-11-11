// Pixel-sampled contrast of text over the moving backgrounds: many frames, both themes, phone and desktop.
// Writes screenshots (text hidden) and text boxes to cshots/, then contrast.py reads the pixels.
const { chromium } = require('playwright');
const fs = require('fs');
const URL = 'http://localhost:8730/kit/light/demo.html';
const FRAMES = +(process.argv[2] || 30);
const HOSTS = { hero: '#top', band: '.cta-band', 'brand-head': '.demo-brand-head', 'brand-band': '.demo-brand-band' };
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const index = [];
  for (const theme of ['light', 'dark']) for (const [w, h] of [[390, 1500], [1440, 1100]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    // run the shaders 25 times faster, so that 30 frames cover about five minutes of their motion
    await ctx.route('**/demo.html', async route => { const r = await route.fetch(); const body = (await r.text()).replace(/data-kws="shader"/g, 'data-kws="shader" data-shader-speed="25"'); await route.fulfill({ response: r, body }); });
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(1500);
    for (const [name, sel] of Object.entries(HOSTS)) {
      await p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top - 100, behavior: 'instant' }); }, sel);
      await p.waitForTimeout(1500);
      const info = await p.evaluate(s => {
        const host = document.querySelector(s), hb = host.getBoundingClientRect(), boxes = [];
        const tw = document.createTreeWalker(host, NodeFilter.SHOW_TEXT), rg = document.createRange(); let n;
        while ((n = tw.nextNode())) {
          if (!/\S/.test(n.data)) continue; const el = n.parentElement; if (el.closest('.sr-only, svg, [aria-hidden="true"]')) continue;
          const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
          rg.selectNodeContents(n);
          for (const q of rg.getClientRects()) if (q.width > 1 && q.height > 1) boxes.push({ x: q.left - hb.left, y: q.top - hb.top, w: q.width, h: q.height, color: cs.color, size: parseFloat(cs.fontSize), bold: parseInt(cs.fontWeight) >= 700, text: n.data.trim().slice(0, 24) });
        }
        return { boxes, clip: { x: hb.left, y: hb.top, width: hb.width, height: Math.min(hb.height, innerHeight - hb.top) }, live: host.querySelector('.kws-shader').classList.contains('is-live') };
      }, sel);
      // hide the words (and marks drawn with them) so that only what is behind them is photographed
      const style = await p.addStyleTag({ content: '*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important; text-decoration-color: transparent !important; text-shadow: none !important; } .mark::after, .eyebrow::before, .price-strip-note::before { visibility: hidden !important; } ::selection { background: transparent; }' });
      await p.waitForTimeout(200);
      const files = [];
      for (let i = 0; i < FRAMES; i++) { const f = `cshots/${theme}-${w}-${name}-${String(i).padStart(2, '0')}.png`; await p.screenshot({ path: f, clip: info.clip }); files.push(f); await p.waitForTimeout(400); }
      await style.evaluate(e => e.remove());
      index.push({ theme, w, name, live: info.live, boxes: info.boxes, files });
      console.log(theme, w, name, 'live:', info.live, info.boxes.length, 'text boxes');
    }
    await ctx.close();
  }
  fs.writeFileSync('cshots/index.json', JSON.stringify(index));
  await b.close();
})();
