// A11Y-03: does focus landing on a sticky-header control move the page? Raw mouse/keyboard only (no locator.click, which scrolls by itself).
const { chromium, webkit, firefox } = require('playwright');
const BASE = 'http://localhost:8720';
const BLOCK = /plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com|web3forms\.com/;
async function run(engine, name) {
  let b; try { b = await engine.launch(); } catch (e) { console.log(name, 'not installed:', String(e).split('\n')[0]); return; }
  for (const [w, h, touch] of [[390, 844, true], [820, 1000, false], [1280, 800, false]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: touch });
    await ctx.route(BLOCK, r => r.abort());
    const p = await ctx.newPage();
    await p.goto(BASE + '/pricing/', { waitUntil: 'load' });
    const Y = () => p.evaluate(() => Math.round(scrollY));
    const reset = async () => { await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.activeElement && document.activeElement.blur(); window.scrollTo(0, 3000); }); await p.waitForTimeout(500); };
    const centre = sel => p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel);
    const out = [];
    if (w < 1100) {
      await reset(); const y0 = await Y();
      const [x, y] = await centre('#nav-toggle');
      if (touch) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y);
      await p.waitForTimeout(500); const y1 = await Y();
      const open = await p.evaluate(() => document.getElementById('nav').classList.contains('open'));
      await p.keyboard.press('Escape'); await p.waitForTimeout(700); const y2 = await Y();
      out.push(`menu: start ${y0}, opened(${open}) ${y1}, after Escape ${y2}`);
      // open and close with the button only (what a phone user does)
      await reset(); const a0 = await Y();
      if (touch) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await p.waitForTimeout(500);
      if (touch) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await p.waitForTimeout(700);
      out.push(`menu button twice: start ${a0}, after ${await Y()}`);
    }
    // click the theme toggle, then Shift+Tab
    await reset(); const t0 = await Y();
    const [tx, ty] = await centre('#theme-toggle');
    await p.mouse.click(tx, ty); await p.waitForTimeout(400); const t1 = await Y();
    await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(700); const t2 = await Y();
    const f2 = await p.evaluate(() => (document.activeElement.className || document.activeElement.tagName).toString().slice(0, 40));
    await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(700); const t3 = await Y();
    out.push(`theme toggle click ${t0} -> ${t1}; Shift+Tab -> ${t2} (focus: ${f2}); again -> ${t3}`);
    // Tab forward from mid-page content into... and back: focus a control in main mid-page then Shift+Tab until header
    await reset();
    await p.evaluate(() => { const els = [...document.querySelectorAll('main a, main button')].filter(e => { const r = e.getBoundingClientRect(); return r.top > 100 && r.top < innerHeight - 150; }); els[0] && els[0].focus({ preventScroll: true }); });
    const m0 = await Y();
    await p.keyboard.press('Tab'); await p.waitForTimeout(500); const m1 = await Y();
    out.push(`forward Tab inside main: ${m0} -> ${m1}`);
    // with scroll-padding removed
    await reset(); await p.addStyleTag({ content: 'html{scroll-padding:0 !important}' });
    await p.mouse.click(tx, ty); await p.waitForTimeout(300); await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(600);
    out.push(`control (scroll-padding 0): Shift+Tab -> ${await Y()}`);
    console.log(`${name} ${w}x${h}:`); out.forEach(l => console.log('   ' + l));
    await ctx.close();
  }
  await b.close();
}
(async () => { await run(chromium, 'chromium'); await run(webkit, 'webkit'); await run(firefox, 'firefox'); })();
