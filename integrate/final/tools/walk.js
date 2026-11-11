// walk.js: structural facts per page, for the consistency pass
const { chromium } = require('playwright');
const fs = require('fs');
const PATHS = '/,/services/,/consulting/,/work/,/process/,/pricing/,/faq/,/contact/,/about/,/start/,/web-design-baton-rouge/,/web-design-denham-springs/,/web-design-gonzales/,/web-design-prairieville/,/privacy/,/terms/,/checkout/,/checkout/success/,/404.html'.split(',');
const base = process.argv[2] || 'http://localhost:8720';
const out = process.argv[3];
(async () => {
  const b = await chromium.launch(); const res = {};
  for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 700 ? 844 : 900 }, reducedMotion: 'reduce', colorScheme: 'light' });
    await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    for (const p of PATHS) {
      const page = await ctx.newPage(); await page.goto(base + p, { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
      res[p + '@' + w] = await page.evaluate(() => {
        const px = v => Math.round(parseFloat(v) * 10) / 10;
        const cls = e => e.tagName.toLowerCase() + (e.className && e.className.toString().trim() ? '.' + e.className.toString().trim().split(/\s+/).join('.') : '');
        const txt = e => e.textContent.replace(/\s+/g, ' ').trim();
        const top = e => Math.round(e.getBoundingClientRect().top + scrollY);
        const bot = e => Math.round(e.getBoundingClientRect().bottom + scrollY);
        const vis = e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden'; };
        const o = { height: document.documentElement.scrollHeight };
        const header = document.querySelector('.site-header'); const main = document.querySelector('main');
        o.headerBottom = bot(header);
        const first = main.firstElementChild; o.firstSection = cls(first);
        const firstVisible = [...main.querySelectorAll('.eyebrow, h1, p, .label')].find(vis);
        o.gapUnderHeader = firstVisible ? top(firstVisible) - o.headerBottom : null; o.firstThing = firstVisible ? cls(firstVisible) + ' "' + txt(firstVisible).slice(0, 40) + '"' : null;
        const ph = main.querySelector('.page-head, .hero');
        if (ph) {
          const c = ph.querySelector('.container'); const h1 = ph.querySelector('h1'); const lede = ph.querySelector('.lede'); const eb = ph.querySelector('.eyebrow');
          o.head = { section: cls(ph), container: c && cls(c), kids: c && [...c.children].map(cls), eyebrow: eb && txt(eb), h1: h1 && txt(h1), h1class: h1 && h1.className, h1size: h1 && px(getComputedStyle(h1).fontSize), h1lines: h1 && Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight)),
            ledeSize: lede && px(getComputedStyle(lede).fontSize), ledeChars: lede && txt(lede).length, h1ToLede: h1 && lede && top(lede) - bot(h1), ebToH1: eb && h1 && top(h1) - bot(eb),
            buttons: [...ph.querySelectorAll('.btn')].filter(vis).map(x => txt(x) + ' [' + x.className + (x.hasAttribute('data-booking') ? ' data-booking' : '') + '] -> ' + x.getAttribute('href')),
            strip: (ph.querySelector('.price-strip') && cls(ph.querySelector('.price-strip')) + ' "' + txt(ph.querySelector('.price-strip')) + '" -> ' + ph.querySelector('.price-strip').getAttribute('href')) || null,
            padTop: px(getComputedStyle(ph).paddingTop), padBottom: px(getComputedStyle(ph).paddingBottom), headHeight: Math.round(ph.getBoundingClientRect().height) };
        }
        o.sections = [...main.children].map(s => { const cs = getComputedStyle(s); const sh = s.querySelector('.section-head'); const h2 = s.querySelector('h2'); const eb = sh && sh.querySelector('.eyebrow'); const sub = sh && sh.querySelector('.section-sub');
          return { el: cls(s) + (s.id ? '#' + s.id : ''), pt: px(cs.paddingTop), pb: px(cs.paddingBottom), h: Math.round(s.getBoundingClientRect().height), head: sh ? cls(sh) : null, eyebrow: eb ? txt(eb) : null,
            h2: h2 ? txt(h2).slice(0, 60) : null, h2class: h2 ? h2.className : null, h2size: h2 ? px(getComputedStyle(h2).fontSize) : null, sub: sub ? px(getComputedStyle(sub).fontSize) : null,
            headGap: sh ? px(getComputedStyle(sh).marginBottom) : null, kids: s.querySelector('.container') ? [...s.querySelector('.container').children].map(cls).slice(0, 8) : [] }; });
        const band = main.querySelector('.cta-band');
        if (band) { const inner = band.querySelector('.cta-inner'); const prev = band.previousElementSibling;
          o.band = { cls: cls(band), inner: cls(inner), kids: [...inner.children].map(cls), h2: txt(band.querySelector('h2')), p: [...band.querySelectorAll('.cta-copy > p')].map(x => cls(x) + ': ' + txt(x)), buttons: [...band.querySelectorAll('.btn')].map(x => txt(x) + ' [' + x.className + (x.hasAttribute('data-booking') ? ' data-booking' : '') + '] -> ' + x.getAttribute('href')),
            appt: band.querySelector('.appt') ? txt(band.querySelector('.appt')) : null, prev: cls(prev), prevPb: px(getComputedStyle(prev).paddingBottom), pt: px(getComputedStyle(band).paddingTop), h: Math.round(band.getBoundingClientRect().height), h2size: px(getComputedStyle(band.querySelector('h2')).fontSize) }; }
        else { const last = main.lastElementChild; o.end = { last: cls(last), pb: px(getComputedStyle(last).paddingBottom), mainPb: px(getComputedStyle(main).paddingBottom) }; }
        o.buttons = [...main.querySelectorAll('.btn')].map(x => ({ t: txt(x), c: x.className, h: x.getAttribute('href'), bk: x.hasAttribute('data-booking'), vis: vis(x), aria: x.getAttribute('aria-label') }));
        o.moreLinks = [...main.querySelectorAll('.more-link')].map(x => txt(x) + ' -> ' + x.getAttribute('href'));
        o.headings = [...main.querySelectorAll('h1,h2,h3,h4')].filter(vis).map(h => h.tagName + (h.className ? '.' + h.className.trim().split(/\s+/).join('.') : '') + ' ' + px(getComputedStyle(h).fontSize) + ' | ' + txt(h).slice(0, 50));
        o.eyebrows = [...main.querySelectorAll('.eyebrow')].filter(vis).map(e => e.tagName + ' ' + px(getComputedStyle(e).fontSize) + ' | ' + txt(e));
        // inline links in main: style signature
        const sig = {}; for (const a of main.querySelectorAll('a:not(.btn)')) { if (!vis(a)) continue; const cs = getComputedStyle(a); const k = [a.className || '(plain)', cs.textDecorationLine, cs.fontWeight, cs.color].join(' | '); (sig[k] = sig[k] || []).push(txt(a).slice(0, 30)); }
        o.links = Object.entries(sig).map(([k, v]) => k + ' x' + v.length + ' e.g. ' + v[0]);
        const lists = {}; for (const l of main.querySelectorAll('ul,ol')) { const cs = getComputedStyle(l); const k = l.tagName + '.' + (l.className || '(plain)') + ' | ' + cs.listStyleType + ' | role=' + l.getAttribute('role') + ' | pl=' + cs.paddingLeft; lists[k] = (lists[k] || 0) + 1; }
        o.lists = lists;
        return o;
      });
      await page.close();
    }
    await ctx.close();
  }
  await b.close(); fs.writeFileSync(out, JSON.stringify(res, null, 1)); console.log('wrote', out);
})();
