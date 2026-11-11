const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const path of ['/privacy/', '/terms/']) for (const [w, h] of [[1280, 560], [1093, 520], [1440, 900]]) {
    const slug = path.replace(/\//g, '');
    const p = await b.newPage({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); await p.route(/plausible/, r => r.abort());
    await p.goto('http://localhost:8720' + path); await p.waitForTimeout(300);
    await p.addStyleTag({ content: `@media (min-width: 980px) { [data-page="${slug}"] .toc { max-height: calc(100vh - var(--header-h) - var(--s-7)); overflow-y: auto; } }` });
    await p.evaluate(() => scrollTo(0, 1400)); await p.waitForTimeout(200);
    const f = await p.evaluate(() => { const t = document.querySelector('.toc'); const links = t.querySelectorAll('a'); const a = links[links.length - 1]; a.focus(); const rc = a.getBoundingClientRect(); const tr = t.getBoundingClientRect(); return { tocBottom: Math.round(tr.bottom), vh: innerHeight, scrolls: t.scrollHeight > t.clientHeight, lastTop: Math.round(rc.top), lastBottom: Math.round(rc.bottom), lastVisible: rc.top >= tr.top && rc.bottom <= Math.min(tr.bottom, innerHeight) + 1, pageOverflow: document.documentElement.scrollWidth - innerWidth }; });
    console.log(path, w + 'x' + h, JSON.stringify(f));
    if (w === 1280 && slug === 'terms') await p.screenshot({ path: 'shots/stickyfix-terms-1280x560.png' });
    await p.close(); }
  await b.close(); })();
