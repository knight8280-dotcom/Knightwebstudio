// Pixel-based contrast: paint the page with text transparent, sample the real pixels behind each text node.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const widths = (process.argv[2] || '390,1440').split(',').map(Number);
(async () => {
  const b = await chromium.launch(); let total = 0;
  for (const theme of ['light', 'dark']) for (const w of widths) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce', colorScheme: theme });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    await p.evaluate(async () => { for (const i of document.images) i.loading = 'eager'; await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))); });
    // make the sticky things static so the full-page shot shows true backgrounds; show the phone bar off
    await p.addStyleTag({ content: '.site-header{position:static !important} .mobile-cta{display:none !important} *{caret-color:transparent}' });
    await p.waitForTimeout(400);
    // collect text nodes
    const nodes = await p.evaluate(() => {
      const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
      const out = []; const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) { const n = walker.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement;
        if (!el || el.closest('svg, script, style, .sr-only, [hidden], option, .skip-link')) continue;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        if (el.closest('.nav') && getComputedStyle(el.closest('.nav')).visibility === 'hidden') continue;
        let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
        const range = document.createRange(); range.selectNodeContents(n); const rects = [...range.getClientRects()].filter(r => r.width > 1 && r.height > 1).map(r => ({ x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }));
        if (!rects.length) continue; const c = parse(cs.color); if (!c) continue;
        out.push({ text: n.textContent.trim().slice(0, 40), cls: (el.className && el.className.toString()) || el.tagName, tag: el.tagName, path: (() => { const a = []; for (let e = el; e && a.length < 3; e = e.parentElement) a.push(e.tagName.toLowerCase() + (e.className && e.className.toString() ? '.' + e.className.toString().trim().split(/\s+/)[0] : '')); return a.reverse().join(' > '); })(), color: c, op, size: parseFloat(cs.fontSize), weight: parseInt(cs.fontWeight), rects });
      }
      return out;
    });
    await p.addStyleTag({ content: '*{color:transparent !important;-webkit-text-fill-color:transparent !important;text-shadow:none !important;text-decoration-color:transparent !important} *::before,*::after{color:transparent !important} li::marker{color:transparent !important}' });
    await p.waitForTimeout(200);
    const shot = await p.screenshot({ fullPage: true, type: 'png' });
    const res = await p.evaluate(async ({ b64, nodes }) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
      const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
      const bad = [];
      for (const n of nodes) {
        let worst = 99, wbg = null;
        for (const r of n.rects) {
          const x = Math.max(0, Math.floor(r.x)), y = Math.max(0, Math.floor(r.y)), w = Math.min(Math.ceil(r.w), img.width - x), h = Math.min(Math.ceil(r.h), img.height - y); if (w < 1 || h < 1) continue;
          const d = g.getImageData(x, y, w, h).data; const step = Math.max(1, Math.floor((w * h) / 400));
          for (let i = 0; i < w * h; i += step) { const bg = { r: d[i * 4], g: d[i * 4 + 1], b: d[i * 4 + 2] }; const a = n.color.a * n.op; const fg = { r: n.color.r * a + bg.r * (1 - a), g: n.color.g * a + bg.g * (1 - a), b: n.color.b * a + bg.b * (1 - a) };
            const ratio = (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05); if (ratio < worst) { worst = ratio; wbg = bg; } }
        }
        const large = n.size >= 24 || (n.size >= 18.66 && n.weight >= 700);
        if (worst < (large ? 3 : 4.5)) bad.push(`${worst.toFixed(2)} @${n.size}px/${n.weight} ${n.path} | "${n.text}" fg rgba(${n.color.r},${n.color.g},${n.color.b},${(n.color.a * n.op).toFixed(2)}) bg rgb(${wbg.r},${wbg.g},${wbg.b})`);
      }
      return bad;
    }, { b64: shot.toString('base64'), nodes });
    const uniq = [...new Set(res)];
    total += uniq.length; console.log(`\n${theme} ${w}: ${nodes.length} text nodes, ${uniq.length} below AA`); uniq.forEach(x => console.log('  ' + x));
    await ctx.close();
  }
  await b.close();
})();
