const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [path, id] of [['/work/', 'work'], ['/process/', 'process']]) for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path + '#' + id, { waitUntil: 'load' }); await p.waitForTimeout(900);
    const r = await p.evaluate((id) => { const t = document.getElementById(id); const first = t.querySelector('.browser, .ticket'); const hdr = document.getElementById('site-header').getBoundingClientRect(); return { scrollY: Math.round(scrollY), sectionTop: Math.round(t.getBoundingClientRect().top), firstObjTop: Math.round(first.getBoundingClientRect().top), headerBottom: Math.round(hdr.bottom) }; }, id);
    console.log(path + '#' + id, w, JSON.stringify(r), r.firstObjTop >= r.headerBottom ? 'ok' : 'CONTENT UNDER HEADER');
    // skip link
    await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.keyboard.press('Tab'); await p.waitForTimeout(200);
    const sk = await p.evaluate(() => { const a = document.activeElement; const rc = a.getBoundingClientRect(); return { cls: a.className, visible: rc.top >= 0 && rc.height > 20, txt: a.textContent.trim() }; });
    await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    const after = await p.evaluate(() => ({ hash: location.hash, active: document.activeElement.id || document.activeElement.tagName }));
    console.log('   skip link:', JSON.stringify(sk), '->', JSON.stringify(after));
    await ctx.close();
  }
  await b.close();
})();
