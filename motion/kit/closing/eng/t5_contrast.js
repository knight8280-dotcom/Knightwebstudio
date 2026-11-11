// 4. Text contrast against the pixels painted behind it. Both themes, 390 and 1440; CSS-only still, shader still (paused), shader live (24 frames at
// normal speed + 12 at 8x speed so more of the loop is seen). Worst 4x4 block (mean) and worst 2x2 block per line of text.
//   node t5_contrast.js [page] [--quick]
const { launch, BLOCK } = require('./common');
const page = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'demo.html';
const QUICK = process.argv.includes('--quick');
const ROOTS = '.kws-close, .kws-foot, .kws-appt';
(async () => {
  const b = await launch();
  const reader = await (await b.newContext()).newPage();
  const all = [];
  for (const theme of (process.env.THEMES || 'light,dark').split(',')) for (const w of (process.env.WIDTHS || '390,1440').split(',').map(Number)) for (const state of (process.env.STATES || 'css-only,paused,live').split(',')) {
    if (/portable/.test(page) && state !== 'css-only') continue;
    const c = await b.newContext({ viewport: { width: w, height: 1500 }, deviceScaleFactor: 1, colorScheme: theme });
    await c.addInitScript(([t, m]) => { try { localStorage.setItem('theme', t); localStorage.setItem('kws-motion', m); } catch (e) {} }, [theme, state === 'paused' ? 'off' : 'on']);
    await c.route(BLOCK, r => r.abort());
    if (state === 'css-only') { await c.route(/shader\.js/, r => r.abort()); }
    const p = await c.newPage();
    await p.goto('http://localhost:8730/kit/closing/' + page, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.addStyleTag({ content: '.demo-bar{position:static !important} .reveal{opacity:1 !important;transform:none !important} html{scroll-behavior:auto !important}' });
    await p.waitForTimeout(1200);
    const roots = await p.evaluate(ROOTS => [...document.querySelectorAll(ROOTS)].filter(r => !r.parentElement.closest(ROOTS)).map((r, i) => { r.setAttribute('data-root', i); return { i, cls: r.className.split(' ').filter(c => /^kws-/.test(c)).join('.') + (r.closest('.demo-client') ? ' (client palette)' : ''), shader: !!r.querySelector('.kws-shader') }; }), ROOTS);
    for (const root of roots) {
      const sel = `[data-root="${root.i}"]`;
      await p.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); scrollTo(0, r.top + scrollY - Math.max(0, (innerHeight - r.height) / 2)); }, sel);
      await p.waitForTimeout(state === 'live' ? 900 : 250);
      const info = await p.evaluate(sel => {
        const root = document.querySelector(sel), out = [], tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), r = document.createRange();
        while (tw.nextNode()) {
          const n = tw.currentNode, el = n.parentElement;
          if (!n.data.trim() || el.closest('[aria-hidden="true"], [hidden], svg')) continue;
          const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
          r.selectNodeContents(n);
          for (const q of r.getClientRects()) if (q.width > 2 && q.height > 2) out.push({ x: q.left, y: q.top, w: q.width, h: q.height, color: cs.color, size: parseFloat(cs.fontSize), weight: +cs.fontWeight, who: (String(el.className).split(' ')[0] || el.tagName.toLowerCase()), text: n.data.trim().slice(0, 30) });
        }
        const q = root.getBoundingClientRect();
        return { items: out, clip: { x: Math.max(0, q.left), y: Math.max(0, q.top), width: Math.min(innerWidth, q.right) - Math.max(0, q.left), height: Math.min(innerHeight, q.bottom) - Math.max(0, q.top) }, live: root.querySelectorAll('.kws-shader.is-live').length, canv: root.querySelectorAll('canvas').length };
      }, sel);
      await p.evaluate(sel => { const s = document.createElement('style'); s.id = 'hidetext'; s.textContent = `${sel} *:not([aria-hidden="true"], [aria-hidden="true"] *), ${sel} { -webkit-text-fill-color: transparent !important; text-decoration-color: transparent !important; } .kws-close-kicker::before, .kws-close-kicker::after, .kws-close-mark::after { visibility: hidden !important; } .kws-motion svg { visibility: hidden !important; }`; document.head.appendChild(s); }, sel);
      const passes = state === 'live' && root.shader ? (QUICK ? [[8, 500, 1]] : [[24, 520, 1], [12, 420, 8]]) : [[1, 0, 1]];
      const worst = new Map(); let frames = 0;
      for (const [n, gap, speed] of passes) {
        if (speed !== 1) await p.evaluate(([sel, speed]) => { document.querySelectorAll(sel + ' .kws-shader').forEach(el => { const end = KWS.shader.mount(el); end(); KWS.shader.mount(el, { speed }); }); }, [sel, speed]), await p.waitForTimeout(900);
        for (let f = 0; f < n; f++) {
          if (gap) await p.waitForTimeout(gap);
          const png = (await p.screenshot({ clip: info.clip })).toString('base64'); frames++;
          const res = await reader.evaluate(async ({ png, items, clip }) => {
            const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode();
            const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
            const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
            const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
            const lum = (r, g, b) => .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);
            const cr = (a, b) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
            return items.map(i => {
              const m = i.color.match(/[\d.]+/g).map(Number), L = lum(m[0], m[1], m[2]);
              const x0 = Math.max(0, Math.floor(i.x - clip.x)), y0 = Math.max(0, Math.floor(i.y - clip.y)), ww = Math.min(cv.width - x0, Math.ceil(i.w)), hh = Math.min(cv.height - y0, Math.ceil(i.h));
              if (ww < 2 || hh < 2) return null;
              const d = x.getImageData(x0, y0, ww, hh).data; let w4 = 99, w2 = 99, sum = 0, cnt = 0, wrgb = '';
              const blk = (bx, by, s) => { let r = 0, g = 0, bl = 0, k = 0; for (let yy = by; yy < Math.min(hh, by + s); yy++) for (let xx = bx; xx < Math.min(ww, bx + s); xx++) { const o = (yy * ww + xx) * 4; r += d[o]; g += d[o + 1]; bl += d[o + 2]; k++; } return [r / k, g / k, bl / k]; };
              for (let by = 0; by < hh; by += 4) for (let bx = 0; bx < ww; bx += 4) { const c = blk(bx, by, 4), v = cr(L, lum(c[0], c[1], c[2])); sum += v; cnt++; if (v < w4) { w4 = v; wrgb = c.map(Math.round).join(','); } }
              for (let by = 0; by < hh; by += 2) for (let bx = 0; bx < ww; bx += 2) { const c = blk(bx, by, 2), v = cr(L, lum(c[0], c[1], c[2])); if (v < w2) w2 = v; }
              return { w4, w2, mean: sum / cnt, wrgb };
            });
          }, { png, items: info.items, clip: info.clip });
          info.items.forEach((it, k) => { const r = res[k]; if (!r) return; const key = k; const cur = worst.get(key); if (!cur || r.w4 < cur.w4) worst.set(key, Object.assign({ frame: frames, speed }, r, { w2: Math.min(r.w2, cur ? cur.w2 : 99) })); else cur.w2 = Math.min(cur.w2, r.w2); });
        }
      }
      await p.evaluate(() => document.getElementById('hidetext').remove());
      const rows = info.items.map((it, k) => Object.assign({}, it, worst.get(k))).filter(r => r.w4 !== undefined);
      for (const r of rows) { r.need = (r.size >= 24 || (r.size >= 18.66 && r.weight >= 700)) ? 3 : 4.5; r.cfg = `${theme} ${w} ${state}`; r.root = root.cls; all.push(r); }
      const low = rows.slice().sort((a, b) => a.w4 / a.need - b.w4 / b.need)[0];
      console.log(`${theme.padEnd(5)} ${String(w).padEnd(4)} ${state.padEnd(8)} ${root.cls.padEnd(46)} ${String(rows.length).padStart(3)} lines, ${String(frames).padStart(2)} frame(s), live layers ${info.live}/${info.canv}: lowest 4px-block ${low.w4.toFixed(2)}:1 (2px ${low.w2.toFixed(2)}, mean ${low.mean.toFixed(2)}; needs ${low.need}) ${low.who} ${low.size}px/${low.weight} ${low.color} on rgb(${low.wrgb}) "${low.text}"`);
    }
    await c.close();
  }
  const fails = all.filter(r => r.w4 < r.need), thin = all.filter(r => r.w4 >= r.need && r.w4 < r.need * 1.08);
  console.log(`\n${all.length} measured lines; below AA (4px block): ${fails.length}; within 8% of the line: ${thin.length}`);
  for (const r of fails.concat(thin).slice(0, 40)) console.log(`  ${r.w4 < r.need ? 'FAIL' : 'thin'} ${r.cfg} | ${r.root} | ${r.who} ${r.size}px/${r.weight} ${r.color} on rgb(${r.wrgb}) = ${r.w4.toFixed(2)}:1 (2px ${r.w2.toFixed(2)}; needs ${r.need}) "${r.text}"`);
  // summary per text class: the worst anywhere
  const by = {}; for (const r of all) { const k = r.who + ' @' + r.root.replace(/ \(client palette\)/, '*'); if (!by[k] || r.w4 < by[k].w4) by[k] = r; }
  console.log('\nworst per kind of text:'); for (const k of Object.keys(by).sort((a, b) => by[a].w4 - by[b].w4).slice(0, 24)) { const r = by[k]; console.log(`  ${r.w4.toFixed(2)}:1 (2px ${r.w2.toFixed(2)}; needs ${r.need})  ${k}  [${r.cfg}] "${r.text}"`); }
  await b.close();
})();
