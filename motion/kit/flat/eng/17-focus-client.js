const { chromium, URL, settle, scrollToSel } = require('./lib');
(async () => {
  const b = await chromium.launch();
  for (const [url, name] of [[URL, 'demo-client'], ['http://localhost:8730/kit/flat/test/bare.html', 'bare']]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const p = await ctx.newPage(); const errs = []; p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message)); p.on('requestfailed', r => errs.push('REQFAIL ' + r.url()));
    await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(500);
    const sel = name === 'bare' ? '.kws-arc' : '.demo-client .kws-arc';
    const r = await p.evaluate(s => { const el = document.querySelector(s); const a = el.querySelector('li.is-on a'); a.focus(); const cs = getComputedStyle(a); const bg = (() => { for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (c !== 'rgba(0, 0, 0, 0)') return c; } })(); const d = el.querySelector('[aria-current=true]'); return { linkOutline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} offset ${cs.outlineOffset}`, sectionBg: bg, linkBg: cs.backgroundColor, hasSiteCss: !!getComputedStyle(document.documentElement).getPropertyValue('--ink').trim(), sx: document.documentElement.scrollWidth - innerWidth, live: document.querySelectorAll('.is-live').length }; }, sel);
    await p.keyboard.press('Tab'); await p.keyboard.press('Shift+Tab'); // make focus-visible via keyboard
    await p.waitForTimeout(700); await scrollToSel(p, sel, 60); await p.waitForTimeout(200); await p.screenshot({ path: `focus-${name}-link.png` });
    await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(300); await p.screenshot({ path: `focus-${name}-dot.png` });
    console.log(name, JSON.stringify(r), 'errors:', errs.join(';') || 'none');
    await ctx.close();
  }
  await b.close();
})();
