/* Keyboard pass: tab through <main> on each page, list every stop with its focus ring, and screenshot a few. */
const { chromium } = require('playwright');
const out = process.argv[2];
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const pages = [['/privacy/', 'privacy'], ['/terms/', 'terms'], ['/checkout/?plan=starter-deposit', 'checkout'], ['/checkout/success/?plan=starter-deposit', 'success']];
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) for (const [url, name] of pages) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + url); await p.waitForTimeout(700);
    const stops = []; let shot = 0;
    for (let i = 0; i < 80; i++) {
      await p.keyboard.press('Tab');
      const s = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
        return { inMain: !!e.closest('main'), inFooter: !!e.closest('footer'), text: (e.textContent || '').trim().slice(0, 30), tag: e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(' ')[0] : ''),
                 ring: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor, vis: r.top >= 0 && r.bottom <= innerHeight, h: Math.round(r.height) }; });
      if (!s) break; if (s.inFooter) break;
      if (s.inMain) { stops.push(s); if (shot < 3 && (/toc|btn/.test(s.tag) || s.tag === 'a')) { shot++; await p.screenshot({ path: `${out}/focus-${name}-${theme}-${shot}.png` }); } }
    }
    console.log(`\n${name} ${theme}: ${stops.length} stops in main`);
    for (const s of stops) console.log('  ' + (s.tag + ' "' + s.text + '"').padEnd(64) + s.ring + (s.vis ? '' : '  (off screen)'));
    await ctx.close();
  }
  await b.close();
})();
