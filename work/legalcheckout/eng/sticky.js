const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const path of ['/privacy/', '/terms/']) for (const [w, h] of [[1366, 768], [1366, 625], [1280, 560], [1093, 520], [1024, 600]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); await p.route(/plausible/, r => r.abort());
    await p.goto('http://localhost:8720' + path); await p.waitForTimeout(300);
    await p.evaluate(() => scrollTo(0, 1400)); await p.waitForTimeout(200);
    const r = await p.evaluate(() => { const t = document.querySelector('.toc'); const rc = t.getBoundingClientRect(); const links = [...t.querySelectorAll('a')]; const cut = links.filter(a => a.getBoundingClientRect().bottom > innerHeight + 1).map(a => a.textContent.trim()); return { pos: getComputedStyle(t).position, top: Math.round(rc.top), bottom: Math.round(rc.bottom), tocH: Math.round(rc.height), vh: innerHeight, cut }; });
    // keyboard: focus the last contents link while mid-page
    const f = await p.evaluate(() => { const links = document.querySelectorAll('.toc a'); const a = links[links.length - 1]; a.focus(); const rc = a.getBoundingClientRect(); return { top: Math.round(rc.top), bottom: Math.round(rc.bottom), visible: rc.top >= 0 && rc.bottom <= innerHeight, y: Math.round(scrollY) }; });
    console.log(path, w + 'x' + h, JSON.stringify(r), '| last link focused:', JSON.stringify(f));
    await p.close(); }
  await b.close(); })();
