// Measured contrast of every piece of text in the closing bands, the appointment card and the footers against the
// pixels actually painted behind it (gradients, the live "band" shader, flecks and all).
//   node contrast.js [url] [--frames 8] [--themes light,dark] [--widths 390,1440] [--states still,live]
// For each theme, width and state (still / shader live) it hides the text, screenshots, and for every line of text takes
// the WORST 4px block behind it. AA: 4.5:1, or 3:1 for large text (24px, or 18.66px bold). Exit code 1 on any failure.
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const url = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'http://localhost:8730/kit/closing/demo.html';
const FRAMES = +arg('frames', 8);
const ROOTS = '.kws-close, .kws-appt, .kws-foot';

(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const reader = await (await b.newContext()).newPage();   // decodes screenshots
  let fails = 0;
  for (const theme of arg('themes', 'light,dark').split(',')) for (const w of arg('widths', '390,1440').split(',').map(Number)) for (const live of arg('states', 'still,live').split(',').map(x => x === 'live')) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, colorScheme: theme });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); localStorage.setItem('kws-motion', 'on'); } catch (e) {} }, theme);
    const p = await ctx.newPage();
    if (!live) await p.route('**/shader.js', r => r.abort());
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.addStyleTag({ content: '.demo-bar{position:static !important} .reveal{opacity:1 !important;transform:none !important}' });
    // every line box of every text node, with its colour and size
    const items = await p.evaluate(ROOTS => {
      const out = [], tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), r = document.createRange();
      while (tw.nextNode()) {
        const n = tw.currentNode, el = n.parentElement;
        if (!n.data.trim() || !el.closest(ROOTS) || el.closest('[aria-hidden="true"], [hidden], svg')) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        r.selectNodeContents(n);
        for (const q of r.getClientRects()) if (q.width > 2 && q.height > 2)
          out.push({ x: q.left + scrollX, y: q.top + scrollY, w: q.width, h: q.height, color: cs.color, size: parseFloat(cs.fontSize), bold: +cs.fontWeight >= 700,
            who: (el.className && el.className.toString().split(' ')[0] || el.tagName.toLowerCase()) + ' in ' + el.closest(ROOTS).className.split(' ').filter(c => /^kws-/.test(c)).join('.'), text: n.data.trim().slice(0, 28) });
      }
      return out;
    }, ROOTS);
    await p.addStyleTag({ content: `:is(${ROOTS}) :not([aria-hidden="true"], [aria-hidden="true"] *) { color: transparent !important; -webkit-text-fill-color: transparent !important; text-decoration-color: transparent !important; }
      .kws-close-kicker::before, .kws-close-kicker::after, .kws-close-mark::after { visibility: hidden !important; } .kws-motion svg { visibility: hidden !important; }` });
    const worst = new Map();
    const frames = live ? FRAMES : 1;
    for (let f = 0; f < frames; f++) {
      if (live) await p.waitForTimeout(f ? 1300 : 1500);
      // the shader only draws layers on screen: walk the page so each band is live when captured
      const H = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < H; y += 800) {
        await p.evaluate(y => scrollTo(0, y), y);
        await p.waitForTimeout(live ? 260 : 60);
        const sy = await p.evaluate(() => scrollY);
        const png = (await p.screenshot()).toString('base64');
        const here = items.filter(i => i.y >= sy && i.y + i.h <= sy + 900);
        const res = await reader.evaluate(async ({ png, here, sy }) => {
          const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode();
          const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
          const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
          const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
          const lum = (r, g, b) => .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);
          return here.map(i => {
            const m = i.color.match(/[\d.]+/g).map(Number), L = lum(m[0], m[1], m[2]);
            const d = x.getImageData(Math.max(0, Math.floor(i.x)), Math.max(0, Math.floor(i.y - sy)), Math.ceil(i.w), Math.ceil(i.h)).data;
            // fine grain is averaged the way the eye does: the worst 4px block, not the worst single pixel
            const W = Math.ceil(i.w), Hh = Math.ceil(i.h), S = 4; let min = 99;
            for (let by = 0; by + S <= Hh; by += S) for (let bx = 0; bx + S <= W; bx += S) {
              let B = 0;
              for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) { const k = ((by + yy) * W + bx + xx) * 4; B += lum(d[k], d[k + 1], d[k + 2]); }
              B /= S * S;
              const cr = (Math.max(L, B) + .05) / (Math.min(L, B) + .05); if (cr < min) min = cr;
            }
            return min;
          });
        }, { png, here, sy });
        here.forEach((i, k) => { const key = i.who + ' | ' + i.text; const need = i.size >= 24 || (i.size >= 18.66 && i.bold) ? 3 : 4.5; const cur = worst.get(key); if (!cur || res[k] < cur.cr) worst.set(key, { cr: res[k], need, size: i.size }); });
      }
    }
    const all = [...worst.entries()], bad = all.filter(([, v]) => v.cr < v.need);
    const low = all.reduce((a, c) => (c[1].cr / c[1].need < a[1].cr / a[1].need ? c : a));
    fails += bad.length;
    console.log(`${theme.padEnd(5)} ${String(w).padEnd(4)} ${live ? `shader live, ${frames} frames` : 'still              '}  ${all.length} texts, lowest ${low[1].cr.toFixed(2)}:1 (needs ${low[1].need}) "${low[0]}"` + (bad.length ? '\n  FAIL ' + bad.map(([k, v]) => `${v.cr.toFixed(2)}:1 < ${v.need} @${v.size}px ${k}`).join('\n  FAIL ') : ''));
    await ctx.close();
  }
  await b.close();
  console.log(fails ? `${fails} failure(s)` : 'all text passes AA against the pixels behind it');
  process.exit(fails ? 1 : 0);
})();
