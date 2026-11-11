// Page-specific checks for /services/: tab order + focus rings, rows opening, anchors, no-JS, hover.
const { chromium } = require('playwright');
const URL = 'http://localhost:8720/services/';
(async () => {
  const b = await chromium.launch();
  const block = async ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());

  // 1. keyboard at 1440, 820 and 390
  for (const [w, h] of [[1440, 900], [820, 1100], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(500);
    const stops = [];
    for (let i = 0; i < 70; i++) {
      await p.keyboard.press('Tab');
      const s = await p.evaluate(() => {
        const el = document.activeElement; if (!el || el === document.body) return null;
        const cs = getComputedStyle(el); const rc = el.getBoundingClientRect();
        const bar = document.getElementById('mobile-cta'); const bcs = bar && getComputedStyle(bar); const br = bar && bcs.visibility !== 'hidden' && bcs.display !== 'none' ? bar.getBoundingClientRect() : null;
        const hd = document.getElementById('site-header').getBoundingClientRect();
        return { tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().split(' ')[0], text: (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 44),
          outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor, inMain: !!el.closest('main'), y: Math.round(rc.top), bottom: Math.round(rc.bottom), vh: innerHeight,
          underBar: br ? rc.bottom > br.top + 1 && !el.closest('#mobile-cta') : false, underHeader: !el.closest('header, .topbar, .skip-link') && rc.top < hd.bottom - 1 && hd.top <= 0, footer: !!el.closest('footer') };
      });
      if (!s) break; stops.push(s); if (s.footer) break;
    }
    console.log(`\n== tab order at ${w}px: ${stops.length} stops`);
    for (const s of stops.filter(s => s.inMain)) console.log(`  ${s.tag}.${s.cls}`.padEnd(26) + ` "${s.text}"`.padEnd(50) + ` ${s.outline}` + (s.underBar ? '  <-- UNDER PHONE BAR' : '') + (s.underHeader ? '  <-- UNDER HEADER' : '') + ((s.y < 0 || s.bottom > s.vh) ? '  <-- off screen' : ''));
    const noRing = stops.filter(s => !/solid 3px/.test(s.outline)); console.log('  stops without a 3px ring: ' + noRing.length + (noRing.length ? ' ' + JSON.stringify(noRing.map(s => s.text)) : ''));
    await ctx.close();
  }

  // 2. focus ring pictures, and a row opened from the keyboard
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(400);
    await p.evaluate(() => document.querySelector('.menu').scrollIntoView({ block: 'center' }));
    await p.focus('.menu a[href="#care"]'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(200);
    await (await p.$('.menu')).screenshot({ path: 'focus-menu-row.png' });
    await p.evaluate(() => document.querySelector('#brand summary').scrollIntoView({ block: 'center' }));
    await p.focus('#brand summary'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    console.log('\nkeyboard Enter opens #brand: ' + await p.evaluate(() => document.querySelector('#brand').open));
    await (await p.$('#build')).screenshot({ path: 'focus-summary-open-1440.png' });
    // hover states
    await p.hover('#seo summary'); await p.waitForTimeout(350);
    console.log('hover on a row turns its name ' + await p.evaluate(() => getComputedStyle(document.querySelector('#seo .pl-name')).color) + ' (blue is rgb(44, 70, 196))');
    await p.evaluate(() => document.querySelector('.menu').scrollIntoView({ block: 'center' }));
    await p.hover('.menu a[href="#brand"]'); await p.waitForTimeout(350);
    await (await p.$('.menu')).screenshot({ path: 'hover-menu-row.png' });
    await ctx.close();
  }

  // 3. all rows open, phone and desktop, both themes
  for (const [w, h, theme] of [[390, 844, 'light'], [390, 844, 'dark'], [1440, 900, 'light'], [1440, 900, 'dark']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme, isMobile: w < 700, hasTouch: w < 700, reducedMotion: 'reduce' }); await block(ctx);
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(400);
    await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true)); await p.waitForTimeout(200);
    await (await p.$('#build')).screenshot({ path: `open-build-${w}-${theme}.png` });
    await (await p.$('#win')).screenshot({ path: `open-win-${w}-${theme}.png` });
    console.log(`open rows ${w} ${theme}: page height ${await p.evaluate(() => document.documentElement.scrollHeight)}, overflow ${await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)}`);
    await ctx.close();
  }

  // 4. anchors: every menu link lands with its target just under the header
  for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 700 ? 844 : 900 }, isMobile: w < 700, hasTouch: w < 700, reducedMotion: 'reduce' }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(400);
    const hrefs = await p.$$eval('.menu a', as => as.map(a => a.getAttribute('href')));
    for (const hsh of hrefs) {
      await p.goto(URL + hsh); await p.waitForTimeout(250);
      const r = await p.evaluate(h => { const t = document.querySelector(h); const hd = document.getElementById('site-header').getBoundingClientRect(); const rc = t.getBoundingClientRect(); return { top: Math.round(rc.top), header: Math.round(hd.bottom), tag: t.tagName.toLowerCase(), max: document.documentElement.scrollHeight - innerHeight - scrollY }; }, hsh);
      console.log(`${w} anchor ${hsh.padEnd(20)} target <${r.tag}> top ${r.top}px, header bottom ${r.header}px ${r.top >= r.header && r.top < 500 ? 'ok' : '<-- CHECK'}`);
    }
    // a click in the menu moves there
    await p.goto(URL); await p.waitForTimeout(300);
    await p.click('.menu a[href="#growth-consulting"]'); await p.waitForTimeout(500);
    console.log(`${w} click on a menu row: hash ${await p.evaluate(() => location.hash)}, target top ${await p.evaluate(() => Math.round(document.querySelector('#growth-consulting').getBoundingClientRect().top))}`);
    if (w === 390) await p.screenshot({ path: 'target-390.png' });
    await ctx.close();
  }

  // 5. no JavaScript
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false, isMobile: w < 700, hasTouch: w < 700 }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(400);
    // no evaluate without JS: use locators
    const details = await p.locator('details').count();
    await p.locator('#brand summary').click(); await p.waitForTimeout(200);
    const open = await p.locator('#brand[open]').count();
    const vis = await p.locator('#brand .faq-body').isVisible();
    console.log(`no-JS ${w}: ${details} rows; a closed row opens on click without scripts: ${open === 1 && vis}; lead visible: ${await p.locator('#website-design').isVisible()}; care visible: ${await p.locator('#care .ticks').isVisible()}`);
    await p.screenshot({ path: `nojs-${w}.png`, fullPage: true });
    await ctx.close();
  }
  await b.close();
})();
