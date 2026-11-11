const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://localhost:8720/start/';
const from = +(process.argv[3] || 320), to = +(process.argv[4] || 1920), step = +(process.argv[5] || 20);
const extraCss = process.argv[6] || '';
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: from, height: 900 }, reducedMotion: 'reduce', colorScheme: theme });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    if (extraCss) await p.addStyleTag({ content: extraCss });
    let problems = 0;
    for (let w = from; w <= to; w += step) {
      if (theme === 'dark' && w % 100 !== 0 && ![360, 390, 430, 768, 820, 1024].includes(w)) continue;
      await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(70);
      const r = await p.evaluate(() => {
        const out = [];
        const name = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && e.className.toString && e.className.toString().trim() ? '.' + e.className.toString().trim().split(/\s+/).join('.') : '');
        const path = e => [e.parentElement && e.parentElement.parentElement, e.parentElement, e].filter(Boolean).map(name).join(' > ');
        const over = document.documentElement.scrollWidth - innerWidth; if (over > 0) out.push('PAGE scrollWidth over by ' + over);
        const els = [...document.querySelectorAll('body *')].filter(el => !el.closest('.sr-only, [hidden], script, style, .mobile-cta') && !el.ownerSVGElement);
        const blocks = [];
        for (const el of els) {
          const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          const rc = el.getBoundingClientRect(); if (!rc.width || !rc.height) continue;
          if (rc.right > innerWidth + .5) out.push('OUT RIGHT ' + Math.round(rc.right - innerWidth) + 'px ' + path(el));
          if (rc.left < -.5 && !el.classList.contains('skip-link')) out.push('OUT LEFT ' + Math.round(rc.left) + 'px ' + path(el));
          if (/(hidden|clip)/.test(cs.overflowX + cs.overflowY) && el !== document.body && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) && !el.classList.contains('print-img')) out.push('CLIPPED ' + path(el) + ` sw${el.scrollWidth}/cw${el.clientWidth} sh${el.scrollHeight}/ch${el.clientHeight}`);
          // direct text
          const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
          if (hasText) {
            const range = document.createRange(); let L = 1e9, T = 1e9, R = -1e9, B = -1e9; const rects = [];
            for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) { range.selectNodeContents(n); for (const q of range.getClientRects()) { if (q.width < 2) continue; const ins = q.height * .22; rects.push({ L: q.left, R: q.right, T: q.top + ins, B: q.bottom - ins }); L = Math.min(L, q.left); T = Math.min(T, q.top); R = Math.max(R, q.right); B = Math.max(B, q.bottom); } }
            if (R > L) {
              blocks.push({ el, rects });
              if (R > innerWidth + .5 || L < -.5) out.push('TEXT OFF SCREEN ' + path(el) + ' "' + el.textContent.trim().slice(0, 30) + '"');
              let box = el; while (box && box !== document.body) { const bc = getComputedStyle(box); if (bc.display !== 'inline' && (bc.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(bc.borderTopWidth) || parseFloat(bc.borderLeftWidth))) break; box = box.parentElement; }
              if (box && box !== document.body) { const br = box.getBoundingClientRect(); if (L < br.left - 1 || R > br.right + 1 || T < br.top - 3 || B > br.bottom + 3) out.push('TEXT OUTSIDE ITS BOX ' + path(el) + ' "' + el.textContent.trim().slice(0, 30) + '" box=' + name(box) + ` text[${Math.round(L)},${Math.round(T)},${Math.round(R)},${Math.round(B)}] box[${Math.round(br.left)},${Math.round(br.top)},${Math.round(br.right)},${Math.round(br.bottom)}]`); }
            }
          }
        }
        for (let i = 0; i < blocks.length; i++) for (let j = i + 1; j < blocks.length; j++) {
          const a = blocks[i], c = blocks[j]; if (a.el.closest('.site-header, .topbar') || c.el.closest('.site-header, .topbar')) continue;
          let worst = null;
          for (const x of a.rects) for (const y of c.rects) { const ix = Math.min(x.R, y.R) - Math.max(x.L, y.L), iy = Math.min(x.B, y.B) - Math.max(x.T, y.T); if (ix > 1.5 && iy > 1.5 && (!worst || ix * iy > worst[0] * worst[1])) worst = [ix, iy]; }
          if (worst) out.push('TEXT OVERLAP ' + name(a.el) + ' "' + a.el.textContent.trim().slice(0, 24) + '" x ' + name(c.el) + ' "' + c.el.textContent.trim().slice(0, 24) + '" by ' + Math.round(worst[0]) + 'x' + Math.round(worst[1]));
        }
        // specific object overlaps
        const rect = s => { const e = document.querySelector(s); if (!e) return null; const cs = getComputedStyle(e); if (cs.display === 'none') return null; return e.getBoundingClientRect(); };
        const hit = (a, c) => a && c && Math.min(a.right, c.right) - Math.max(a.left, c.left) > 1 && Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > 1;
        const pairs = [['.page-head-aside', '.head-copy'], ['.page-head-aside', '.points li:last-child span'], ['.page-head-aside', '.points li:nth-child(2) span'], ['.stamp', '.steps li:last-child p'], ['.stamp', '.steps li:last-child h3'], ['.appt', '.cta-copy'], ['.board-foot .btn', '.board-foot p'], ['.footer-skyline', '.cta-copy .write'], ['.footer-skyline', '.appt']];
        for (const [x, y] of pairs) if (hit(rect(x), rect(y))) out.push('OBJECT OVERLAP ' + x + ' x ' + y);
        // btn rows: wrapped?
        const info = {};
        const br = document.querySelector('.page-head .btn-row'); const bs = [...br.children].map(e => e.getBoundingClientRect());
        info.headBtns = bs.map(q => Math.round(q.width) + 'x' + Math.round(q.height) + '@' + Math.round(q.left) + ',' + Math.round(q.top)).join(' ');
        const h1 = document.querySelector('h1'); info.h1Lines = Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight));
        info.h = document.documentElement.scrollHeight;
        info.stripBottom = Math.round(document.querySelector('.price-strip').getBoundingClientRect().bottom + scrollY);
        return { out: [...new Set(out)], info };
      });
      if (r.out.length) { problems += r.out.length; console.log(`[${theme}] ${w}px:`); r.out.slice(0, 12).forEach(x => console.log('   ' + x)); }
      if (theme === 'light' && ([320, 360, 375, 380, 390, 430, 600, 620, 760, 768, 820, 980, 1024, 1100, 1280, 1440, 1920].includes(w))) console.log(`   info ${w}: ` + JSON.stringify(r.info));
    }
    console.log(`[${theme}] total problems: ${problems}`);
    await ctx.close();
  }
  await b.close();
})();
