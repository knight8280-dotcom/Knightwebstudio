// List every visible link/button in <main> (and the phone bar/header) at 390x844 with text, href and y; for same-page anchors, tap and measure where the target lands.
const { chromium } = require('playwright');
const base = 'http://localhost:8720';
const pages = (process.argv[2] || '/start/,/,/pricing/,/consulting/,/work/,/about/,/contact/').split(',');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true, colorScheme: 'light' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  for (const p of pages) {
    const page = await ctx.newPage();
    await page.goto(base + p, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const links = await page.evaluate(() => [...document.querySelectorAll('main a, main button, #mobile-cta a, .site-header a')].filter(a => { const r = a.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).map(a => ({ t: (a.innerText || a.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 60), href: a.getAttribute('href'), target: a.getAttribute('target'), booking: a.hasAttribute('data-booking'), y: Math.round(a.getBoundingClientRect().top + scrollY), cls: a.className.toString().slice(0, 40) })));
    console.log('\n# ' + p);
    for (const l of links) console.log(String(l.y).padStart(6), (l.booking ? 'BOOK ' : '     ') + (l.target || '').padEnd(7), (l.href || '').padEnd(48), '|', l.t);
    // same-page anchors
    const anchors = [...new Set(links.filter(l => l.href && (l.href.startsWith('#') || l.href.startsWith(p + '#'))).map(l => l.href))];
    for (const h of anchors) {
      const id = h.split('#')[1];
      const res = await page.evaluate(async id => {
        const t = document.getElementById(id); if (!t) return { missing: true };
        location.hash = ''; window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 150));
        location.hash = '#' + id; await new Promise(r => setTimeout(r, 1200));
        const hdr = document.getElementById('site-header').getBoundingClientRect();
        const bar = document.getElementById('mobile-cta'); const barTop = bar && bar.classList.contains('show') ? bar.getBoundingClientRect().top : innerHeight;
        const r = t.getBoundingClientRect();
        const h = t.matches('h1,h2,h3,h4') ? t : t.querySelector('h1,h2,h3,h4,summary');
        const hr = h ? h.getBoundingClientRect() : null;
        return { targetTop: Math.round(r.top), headerBottom: Math.round(hdr.bottom), barTop: Math.round(barTop), headingTop: hr ? Math.round(hr.top) : null, headingText: h ? h.innerText.replace(/\s+/g, ' ').slice(0, 50) : null, tag: t.tagName };
      }, id);
      console.log('   ANCHOR', h, JSON.stringify(res));
    }
    await page.close();
  }
  await b.close();
})();
