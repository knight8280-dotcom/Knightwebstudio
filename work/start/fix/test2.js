// Checks specific to /start/: no-script rendering, keyboard order and focus rings, phone bar, booking links, reveals.
const { chromium } = require('playwright');
const URL = 'http://localhost:8720/start/';
const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
let bad = 0; const ok = (c, m) => { console.log((c ? 'PASS  ' : 'FAIL  ') + m); if (!c) bad++; };
(async () => {
  const b = await chromium.launch();

  // 1. JavaScript off
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
      const hidden = [];
      for (const el of document.querySelectorAll('main *')) {
        const cs = getComputedStyle(el); const rc = el.getBoundingClientRect();
        if (el.closest('svg, .sr-only, [aria-hidden="true"]')) continue;
        if ((cs.opacity === '0' || cs.visibility === 'hidden') && rc.width > 0) hidden.push(el.tagName + '.' + el.className);
      }
      const toggle = document.getElementById('theme-toggle');
      return { hidden, toggle: toggle ? getComputedStyle(toggle).display : 'none', bar: document.getElementById('mobile-cta') ? document.getElementById('mobile-cta').hidden : null,
               overflow: document.documentElement.scrollWidth - innerWidth, h: document.documentElement.scrollHeight,
               book: [...document.querySelectorAll('[data-booking]')].map(a => a.getAttribute('href')) };
    });
    ok(r.hidden.length === 0, `no script ${w}: nothing in main is invisible ${r.hidden.slice(0, 4).join(', ')}`);
    ok(r.toggle === 'none', `no script ${w}: the theme button is hidden`);
    ok(r.overflow <= 0, `no script ${w}: no sideways scroll`);
    ok(r.book.every(h => h === '/contact/'), `no script ${w}: booking buttons go to /contact/`);
    await p.screenshot({ path: `${__dirname}/nojs-${w}.png`, fullPage: true });
    await ctx.close();
  }

  // 2. Keyboard order and focus rings, phone and desktop
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(600);
    const stops = [];
    for (let i = 0; i < 60; i++) {
      await p.keyboard.press('Tab');
      const s = await p.evaluate(() => {
        const el = document.activeElement; if (!el || el === document.body) return null;
        const cs = getComputedStyle(el); const rc = el.getBoundingClientRect();
        // the ring may be drawn on a sibling span (chips) - not used on this page
        const bar = document.querySelector('.mobile-cta.show'); const barTop = bar ? bar.getBoundingClientRect().top : Infinity;
        return { t: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40), tag: el.tagName, ring: parseFloat(cs.outlineWidth) >= 2 && cs.outlineStyle !== 'none', color: cs.outlineColor,
                 inView: rc.top >= 0 && rc.bottom <= innerHeight, underBar: !el.closest('.mobile-cta') && rc.bottom > barTop + 1, y: Math.round(rc.top + scrollY) };
      });
      if (!s) break; if (stops.length && s.t === stops[0].t && s.y === stops[0].y) break; stops.push(s);
    }
    console.log(`  ${w}px tab order: ` + stops.map(s => s.t || s.tag).join(' > '));
    ok(stops.length > 10, `keyboard ${w}: ${stops.length} tab stops`);
    ok(stops.every(s => s.ring), `keyboard ${w}: every stop shows a focus ring ` + stops.filter(s => !s.ring).map(s => s.t).join(', '));
    ok(stops.every(s => !s.underBar), `keyboard ${w}: no stop lands under the phone bar ` + stops.filter(s => s.underBar).map(s => s.t).join(', '));
    const ys = stops.filter(s => s.tag !== 'BUTTON').map(s => s.y);
    await ctx.close();
  }

  // 3. Phone bar, booking links, reveals
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(600);
    const shown = () => p.evaluate(() => document.getElementById('mobile-cta').classList.contains('show'));
    ok(!(await shown()), 'phone bar: hidden on the first screen');
    await p.evaluate(() => scrollTo(0, 1200)); await p.waitForTimeout(500);
    ok(await shown(), 'phone bar: shown in the menu');
    await p.evaluate(() => { const s = document.getElementById('contact'); scrollTo(0, s.getBoundingClientRect().top + scrollY - 200); }); await p.waitForTimeout(500);
    ok(!(await shown()), 'phone bar: steps aside when the closing band is on screen');
    const book = await p.evaluate(() => [...document.querySelectorAll('[data-booking]')].map(a => a.href + ' ' + a.target + ' ' + a.rel));
    ok(book.length === 4 && book.every(x => x.startsWith('https://calendly.com/knightwebstudio1/30min _blank noopener')), `booking: ${book.length} buttons point at the calendar in a new tab`);
    const tels = await p.evaluate(() => [...document.querySelectorAll('main a[href^="tel:"]')].map(a => a.getAttribute('href') + '|' + a.textContent.trim()));
    ok(tels.length === 2 && tels.every(t => t === 'tel:+12252550837|Call (225) 255-0837'), 'call buttons: ' + tels.join(' ; '));
    // reveals: scroll through, everything ends visible
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 500) { await p.evaluate(v => scrollTo(0, v), y); await p.waitForTimeout(120); }
    await p.waitForTimeout(700);
    const stuck = await p.evaluate(() => [...document.querySelectorAll('.reveal')].filter(e => getComputedStyle(e).opacity !== '1').length);
    ok(stuck === 0, 'reveal: every block is visible after scrolling through');
    const first = await p.evaluate(() => [...document.querySelectorAll('.reveal')].map(e => Math.round(e.getBoundingClientRect().top + scrollY))[0]);
    ok(first > 844, `reveal: the first reveal block starts below the first phone screen (${first}px)`);
    await ctx.close();
  }
  // first-screen facts at common phone sizes
  for (const [w, h] of [[390, 664], [360, 640], [393, 660], [412, 700], [430, 740], [375, 548]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(400);
    const r = await p.evaluate(() => { const y = s => Math.round(document.querySelector(s).getBoundingClientRect().bottom); return { h1: y('h1'), book: y('.btn-row .btn-primary'), call: y('.btn-row .btn + .btn'), strip: y('.price-strip') }; });
    console.log(`  first screen ${w}x${h}: h1 ends ${r.h1}, book ${r.book}, call ${r.call}, price strip ${r.strip}`);
    ok(r.call <= h, `first screen ${w}x${h}: the call button is on it`);
    if (h > 600) ok(r.strip <= h, `first screen ${w}x${h}: all four prices and the link to the board are on it (${r.strip})`);
    await ctx.close();
  }
  // desktop: reveal not in first screen at 1920x1080, price strip visible at 1280x800
  for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(400);
    const r = await p.evaluate(() => ({ strip: Math.round(document.querySelector('.price-strip').getBoundingClientRect().bottom), first: Math.round(document.querySelector('.reveal').getBoundingClientRect().top) }));
    ok(r.strip <= h, `desktop ${w}x${h}: the price strip is on the first screen (${r.strip})`);
    ok(r.first >= h, `desktop ${w}x${h}: no reveal block starts on the first screen (${r.first})`);
    await ctx.close();
  }
  await b.close(); console.log(bad ? `\n${bad} problem(s)` : '\nall /start/ checks passed'); process.exit(bad ? 1 : 0);
})();
