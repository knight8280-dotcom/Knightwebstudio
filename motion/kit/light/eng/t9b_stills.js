// Script off: the CSS stills. Photograph the ground behind text (words transparent), one frame per case. Same rects.json format.
const { launch, URL, PORT } = require('./common');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await launch();
  for (const theme of ['light', 'dark']) for (const [w, h, dsf] of [[390, 1300, 2], [1440, 1000, 1]]) for (const [page, url, host, name] of [['demo', URL, '#top', 'wash'], ['demo', URL, '.cta-band', 'band'], ['demo', URL, '.demo-brand-head', 'brand2-wash'], ['demo', URL, '.demo-brand-band', 'brand2-band'], ['bare', PORT, '.top', 'brand3-wash'], ['bare', PORT, '.block', 'brand3-band']]) {
    if (page === 'bare' && theme === 'light') continue; // no script, no saved theme: the bare page is dark only
    const id = `still-${page}-${name}-${w}-${theme}`; const dir = path.join(__dirname, 'contrast', id); fs.mkdirSync(dir, { recursive: true });
    const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, colorScheme: theme, javaScriptEnabled: false });
    await c.route(/plausible|hcaptcha|calendly|stripe|onrender/, r => r.abort());
    const p = await c.newPage(); await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(700);
    await p.evaluate(s => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector(s).scrollIntoView({ block: 'start' }); scrollBy(0, -90); }, host);
    await p.waitForTimeout(300);
    const info = await p.evaluate(sel => {
      const host = document.querySelector(sel), hb = host.getBoundingClientRect(); const out = [];
      const tw = document.createTreeWalker(host, NodeFilter.SHOW_TEXT); let n;
      while ((n = tw.nextNode())) {
        if (!/\S/.test(n.data)) continue; const e = n.parentElement; if (e.closest('svg, .kws-shader, .sr-only, [hidden]')) continue;
        const st = getComputedStyle(e); if (st.visibility === 'hidden' || st.display === 'none') continue;
        const r = document.createRange(); r.selectNodeContents(n);
        for (const q of r.getClientRects()) { if (q.width < 2 || q.height < 2) continue; if (q.bottom < 0 || q.top > innerHeight) continue; out.push({ x: q.left, y: q.top, w: q.width, h: q.height, color: st.color, fs: parseFloat(st.fontSize), fw: +st.fontWeight || 400, text: n.data.trim().slice(0, 28), cls: (e.className || e.tagName).toString().slice(0, 24) }); }
      }
      return { rects: out, host: { x: hb.left, y: hb.top, w: hb.width, h: hb.height }, canvases: document.querySelectorAll('canvas').length, bg: getComputedStyle(document.body).backgroundColor };
    }, host);
    await p.evaluate(h => { const st = document.createElement('style'); st.textContent = h + ', ' + h + ' * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; text-decoration-color: transparent !important; } ' + h + ' .btn svg, ' + h + ' .ico { opacity: 0 !important; }'; document.head.appendChild(st); }, host); await p.waitForTimeout(150);
    const clip = { x: 0, y: Math.max(0, info.host.y), width: w, height: Math.min(h - Math.max(0, info.host.y), info.host.h + Math.min(0, info.host.y)) };
    info.clip = clip; info.dsf = dsf;
    await p.screenshot({ path: path.join(dir, 'f-00.png'), clip });
    fs.writeFileSync(path.join(dir, 'rects.json'), JSON.stringify(info));
    console.log(id, 'rects', info.rects.length, 'canvases', info.canvases, 'body', info.bg);
    await c.close();
  }
  await b.close();
})();
