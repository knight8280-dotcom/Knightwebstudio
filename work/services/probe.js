// Page-specific checks for /services/: tab order + focus rings, opened rows, anchors, no-JS.
const { chromium } = require('playwright');
const URL = 'http://localhost:8720/services/';
(async () => {
  const b = await chromium.launch();
  const block = async ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());

  // 1. keyboard at 1440 and 390
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(500);
    const stops = [];
    for (let i = 0; i < 60; i++) {
      await p.keyboard.press('Tab');
      const s = await p.evaluate(() => {
        const el = document.activeElement; if (!el || el === document.body) return null;
        const cs = getComputedStyle(el); const rc = el.getBoundingClientRect();
        const bar = document.getElementById('mobile-cta'); const br = bar && getComputedStyle(bar).visibility !== 'hidden' && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect() : null;
        return { tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().split(' ')[0], text: (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 44),
          outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor, inMain: !!el.closest('main'), y: Math.round(rc.top), bottom: Math.round(rc.bottom), vh: innerHeight,
          underBar: br ? rc.bottom > br.top + 1 && !el.closest('#mobile-cta') : false, footer: !!el.closest('footer') };
      });
      if (!s) break; stops.push(s); if (s.footer) break;
    }
    console.log(`\n== tab order at ${w}px: ${stops.length} stops`);
    for (const s of stops) console.log(`  ${s.inMain ? 'main' : '    '} ${s.tag}.${s.cls}`.padEnd(30) + ` "${s.text}"`.padEnd(50) + ` ${s.outline}` + (s.underBar ? '  <-- UNDER PHONE BAR' : '') + ((s.y < 0 || s.bottom > s.vh) ? '  <-- off screen' : ''));
    const noRing = stops.filter(s => !/solid 3px/.test(s.outline)); console.log('  stops without a 3px ring: ' + noRing.length);
    await ctx.close();
  }

  // 2. focus ring pictures
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(400);
    await p.focus('.menu a[href="#care"]'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab');
    await p.screenshot({ path: 'focus-menu-row.png', clip: { x: 80, y: 600, width: 1280, height: 300 } }).catch(() => {});
    await p.evaluate(() => document.querySelector('#brand summary').scrollIntoView({ block: 'center' }));
    await p.focus('#brand summary'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    await p.screenshot({ path: 'focus-summary-open-1440.png' });
    await ctx.close();
  }

  // 3. all rows open, phone and desktop, both themes
  for (const [w, h, theme] of [[390, 844, 'light'], [390, 844, 'dark'], [1440, 900, 'light']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme, isMobile: w < 700, hasTouch: w < 700, reducedMotion: 'reduce' }); await block(ctx);
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(400);
    await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true)); await p.waitForTimeout(200);
    const el = await p.$('#build'); await el.screenshot({ path: `open-build-${w}-${theme}.png` });
    const el2 = await p.$('#win'); await el2.screenshot({ path: `open-win-${w}-${theme}.png` });
    console.log(`open rows ${w} ${theme}: page height ${await p.evaluate(() => document.documentElement.scrollHeight)}, overflow ${await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)}`);
    await ctx.close();
  }

  // 4. anchors: every menu link lands with its target just under the header
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(400);
    const hrefs = await p.$$eval('.menu a', as => as.map(a => a.getAttribute('href')));
    for (const hsh of hrefs) {
      await p.goto(URL + hsh); await p.waitForTimeout(250);
      const r = await p.evaluate(h => { const t = document.querySelector(h); const hd = document.getElementById('site-header').getBoundingClientRect(); const rc = t.getBoundingClientRect(); return { top: Math.round(rc.top), header: Math.round(hd.bottom), tag: t.tagName.toLowerCase() }; }, hsh);
      console.log(`anchor ${hsh.padEnd(20)} target <${r.tag}> top ${r.top}px, header bottom ${r.header}px ${r.top >= r.header && r.top < 400 ? 'ok' : '<-- CHECK'}`);
    }
    await p.goto(URL + '#services'); await p.waitForTimeout(200);
    await ctx.close();
  }

  // 5. no JavaScript
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false, isMobile: w < 700, hasTouch: w < 700 }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(400);
    const r = await p.evaluate(() => {
      const hidden = [...document.querySelectorAll('main *')].filter(el => { const cs = getComputedStyle(el); return (cs.opacity === '0' || cs.visibility === 'hidden') && el.getBoundingClientRect().height > 0 && !el.closest('.sr-only'); }).map(el => el.tagName + '.' + el.className).slice(0, 8);
      return { hidden, details: document.querySelectorAll('details').length, height: document.documentElement.scrollHeight };
    });
    console.log(`no-JS ${w}: invisible elements in main: ${JSON.stringify(r.hidden)}, details ${r.details}, height ${r.height}`);
    await p.click('#ecommerce summary'); await p.waitForTimeout(200);
    console.log(`no-JS ${w}: a row opens on click without scripts: ${await p.evaluate(() => document.querySelector('#ecommerce').open)}`);
    await p.screenshot({ path: `nojs-${w}.png`, fullPage: true });
    await ctx.close();
  }
  await b.close();
})();
