// JS-off rendering and keyboard walk for the four city pages.
const { chromium } = require('playwright');
const fs = require('fs');
const towns = ['baton-rouge', 'denham-springs', 'gonzales', 'prairieville'];
(async () => {
  const b = await chromium.launch();
  fs.mkdirSync('nojs', { recursive: true });
  // 1. JavaScript off: everything in main is visible (opacity 1, not display:none except .wide-only on phones), details open on click not needed
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false, colorScheme: 'light' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage();
    for (const t of towns) {
      await p.goto(`http://localhost:8720/web-design-${t}/`, { waitUntil: 'load' });
      await p.waitForTimeout(300);
      await p.screenshot({ path: `nojs/${t}-${w}.png`, fullPage: true });
    }
    await ctx.close();
  }
  // evaluate invisibles with JS disabled is not possible via page.evaluate? It is: evaluate works even when page JS is disabled.
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    const p = await ctx.newPage();
    for (const t of towns) {
      await p.goto(`http://localhost:8720/web-design-${t}/`, { waitUntil: 'load' });
      const r = await p.evaluate(() => {
        const bad = [];
        for (const el of document.querySelectorAll('main *')) {
          const cs = getComputedStyle(el);
          if (el.closest('svg') || el.closest('.sr-only')) continue;
          if (parseFloat(cs.opacity) < 1) bad.push('opacity ' + cs.opacity + ' ' + el.tagName + '.' + el.className);
          if (cs.display === 'none' && !el.closest('.wide-only') && !el.closest('details:not([open])')) bad.push('display:none ' + el.tagName + '.' + el.className + ' "' + el.textContent.trim().slice(0, 30) + '"');
          if (cs.visibility === 'hidden') bad.push('hidden ' + el.tagName + '.' + el.className);
        }
        return { htmlClass: document.documentElement.className, bad, details: document.querySelectorAll('main details').length };
      });
      console.log('nojs', t, JSON.stringify(r));
    }
    await ctx.close();
  }
  // 2. Keyboard: tab through main, record each stop, its focus ring and whether it is in view
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: 'light', reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage();
    for (const t of towns.slice(0, w === 1440 ? 4 : 1)) {
      await p.goto(`http://localhost:8720/web-design-${t}/`, { waitUntil: 'load' }); await p.waitForTimeout(300);
      const stops = [];
      for (let i = 0; i < 70; i++) {
        await p.keyboard.press('Tab');
        const s = await p.evaluate(() => {
          const el = document.activeElement; if (!el || el === document.body) return null;
          const cs = getComputedStyle(el); const rc = el.getBoundingClientRect();
          const where = el.closest('main') ? 'main' : el.closest('footer') ? 'footer' : el.closest('#mobile-cta') ? 'bar' : 'header';
          const bar = document.getElementById('mobile-cta'); const barTop = bar && getComputedStyle(bar).visibility !== 'hidden' && bar.classList.contains('show') ? bar.getBoundingClientRect().top : innerHeight;
          return { where, tag: el.tagName.toLowerCase(), text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor,
                   inView: rc.top >= 0 && rc.bottom <= barTop + 1, h: Math.round(rc.height), top: Math.round(rc.top), bottom: Math.round(rc.bottom), barTop: Math.round(barTop) };
        });
        if (!s) break; stops.push(s); if (s.where === 'footer') break;
      }
      const main = stops.filter(s => s.where === 'main');
      console.log(`\nkeyboard ${t} ${w}px: ${stops.length} stops, ${main.length} in main`);
      for (const s of main) console.log('  ', s.tag.padEnd(8), s.text.padEnd(42), s.outline.padEnd(34), s.inView ? 'in view' : `NOT IN VIEW top ${s.top} bottom ${s.bottom} bar ${s.barTop}`);
      const noRing = main.filter(s => !/solid 3px/.test(s.outline)); if (noRing.length) console.log('   NO RING:', noRing.map(s => s.text));
    }
    await ctx.close();
  }
  // 3. FAQ opens with the keyboard; focus ring screenshot
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
    await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'dark'); } catch (e) {} });
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/web-design-gonzales/'); await p.waitForTimeout(300);
    await p.locator('summary').first().focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
    console.log('\nfaq open after Enter:', await p.evaluate(() => document.querySelector('details').open));
    await p.locator('#questions').screenshot({ path: 'nojs/faq-focus-dark.png' });
    await p.locator('.tier').first().focus(); await p.waitForTimeout(200);
    await p.locator('.board').screenshot({ path: 'nojs/board-focus-dark.png' });
    await ctx.close();
  }
  await b.close();
})();
