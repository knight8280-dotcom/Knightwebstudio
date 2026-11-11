const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/contact/', '/faq/']) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    const issues = {};
    const add = (k, w, v) => { (issues[k] = issues[k] || []).push(v === undefined ? w : `${w}:${v}`); };
    for (let w = 360; w <= 1920; w += 20) {
      await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(50);
      const r = await p.evaluate(() => {
        const out = {};
        out.over = document.documentElement.scrollWidth - innerWidth;
        const rect = e => e.getBoundingClientRect();
        const txt = e => (e.className && e.className.toString ? e.tagName.toLowerCase() + '.' + e.className.toString().trim().replace(/\s+/g, '.') : e.tagName.toLowerCase());
        // elements poking out
        const poke = [];
        for (const el of document.querySelectorAll('body *')) {
          const cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.display === 'none') continue;
          if (el.closest('.sr-only, .hp, .skip-link') || el.ownerSVGElement || el.closest('.footer-skyline')) continue;
          const rc = rect(el); if (!rc.width || !rc.height) continue;
          if (rc.right > innerWidth + .5 || rc.left < -.5) poke.push(txt(el) + ' ' + Math.round(rc.left) + '..' + Math.round(rc.right));
        }
        out.poke = poke.slice(0, 4);
        // children overflowing their parent box horizontally (clipped/overlapping text)
        const spill = [];
        for (const el of document.querySelectorAll('main *')) {
          const cs = getComputedStyle(el); if (cs.display === 'none' || cs.display === 'inline' || el.closest('.sr-only, .hp') || el.ownerSVGElement) continue;
          if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0 && !/^(select|textarea|input)$/i.test(el.tagName)) spill.push(txt(el) + ' sw' + el.scrollWidth + '>cw' + el.clientWidth);
        }
        out.spill = spill.slice(0, 4);
        // header cta wrap
        const cta = document.querySelector('.header-cta'); if (cta && cta.offsetParent) { const h = Math.round(rect(cta).height); if (h > 46) out.ctaWrap = h; }
        // .opt wrap: label height bigger than one line
        const wraps = [];
        for (const o of document.querySelectorAll('.opt')) { const lab = o.parentElement; const lh = parseFloat(getComputedStyle(lab).lineHeight) || 22; if (rect(lab).height > lh * 1.5) wraps.push(lab.textContent.trim().slice(0, 30) + ' h' + Math.round(rect(lab).height)); }
        out.optWrap = wraps;
        const th = document.querySelector('.ticket-head'); if (th) { const lh = parseFloat(getComputedStyle(th).lineHeight); if (rect(th).height > lh * 1.6) out.ticketHeadWrap = Math.round(rect(th).height); }
        // tel fits column
        const tel = document.querySelector('.talk-tel'); if (tel) { const par = tel.parentElement; if (rect(tel).right > rect(par).right + 1 || tel.scrollWidth > tel.clientWidth + 1) out.tel = Math.round(rect(tel).right - rect(par).right); out.telSize = getComputedStyle(tel).fontSize; }
        // stamp overlaps text?
        const stamp = document.querySelector('main .stamp'); if (stamp) {
          const s = rect(stamp); const hits = [];
          const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
          let n; const range = document.createRange();
          while ((n = walker.nextNode())) { if (!n.textContent.trim() || stamp.contains(n) || n.parentElement.closest('.sr-only,.hp')) continue; const cs = getComputedStyle(n.parentElement); if (cs.display === 'none' || cs.visibility === 'hidden') continue; range.selectNodeContents(n); for (const rc of range.getClientRects()) { if (rc.width && rc.height && rc.left < s.right && rc.right > s.left && rc.top < s.bottom && rc.bottom > s.top) { hits.push(n.textContent.trim().slice(0, 25)); break; } } }
          if (hits.length) out.stampHits = hits;
          out.stampOut = s.right > innerWidth ? Math.round(s.right - innerWidth) : 0;
        }
        // toc links wrap / overlap
        const toc = [...document.querySelectorAll('.toc a')].map(a => rect(a)); 
        for (let i = 0; i < toc.length; i++) for (let j = i + 1; j < toc.length; j++) { const A = toc[i], B = toc[j]; if (A.left < B.right - 1 && A.right > B.left + 1 && A.top < B.bottom - 1 && A.bottom > B.top + 1) out.tocOverlap = true; }
        const tocH = [...document.querySelectorAll('.toc a')].map(a => Math.round(rect(a).height)); out.tocH = tocH.join(',');
        // sticky rail taller than viewport?
        const rail = document.querySelector('.faq-rail, .contact-side'); if (rail && getComputedStyle(rail).position === 'sticky') out.railH = Math.round(rect(rail).height);
        return out;
      });
      if (r.over > 0) add('pageOverflow', w, r.over);
      if (r.poke.length) add('poke', w, r.poke.join(' | '));
      if (r.spill.length) add('spill', w, r.spill.join(' | '));
      if (r.ctaWrap) add('headerCtaWrap', w, r.ctaWrap);
      if (r.optWrap && r.optWrap.length) add('optWrap', w, r.optWrap.join(' | '));
      if (r.ticketHeadWrap) add('ticketHeadWrap', w, r.ticketHeadWrap);
      if (r.tel) add('telOverflow', w, r.tel);
      if (r.stampHits) add('stampHits', w, r.stampHits.join(' | '));
      if (r.stampOut) add('stampOut', w, r.stampOut);
      if (r.tocOverlap) add('tocOverlap', w);
      if (r.railH && r.railH > 900 - 104) add('railTallerThanViewport(900)', w, r.railH);
      if ([360, 380, 600, 760, 980, 1100, 1280, 1440, 1920].includes(w)) console.log(path, w, 'tocH', r.tocH, 'telSize', r.telSize, 'railH', r.railH);
    }
    console.log(path, JSON.stringify(issues, null, 1));
    await ctx.close();
  }
  await b.close();
})();
