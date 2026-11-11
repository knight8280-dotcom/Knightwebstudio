const { chromium } = require('playwright');
const base = 'http://localhost:8720';
const ALL = ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/web-design-denham-springs/', '/web-design-gonzales/', '/web-design-prairieville/', '/privacy/', '/terms/', '/checkout/', '/checkout/success/', '/404.html'];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const open = async (path, w, h = 844) => { const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: h }); await p.goto(base + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150); return p; };

  console.log('== price strip: right edge of the figures against the column (px over), and link box width');
  for (const path of ['/', '/services/', '/consulting/', '/start/', '/web-design-baton-rouge/']) {
    const out = [];
    for (const w of [360, 375, 380, 390, 393, 412, 430, 1280]) {
      const p = await open(path, w);
      out.push(w + ':' + JSON.stringify(await p.evaluate(() => { const s = document.querySelector('.price-strip'); if (!s) return null; const n = s.querySelector('.price-strip-nums'); const c = s.parentElement.getBoundingClientRect(); const nr = n.getBoundingClientRect(); const sr = s.getBoundingClientRect();
        return { numsW: Math.round(nr.width), colW: Math.round(c.width), over: Math.round(nr.right - c.right), linkW: Math.round(sr.width), tag: s.tagName, name: s.tagName === 'A' ? s.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : '' }; })));
      await p.close();
    }
    console.log(path, '\n  ' + out.join('\n  '));
  }

  console.log('\n== price-list rows: price on another line than the name while a leader is drawn');
  for (const path of ['/', '/services/', '/consulting/', '/pricing/', '/about/', '/start/']) {
    for (const w of [360, 390, 600, 760, 820, 1024, 1280, 1440]) {
      const p = await open(path, w);
      await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true));
      const r = await p.evaluate(() => [...document.querySelectorAll('.pl-row')].map(row => { const n = row.querySelector('.pl-name'), d = row.querySelector('.dots'), pr = row.querySelector('.pl-price'); if (!n || !pr) return null; const nr = n.getBoundingClientRect(), prr = pr.getBoundingClientRect(); if (!nr.width) return null;
        const dv = d && getComputedStyle(d).display !== 'none' ? d.getBoundingClientRect() : null; const wrapped = prr.top > nr.bottom - 4; return wrapped && dv && dv.width > 0 ? n.textContent.trim().slice(0, 26) + ' | ' + pr.textContent.trim().slice(0, 26) + ' | leader ' + Math.round(dv.width) + 'px' : null; }).filter(Boolean));
      if (r.length) console.log(path, w, r.length + ' row(s):', JSON.stringify(r.slice(0, 4)));
      await p.close();
    }
  }
  // toc rows with leader pointing at nothing
  console.log('\n== footer: e-mail link on two lines');
  for (const w of [760, 800, 820, 900, 960, 979, 980, 1100]) { const p = await open('/pricing/', w); console.log(w, JSON.stringify(await p.evaluate(() => { const a = document.querySelector('.site-footer a[href^="mailto"]'); const r = a.getBoundingClientRect(); return { h: Math.round(r.height), w: Math.round(r.width), lines: a.getClientRects().length, colW: Math.round(a.parentElement.getBoundingClientRect().width) }; }))); await p.close(); }

  console.log('\n== business card tagline lines');
  for (const path of ['/', '/about/']) for (const w of [360, 375, 390, 412, 430, 980, 1040, 1100, 1440]) { const p = await open(path, w); const r = await p.evaluate(() => { const s = document.querySelector('.bizcard-top span'); if (!s) return null; const c = s.closest('.bizcard'); const lh = parseFloat(getComputedStyle(s).lineHeight) || 17; return { lines: Math.round(s.getBoundingClientRect().height / lh), cardW: Math.round(c.getBoundingClientRect().width), onPaper: c.classList.contains('on-paper'), tilt: c.classList.contains('tilt') }; }); console.log(path, w, JSON.stringify(r)); await p.close(); }

  console.log('\n== closing band: appointment card width from 980px (should be 21rem = 336)');
  for (const path of ['/', '/pricing/', '/web-design-gonzales/', '/start/']) for (const w of [980, 1100, 1280, 1440, 1920]) { const p = await open(path, w, 900); const r = await p.evaluate(() => { const a = document.querySelector('.cta-band .appt'); if (!a) return null; const r = a.getBoundingClientRect(); const c = document.querySelector('.cta-copy').getBoundingClientRect(); return { apptW: Math.round(r.width), gap: Math.round(r.left - c.right), copyW: Math.round(c.width) }; }); console.log(path, w, JSON.stringify(r)); await p.close(); }

  console.log('\n== payment plan: deposit block as a share of the bar');
  for (const path of ['/pricing/', '/consulting/']) for (const w of [390, 600, 820, 1024, 1440]) { const p = await open(path, w); const r = await p.evaluate(() => [...document.querySelectorAll('.payplan-bar')].map(bar => { const d = bar.querySelector('.payplan-dep'); const br = bar.getBoundingClientRect(), dr = d.getBoundingClientRect(); const segs = [...bar.querySelectorAll('.payplan-seg')].map(s => Math.round(s.getBoundingClientRect().width)); return (100 * dr.width / br.width).toFixed(1) + '% of ' + Math.round(br.width) + ' segs ' + segs.join('/'); })); console.log(path, w, JSON.stringify(r)); await p.close(); }

  console.log('\n== section-head-split: gap between h2 and its intro on a phone vs a plain head');
  for (const path of ['/', '/consulting/', '/pricing/', '/start/']) { const p = await open(path, 390); const r = await p.evaluate(() => [...document.querySelectorAll('.section-head')].map(h => { const t = h.querySelector('h2'), s = h.querySelector('.section-sub'); if (!t || !s) return null; return (h.classList.contains('section-head-split') ? 'split ' : 'plain ') + Math.round(s.getBoundingClientRect().top - t.getBoundingClientRect().bottom) + 'px'; }).filter(Boolean)); console.log(path, JSON.stringify(r)); await p.close(); }

  console.log('\n== facts shelf at 980-1099');
  for (const path of ['/', '/start/']) for (const w of [980, 1024, 1099]) { const p = await open(path, w); console.log(path, w, JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.points li')].map(li => Math.round(li.getBoundingClientRect().height) + '@' + Math.round(li.getBoundingClientRect().width))))); await p.close(); }

  console.log('\n== typing dots outside a .reveal; .wide-only on elements whose display is set later; hover lift on revealed prints');
  for (const path of ALL) { const p = await open(path, 390); const r = await p.evaluate(() => ({ typingOutsideReveal: [...document.querySelectorAll('.bubble-typing')].filter(e => !e.closest('.reveal')).length, typing: document.querySelectorAll('.bubble-typing').length,
    wideOnlyShown: [...document.querySelectorAll('.wide-only')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.className) })); if (r.typing || r.wideOnlyShown.length) console.log(path, JSON.stringify(r)); await p.close(); }
  await b.close();
})();
