const { chromium } = require('playwright');
const URL = 'http://localhost:8720/start/';
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1440]) for (const theme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|calendly\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
    const r = await p.evaluate(() => {
      const parse = c => { const m = c.match(/[\d.]+/g); if (!m) return [0, 0, 0, 0]; const a = m.map(Number); if (a.length < 4) a.push(1); return a; };
      const over = (top, bot) => { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1]; };
      const lum = c => { const [r, g, b] = c.slice(0, 3).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
      const ratio = (a, c) => { const x = lum(a), y = lum(c); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
      const bgOf = el => { const layers = []; let e = el, img = false; while (e) { const cs = getComputedStyle(e); const c = parse(cs.backgroundColor); if (cs.backgroundImage !== 'none' && !/svg|brush/.test(cs.backgroundImage)) img = cs.backgroundImage.slice(0, 40); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } e = e.parentElement; } let base = [255, 255, 255, 1]; for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base); return { base, img }; };
      const rows = new Map();
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (tw.nextNode()) { const n = tw.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || el.closest('script, style, .sr-only, [hidden], svg')) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue; const rc = el.getBoundingClientRect(); if (rc.width < 2) continue;
        let hid = false, e2 = el; while (e2) { if (getComputedStyle(e2).display === 'none') { hid = true; break; } e2 = e2.parentElement; } if (hid) continue;
        const { base, img } = bgOf(el); let fg = parse(cs.color); let op = 1, e3 = el; while (e3) { op *= parseFloat(getComputedStyle(e3).opacity); e3 = e3.parentElement; } fg[3] *= op; const fgc = over(fg, base);
        const fs = parseFloat(cs.fontSize), fw = parseInt(cs.fontWeight); const large = fs >= 24 || (fs >= 18.66 && fw >= 700); const need = large ? 3 : 4.5; const ra = ratio(fgc, base);
        const key = `${cs.color}|${base.map(Math.round).join(',')}|${large}`;
        if (!rows.has(key)) rows.set(key, { ratio: +ra.toFixed(2), need, fs, fw, fg: cs.color, bg: 'rgb(' + base.slice(0, 3).map(Math.round).join(',') + ')', img, ex: el.tagName.toLowerCase() + '.' + el.className.toString().split(' ')[0] + ' "' + n.textContent.trim().slice(0, 26) + '"', n: 1 }); else rows.get(key).n++;
      }
      // controls: border / fill against surroundings
      const ctrls = [];
      for (const el of document.querySelectorAll('.btn, .icon-btn, .print, .ticket, .tier')) { const cs = getComputedStyle(el); if (cs.display === 'none' || !el.getBoundingClientRect().width) continue; let hid = false, e2 = el; while (e2) { const c2 = getComputedStyle(e2); if (c2.display === 'none') { hid = true; break; } e2 = e2.parentElement; } if (hid) continue; const outer = bgOf(el.parentElement).base; const fill = over(parse(cs.backgroundColor), outer); const border = over(parse(cs.borderTopColor), outer); const bw = parseFloat(cs.borderTopWidth); ctrls.push({ el: el.className.toString().slice(0, 28) + ' "' + el.textContent.trim().slice(0, 16) + '"', fillVsOuter: +ratio(fill, outer).toFixed(2), borderVsOuter: bw ? +ratio(border, outer).toFixed(2) : null, bw }); }
      return { rows: [...rows.values()].sort((a, c) => a.ratio - c.ratio), ctrls };
    });
    console.log(`\n== ${w} ${theme}: ${r.rows.length} text/background pairs`);
    for (const x of r.rows) console.log((x.ratio < x.need ? ' FAIL ' : '      ') + String(x.ratio).padEnd(6) + ' need ' + x.need + '  ' + x.fg.padEnd(22) + ' on ' + x.bg.padEnd(18) + ` ${x.fs}px/${x.fw} x${x.n} ` + x.ex + (x.img ? '  [bg image: ' + x.img + ']' : ''));
    const seen = new Set(); for (const c of r.ctrls) { const k = c.el.split(' "')[0] + c.fillVsOuter + c.borderVsOuter; if (seen.has(k)) continue; seen.add(k); const best = Math.max(c.fillVsOuter, c.borderVsOuter || 0); console.log((best < 3 ? ' CTRL<3 ' : '        ') + JSON.stringify(c)); }
    await ctx.close();
  }
  await b.close();
})();
