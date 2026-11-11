const { chromium } = require('playwright');
const URL = 'http://localhost:8720/start/';
(async () => {
  const b = await chromium.launch();
  for (const vp of [{ width: 390, height: 844, m: true }, { width: 820, height: 1180, m: true }, { width: 1440, height: 900, m: false }]) {
    for (const theme of ['light', 'dark']) {
      const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: theme, hasTouch: vp.m });
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
      const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
      console.log(`\n===== ${vp.width} ${theme}`);
      if (theme === 'light') {
        const s = await p.evaluate(() => {
          const out = {};
          out.h1 = document.querySelectorAll('h1').length;
          out.landmarks = ['header', 'main', 'footer', 'nav', '[role=banner]', '[role=contentinfo]', '[role=navigation]', '[role=region]', 'section[aria-label],section[aria-labelledby]'].map(s => s + ':' + document.querySelectorAll(s).length).join(' ');
          out.outsideLandmarks = [...document.body.children].filter(e => !['HEADER', 'MAIN', 'FOOTER', 'SCRIPT'].includes(e.tagName)).map(e => e.tagName.toLowerCase() + '.' + e.className);
          out.lists = [...document.querySelectorAll('main ul, main ol, main dl')].map(l => l.tagName.toLowerCase() + '.' + l.className + ':' + getComputedStyle(l).display + '/' + getComputedStyle(l).listStyleType + '/role=' + l.getAttribute('role'));
          out.ariaHidden = [...document.querySelectorAll('main [aria-hidden="true"]')].filter(e => !e.ownerSVGElement && e.tagName !== 'svg').map(e => e.tagName.toLowerCase() + '.' + e.className + ' "' + e.textContent.trim().replace(/\s+/g, ' ').slice(0, 40) + '"' + (e.querySelector('a,button') ? ' HAS FOCUSABLE' : ''));
          out.svgNoA11y = [...document.querySelectorAll('svg')].filter(s => s.getAttribute('aria-hidden') !== 'true' && !s.getAttribute('role') && !s.closest('[aria-hidden=true]')).map(s => s.getAttribute('class'));
          out.links = [...document.querySelectorAll('a, button')].map(a => { const n = (a.getAttribute('aria-label') || a.textContent).trim().replace(/\s+/g, ' '); return n ? null : 'NO NAME ' + a.outerHTML.slice(0, 80); }).filter(Boolean);
          out.newTab = [...document.querySelectorAll('a[target=_blank]')].map(a => a.textContent.trim().replace(/\s+/g, ' ').slice(0, 30) + ' rel=' + a.rel);
          out.lang = document.documentElement.lang;
          out.imgs = [...document.images].map(i => ({ alt: i.alt.slice(0, 30), w: i.getAttribute('width'), h: i.getAttribute('height'), loading: i.loading, top: Math.round(i.getBoundingClientRect().top + scrollY), natural: i.naturalWidth + 'x' + i.naturalHeight, ratioAttr: +(i.getAttribute('width') / i.getAttribute('height')).toFixed(3) }));
          return out;
        });
        console.log(JSON.stringify(s, null, 1));
      }
      // touch targets
      if (vp.m && theme === 'light') {
        const t = await p.evaluate(() => [...document.querySelectorAll('a, button')].map(el => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[hidden]')) return null; const r = el.getBoundingClientRect(); if (!r.width) return null; let h = r.height, w = r.width; const af = getComputedStyle(el, '::after'); if (af.position === 'absolute' && af.content !== 'none') { const tt = parseFloat(af.top), bb = parseFloat(af.bottom); if (!isNaN(tt) && !isNaN(bb)) h = r.height - tt - bb; } return { n: (el.getAttribute('aria-label') || el.textContent).trim().replace(/\s+/g, ' ').slice(0, 34), w: Math.round(w), h: Math.round(h), rawH: Math.round(r.height), disp: cs.display }; }).filter(Boolean));
        console.log('targets (w x h, raw h):'); t.forEach(x => console.log('   ' + (x.h < 44 || x.w < 44 ? 'SMALL ' : '      ') + x.w + 'x' + x.h + ' (raw ' + x.rawH + ', ' + x.disp + ') ' + x.n));
      }
      // focus walk
      await p.evaluate(() => window.scrollTo(0, 0));
      const seen = []; let issues = 0;
      for (let i = 0; i < 40; i++) {
        await p.keyboard.press('Tab'); await p.waitForTimeout(350);
        const f = await p.evaluate(() => {
          const el = document.activeElement; if (!el || el === document.body) return null;
          const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
          const header = document.getElementById('site-header').getBoundingClientRect(); const bar = document.getElementById('mobile-cta'); const bcs = getComputedStyle(bar); const barOn = bcs.display !== 'none' && bar.classList.contains('show'); const br = bar.getBoundingClientRect();
          const topLimit = header.bottom > 0 ? header.bottom : 0; const botLimit = barOn ? br.top : innerHeight;
          const inHeader = el.closest('.site-header, .topbar, .mobile-cta, .skip-link');
          const obscured = !inHeader && (r.top < topLimit - 1 || r.bottom > botLimit + 1);
          // ring colour vs adjacent background
          const parse = c => { const m = c.match(/[\d.]+/g).map(Number); return m; };
          const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
          let bgEl = el.parentElement, bg = null; while (bgEl) { const c = getComputedStyle(bgEl).backgroundColor; const m = parse(c); if (m.length < 4 || m[3] > .9) { bg = m; break; } bgEl = bgEl.parentElement; }
          const oc = parse(cs.outlineColor); const ratio = bg ? (Math.max(lum(oc), lum(bg)) + .05) / (Math.min(lum(oc), lum(bg)) + .05) : null;
          return { n: (el.getAttribute('aria-label') || el.textContent).trim().replace(/\s+/g, ' ').slice(0, 30), cls: el.className.toString().slice(0, 30), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor + ' off ' + cs.outlineOffset, ratio: ratio && +ratio.toFixed(2), bg: bgEl && (bgEl.tagName.toLowerCase() + '.' + bgEl.className.toString().split(' ')[0]), top: Math.round(r.top), bottom: Math.round(r.bottom), topLimit: Math.round(topLimit), botLimit: Math.round(botLimit), obscured, barOn, inView: r.bottom > 0 && r.top < innerHeight };
        });
        if (!f) break; if (seen.length && f.n === seen[0].n && f.cls === seen[0].cls) break;
        seen.push(f);
        const bad = f.obscured || !f.inView || !/solid/.test(f.outline) || parseFloat(f.outline.split(' ')[1]) < 2 || (f.ratio !== null && f.ratio < 3);
        if (bad) issues++;
        console.log((bad ? ' BAD ' : '     ') + JSON.stringify(f));
        if (vp.width === 390 && theme === 'light' && [5, 6, 13, 19].includes(i)) await p.screenshot({ path: `work/start/eng/focus-${vp.width}-${i}.png` });
      }
      console.log('tab stops:', seen.length, 'issues:', issues);
      await ctx.close();
    }
  }
  await b.close();
})();
