// Structure: headings, landmarks, duplicate ids, images, targets, focus rings per stop, focus not obscured, anchors
const { chromium, open, S } = require('./lib.js');
const base = 'http://localhost:8720';
const ALL = Object.assign({ privacy: { url: '/privacy/' }, terms: { url: '/terms/' } }, S);
const names = (process.argv[2] || 'privacy,terms,co-noplan,co-care,ok-paid,ok-unpaid,ok-confirming').split(',');
const views = (process.argv[3] || 'm-light,d-dark').split(',');
(async () => {
  const browser = await chromium.launch();
  for (const name of names) for (const view of views) {
    const s = ALL[name];
    const { ctx, page, errors } = await open(browser, s, view, { rm: 'reduce' });
    await page.goto(base + s.url, { waitUntil: 'load' }); await page.waitForTimeout(900);
    const st = await page.evaluate(() => {
      const vis = el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !el.closest('[hidden]'); };
      const o = {};
      o.h = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(vis).map(h => h.tagName[1] + ':' + h.textContent.trim().slice(0, 28));
      o.h1 = document.querySelectorAll('h1').length;
      const ids = {}; for (const e of document.querySelectorAll('[id]')) ids[e.id] = (ids[e.id] || 0) + 1; o.dupIds = Object.entries(ids).filter(([k, v]) => v > 1).map(([k]) => k);
      o.landmarks = ['header', 'nav', 'main', 'footer', 'aside'].map(t => t + ':' + document.querySelectorAll(t).length).join(' ');
      o.navLabels = [...document.querySelectorAll('nav')].map(n => n.getAttribute('aria-label') || (n.getAttribute('aria-labelledby') ? '#' + n.getAttribute('aria-labelledby') : 'UNLABELLED'));
      o.imgs = [...document.querySelectorAll('img')].map(i => [i.getAttribute('src'), i.getAttribute('alt') != null, i.width, i.height, i.loading].join(','));
      o.svgNoHidden = [...document.querySelectorAll('svg')].filter(sv => sv.getAttribute('aria-hidden') !== 'true' && !sv.getAttribute('role') && !sv.closest('[aria-hidden="true"]')).length;
      o.ariaCurrent = [...document.querySelectorAll('[aria-current]')].map(a => a.textContent.trim());
      o.mobileCta = !!document.getElementById('mobile-cta');
      o.dataPage = document.body.dataset.page;
      // targets
      o.small = [];
      for (const el of document.querySelectorAll('main a, main button, main summary, main input')) { if (!vis(el)) continue; const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
        const inline = cs.display === 'inline' && el.parentElement.textContent.trim().length > el.textContent.trim().length + 6;
        if (!inline && (r.height < 43.5 || r.width < 43.5)) o.small.push(Math.round(r.width) + 'x' + Math.round(r.height) + ' ' + el.textContent.trim().slice(0, 24));
        if (inline && r.height < 24) o.small.push('inline<24 ' + Math.round(r.height) + ' ' + el.textContent.trim().slice(0, 24)); }
      // anchors
      o.badAnchors = [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(h => h.length > 1 && !document.getElementById(h.slice(1)));
      o.newTabNoRel = [...document.querySelectorAll('a[target="_blank"]')].filter(a => !/noopener/.test(a.rel)).map(a => a.href);
      o.relLinks = [...document.querySelectorAll('main a[href]')].map(a => a.getAttribute('href')).filter(h => !/^(\/|#|https?:|mailto:|tel:)/.test(h));
      o.small15 = [];
      const w = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
      while (w.nextNode()) { const n = w.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (!vis(el) || el.closest('svg,noscript,#checkout-form')) continue; const cs = getComputedStyle(el); const fs = parseFloat(cs.fontSize);
        if (fs < 15) o.small15.push(fs + (cs.textTransform === 'uppercase' ? ' caps ' : ' ') + n.textContent.trim().slice(0, 22)); }
      return o;
    });
    // tab through main
    const stops = [];
    await page.evaluate(() => { const m = document.getElementById('main'); m.setAttribute('tabindex', '-1'); m.focus(); m.removeAttribute('tabindex'); });
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(() => { const el = document.activeElement; if (!el || el === document.body) return null; if (!el.closest('main')) return { out: true };
        const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); const hdr = document.querySelector('.site-header').getBoundingClientRect();
        const bar = document.querySelector('#mobile-cta'); const br = bar && getComputedStyle(bar).visibility !== 'hidden' ? bar.getBoundingClientRect() : null;
        return { t: el.textContent.trim().slice(0, 22), ow: cs.outlineWidth, os: cs.outlineStyle, oc: cs.outlineColor, underHeader: r.top < hdr.bottom - 1 && r.bottom > hdr.top, off: r.bottom > innerHeight || r.top < 0, underBar: br ? r.bottom > br.top : false, fv: el.matches(':focus-visible') }; });
      if (!f) continue; if (f.out) break; stops.push(f);
    }
    const badFocus = stops.filter(f => f.os === 'none' || parseFloat(f.ow) < 2 || f.underHeader || f.off || f.underBar);
    console.log('\n== ' + name + ' ' + view);
    console.log(' headings:', st.h.join(' | '));
    console.log(' h1 count', st.h1, '| dup ids', JSON.stringify(st.dupIds), '|', st.landmarks, '| nav labels', JSON.stringify(st.navLabels), '| aria-current', JSON.stringify(st.ariaCurrent), '| mobile-cta', st.mobileCta, '| data-page', st.dataPage);
    console.log(' imgs', JSON.stringify(st.imgs), '| svg not hidden', st.svgNoHidden, '| bad anchors', JSON.stringify(st.badAnchors), '| _blank without noopener', JSON.stringify(st.newTabNoRel), '| relative links', JSON.stringify(st.relLinks));
    console.log(' small targets', JSON.stringify(st.small), '| text <15px', JSON.stringify([...new Set(st.small15)]));
    console.log(' tab stops in main:', stops.length, stops.map(f => f.t).join(' > ').slice(0, 400));
    console.log(' focus problems:', badFocus.length ? JSON.stringify(badFocus) : 'none', '| ring', [...new Set(stops.map(f => f.ow + ' ' + f.os + ' ' + f.oc))].join(' ; '));
    const perr = errors.filter(e => /PAGEERROR/.test(e)); if (perr.length) console.log(' PAGE ERRORS', perr.join(' | '));
    await ctx.close();
  }
  await browser.close();
})();
