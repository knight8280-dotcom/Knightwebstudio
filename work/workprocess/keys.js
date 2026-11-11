const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const [path, w, h] of [['/work/', 1440, 900], ['/process/', 1440, 900], ['/work/', 390, 844], ['/process/', 390, 844]]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, colorScheme: 'light' }); const p = await c.newPage();
    await c.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
    await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(500);
    const seen = []; let shots = 0;
    for (let i = 0; i < 60; i++) { await p.keyboard.press('Tab');
      const info = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
        return { tag: e.tagName, cls: e.className.toString().slice(0, 30), text: (e.innerText || e.getAttribute('aria-label') || e.querySelector('img')?.alt || '').trim().slice(0, 40), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor, inMain: !!e.closest('main'), y: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width) }; });
      if (!info) break; seen.push(info);
      if (info.inMain && shots < 4 && (info.cls.includes('browser') || info.text.includes('what it costs') || info.text.includes('smilys') || info.text.includes('Book a free'))) { await p.waitForTimeout(350); await p.screenshot({ path: `${process.argv[2]}/focus-${path.replace(/\//g, '')}-${w}-${shots++}.png` }); }
      if (info.cls.includes('footer') || info.text.includes('Back to top')) break; }
    console.log(path, w); for (const s of seen.filter(s => s.inMain)) console.log('  ', s.tag, '|', s.cls, '|', s.text, '|', s.outline, '|', s.w + 'x' + s.h);
    console.log('   order (all):', seen.map(s => s.text || s.cls).join(' > ').slice(0, 600));
    await c.close(); }
  await b.close(); })();
