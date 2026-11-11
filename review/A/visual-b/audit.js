// Layout audit across widths. node audit.js > audit.json
const { chromium } = require('playwright');
const BASE = 'http://localhost:8720';
const PAGES = ['/work/','/process/','/contact/','/faq/','/about/','/404.html','/web-design-baton-rouge/','/web-design-denham-springs/','/web-design-gonzales/','/web-design-prairieville/','/privacy/','/terms/','/checkout/','/checkout/success/'];
const WIDTHS = (process.argv[2] || '360,390,430,599,600,759,760,820,979,980,1099,1100,1279,1280,1440,1920').split(',').map(Number);
(async () => {
  const browser = await chromium.launch();
  const out = [];
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 700 ? 800 : 900 }, colorScheme: 'light' });
    await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    for (const p of PAGES) {
      const page = await ctx.newPage();
      await page.goto(BASE + p, { waitUntil: 'load' });
      await page.waitForTimeout(400);
      // make all reveals visible
      await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); } window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 200)); });
      const res = await page.evaluate(() => {
        const vw = window.innerWidth;
        const issues = [];
        const vis = el => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
        const visDeep = el => { for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return false; if (e.hidden) return false; if (e.tagName === 'DETAILS' && !e.open && el !== e && !e.querySelector('summary').contains(el)) return false; } return vis(el); };
        const desc = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\s+/).join('.'); return s + ' "' + (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50) + '"'; };
        // 1. line analysis for headings / ledes / buttons
        const lineInfo = el => {
          const range = document.createRange(); const words = [];
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          let n; while ((n = walker.nextNode())) {
            const re = /\S+/g; let m; while ((m = re.exec(n.data))) { range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length); const rs = range.getClientRects(); if (!rs.length) continue; const r = rs[0]; if (r.width === 0) continue; words.push({ t: m[0], top: Math.round(r.top), left: r.left, right: rs[rs.length - 1].right, bottom: r.bottom }); }
          }
          const lines = []; for (const wd of words) { let L = lines.find(l => Math.abs(l.top - wd.top) < 6); if (!L) { L = { top: wd.top, words: [], left: 1e9, right: -1e9 }; lines.push(L); } L.words.push(wd.t); L.left = Math.min(L.left, wd.left); L.right = Math.max(L.right, wd.right); }
          lines.sort((a, b) => a.top - b.top); return lines;
        };
        const sel = 'h1,h2,h3,h4,.lede,.btn,summary,.eyebrow,.section-head p,.cta-copy p';
        for (const el of document.querySelectorAll(sel)) {
          if (!visDeep(el)) continue; if (el.closest('.site-footer,.site-header,#mobile-cta,.topbar,.top-strip')) continue;
          const lines = lineInfo(el); if (lines.length < 2) continue;
          const widths = lines.map(l => l.right - l.left); const maxw = Math.max(...widths); const last = lines[lines.length - 1];
          const lastW = widths[widths.length - 1];
          if (last.words.length === 1 && lastW < 0.34 * maxw) issues.push({ k: 'orphan', el: desc(el), last: last.words.join(' '), lines: lines.map(l => l.words.join(' ')) });
          // line starting with separator
          for (const l of lines.slice(1)) if (/^[·•—–-]$/.test(l.words[0])) issues.push({ k: 'sep-start', el: desc(el), lines: lines.map(l => l.words.join(' ')) });
          for (const l of lines.slice(0, -1)) if (/^[·•]$/.test(l.words[l.words.length - 1])) issues.push({ k: 'sep-end', el: desc(el), lines: lines.map(l => l.words.join(' ')) });
          if (/^H[1-3]$/.test(el.tagName) && lines.length >= 4) issues.push({ k: 'many-lines', el: desc(el), n: lines.length, lines: lines.map(l => l.words.join(' ')) });
        }
        // 2. clipped content
        for (const el of document.querySelectorAll('main *, .site-header *, #mobile-cta *')) {
          if (!visDeep(el)) continue; const cs = getComputedStyle(el);
          if (/(hidden|clip)/.test(cs.overflowX + cs.overflowY) && !el.matches('.sr-only,svg,svg *,textarea,img')) {
            if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) issues.push({ k: 'clipped', el: desc(el), sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight });
          }
        }
        // 3. offscreen text
        const textEls = [];
        const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let t; const rg = document.createRange();
        while ((t = tw.nextNode())) {
          if (!t.data.trim()) continue; const pe = t.parentElement; if (!pe || pe.closest('script,style,noscript,.sr-only,svg,#mobile-cta,.site-header,.nav,[aria-hidden="true"]')) continue; if (!visDeep(pe)) continue;
          rg.selectNodeContents(t); const rects = [...rg.getClientRects()].filter(r => r.width > 1 && r.height > 1);
          if (!rects.length) continue;
          const sy = window.scrollY;
          for (const r of rects) { if (r.right > vw + 1 || r.left < -1) issues.push({ k: 'offscreen', el: desc(pe), left: Math.round(r.left), right: Math.round(r.right) }); }
          textEls.push({ pe, rects: rects.map(r => ({ l: r.left, r: r.right, t: r.top + sy, b: r.bottom + sy })) });
        }
        // 4. text-on-text overlap
        const seen = new Set();
        for (let i = 0; i < textEls.length; i++) for (let j = i + 1; j < textEls.length; j++) {
          const A = textEls[i], B = textEls[j]; if (A.pe === B.pe || A.pe.contains(B.pe) || B.pe.contains(A.pe)) continue;
          for (const a of A.rects) for (const b of B.rects) {
            const ox = Math.min(a.r, b.r) - Math.max(a.l, b.l), oy = Math.min(a.b, b.b) - Math.max(a.t, b.t);
            if (ox > 3 && oy > 5) { const key = desc(A.pe) + '|' + desc(B.pe); if (!seen.has(key)) { seen.add(key); issues.push({ k: 'overlap', a: desc(A.pe), b: desc(B.pe), ox: Math.round(ox), oy: Math.round(oy) }); } }
          }
        }
        // 5. button rows: unequal heights / misaligned tops among same-row items
        for (const row of document.querySelectorAll('.btn-row')) {
          if (!visDeep(row)) continue; const kids = [...row.children].filter(visDeep); if (kids.length < 2) continue;
          const rs = kids.map(k => k.getBoundingClientRect());
          for (let i = 1; i < rs.length; i++) { const sameRow = Math.abs(rs[i].top - rs[0].top) < rs[0].height * 0.6; if (sameRow && (Math.abs(rs[i].height - rs[0].height) > 1.5 || Math.abs((rs[i].top + rs[i].height / 2) - (rs[0].top + rs[0].height / 2)) > 1.5)) issues.push({ k: 'btnrow', a: desc(kids[0]), b: desc(kids[i]), h0: rs[0].height, h1: rs[i].height, t0: Math.round(rs[0].top), t1: Math.round(rs[i].top) }); }
        }
        // 6. images
        for (const img of document.querySelectorAll('main img')) {
          if (!visDeep(img)) continue; const r = img.getBoundingClientRect(); const cs = getComputedStyle(img);
          const nr = img.naturalWidth / img.naturalHeight, rr = r.width / r.height;
          issues.push({ k: 'img', src: img.getAttribute('src'), nat: img.naturalWidth + 'x' + img.naturalHeight, box: Math.round(r.width) + 'x' + Math.round(r.height), fit: cs.objectFit, pos: cs.objectPosition, ratioDiff: +(Math.abs(nr - rr) / nr).toFixed(3) });
        }
        return { issues, height: document.documentElement.scrollHeight, overflowX: document.documentElement.scrollWidth - vw };
      });
      out.push({ w, p, ...res });
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  console.log(JSON.stringify(out));
})();
