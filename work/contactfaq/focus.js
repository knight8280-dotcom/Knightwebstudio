// node focus.js URL OUTPREFIX [width] [theme] : tabs through main and screenshots each focus stop (clipped around the element)
const { chromium } = require('playwright');
(async () => {
  const [url, out, w = '1280', theme = 'light'] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: 800 }, colorScheme: theme });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForTimeout(500);
  const order = [];
  let i = 0, shots = 0;
  for (let k = 0; k < 80; k++) {
    await p.keyboard.press('Tab');
    const info = await p.evaluate(() => {
      const e = document.activeElement; if (!e || e === document.body) return null;
      const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      const vis = e.matches('.chip input') ? getComputedStyle(e.nextElementSibling) : cs;
      return { tag: e.tagName.toLowerCase(), cls: (e.className || '').toString().slice(0, 30), id: e.id, text: (e.textContent || e.value || '').trim().slice(0, 30), inMain: !!e.closest('main'), inFooter: !!e.closest('footer'),
        outline: vis.outlineStyle + ' ' + vis.outlineWidth + ' ' + vis.outlineColor, x: r.x, y: r.y, w: r.width, h: r.height };
    });
    if (!info) break;
    order.push(`${info.inMain ? 'MAIN ' : info.inFooter ? 'foot ' : 'head '}${info.tag}${info.id ? '#' + info.id : ''}.${info.cls} "${info.text}" outline=${info.outline}`);
    if (info.inMain && shots < 30) {
      await p.waitForTimeout(350);
      const r = await p.evaluate(() => { const e = document.activeElement; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
      const clip = { x: Math.max(0, r.x - 30), y: Math.max(0, r.y - 30), width: Math.min(r.w + 60, +w - Math.max(0, r.x - 30)), height: Math.min(r.h + 60, 800 - Math.max(0, r.y - 30)) };
      if (clip.height > 5 && clip.width > 5) await p.screenshot({ path: `${out}-${String(++shots).padStart(2, '0')}.png`, clip });
    }
    if (info.inFooter) { i++; if (i > 2) break; }
  }
  console.log(order.join('\n'));
  await b.close();
})();
