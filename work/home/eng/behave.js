const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[360, 740], [390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500, isMobile: w < 500 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await p.goto('http://localhost:8720/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(2200);
    console.log(`\n===== ${w}x${h}`);
    // 1 targets
    const small = await p.evaluate(() => [...document.querySelectorAll('a, button, summary, input, select, [role=button]')].filter(e => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !e.closest('.skip-link') && !(e.closest('.nav') && getComputedStyle(e.closest('.nav')).visibility === 'hidden'); }).map(e => { const r = e.getBoundingClientRect(); return { n: (e.getAttribute('aria-label') || e.textContent).trim().replace(/\s+/g, ' ').slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) }; }).filter(x => x.w < 44 || x.h < 44));
    console.log('targets under 44px:', JSON.stringify(small));
    // first screen facts
    const fs = await p.evaluate(() => { const B = s => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().bottom) : null; }; return { h1: B('h1'), lede: B('.hero .lede'), primary: B('.hero .btn-primary'), secondary: B('.hero .btn-row .btn:last-child'), strip: B('.hero .price-strip'), phoneTop: Math.round(document.querySelector('.hero-phone').getBoundingClientRect().top), vh: innerHeight, bar: (() => { const m = document.querySelector('.mobile-cta'); const cs = getComputedStyle(m); return cs.display + ' ' + cs.visibility + ' ' + cs.opacity + ' top ' + Math.round(m.getBoundingClientRect().top); })() }; });
    console.log('first screen:', JSON.stringify(fs));
    // 3 anchors
    for (const sel of ['.hero .btn-row a[href="#automation"]', '.hero a.price-strip']) {
      await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(400); await p.click(sel); await p.waitForTimeout(1600);
      const r = await p.evaluate(sel => { const id = document.querySelector(sel).getAttribute('href'); const t = document.querySelector(id); const hdr = document.querySelector('.site-header').getBoundingClientRect().bottom; const first = t.querySelector('h2, .eyebrow'); const fr = first.getBoundingClientRect(); const vis = [...t.querySelectorAll('.reveal')].filter(e => { const r = e.getBoundingClientRect(); return r.top < innerHeight - 40 && r.bottom > 0; }).map(e => +getComputedStyle(e).opacity); return { id, hash: location.hash, sectionTop: Math.round(t.getBoundingClientRect().top), hdr: Math.round(hdr), firstTextTop: Math.round(fr.top), revealOpacities: vis, focus: document.activeElement.tagName }; }, sel);
      console.log('anchor', JSON.stringify(r));
    }
    // 5 reveal lag: jump down the page in steps, 700ms after each stop is anything in view still faded?
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
    const H = await p.evaluate(() => document.documentElement.scrollHeight); const lag = [];
    for (let y = 0; y < H; y += Math.round(h * 0.9)) { await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y); await p.waitForTimeout(750);
      const f = await p.evaluate(() => [...document.querySelectorAll('.reveal, .reveal .seq')].filter(e => { const r = e.getBoundingClientRect(); return r.bottom > 80 && r.top < innerHeight - 60 && +getComputedStyle(e).opacity < 0.95; }).map(e => e.className.toString().slice(0, 40) + ' ' + (+getComputedStyle(e).opacity).toFixed(2) + ' top ' + Math.round(e.getBoundingClientRect().top)));
      if (f.length) lag.push(`y=${y}: ${f.join(' | ')}`); }
    console.log('still faded 750ms after a jump:', lag.length ? '\n  ' + lag.join('\n  ') : 'none');
    // never-revealed check after full scroll
    const never = await p.evaluate(() => [...document.querySelectorAll('.reveal')].filter(e => !e.classList.contains('visible')).map(e => e.className.toString()));
    console.log('reveal blocks never shown after scrolling the page:', JSON.stringify(never));
    // bar state at the very bottom and over the closing band
    await p.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await p.waitForTimeout(700);
    const bot = await p.evaluate(() => { const m = document.querySelector('.mobile-cta'); const cs = getComputedStyle(m); const r = m.getBoundingClientRect(); const last = document.querySelector('.footer-bottom, .site-footer').getBoundingClientRect(); return { barDisplay: cs.display, barVis: cs.visibility, barOp: cs.opacity, barTop: Math.round(r.top), vh: innerHeight, cls: m.className, footerBottom: Math.round(document.querySelector('.site-footer').getBoundingClientRect().bottom) }; });
    console.log('at page bottom:', JSON.stringify(bot));
    const band = await p.evaluate(async () => { const btn = [...document.querySelectorAll('.cta-band .btn')].pop(); btn.scrollIntoView({ block: 'end', behavior: 'instant' }); await new Promise(r => setTimeout(r, 700)); const m = document.querySelector('.mobile-cta'); const cs = getComputedStyle(m); const br = btn.getBoundingClientRect(); const mr = m.getBoundingClientRect(); const shown = cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.5; return { btn: btn.textContent.trim(), btnBottom: Math.round(br.bottom), barShown: shown, barTop: Math.round(mr.top), covered: shown && br.bottom > mr.top }; });
    console.log('closing band last button scrolled to the bottom edge:', JSON.stringify(band));
    console.log('errors:', JSON.stringify(errs));
    await ctx.close();
  }
  await b.close();
})();
