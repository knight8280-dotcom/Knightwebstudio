// The screenshots that ship in kit/light/shots/ : each section at 390 and 1440 in both themes, several moments of the
// backgrounds and of the stack, script off, reduced motion, and the bare page.
const { chromium } = require('playwright');
const OUT = '/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/motion/kit/light/shots/';
const BASE = 'http://localhost:8730/kit/light/';
const ARGS = ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'];
const SECTIONS = [['1-first-screen-wash', 'body', 0], ['2-bookmark-cards', '#services .kws-marks', 110], ['3-folder-cards', '#process .kws-folders', 110], ['4-folder-stack', '#pricing .kws-folders', 110], ['5-other-brand', '.demo-brand', 90], ['6-closing-band', '.cta-band', 110]];
const open = async (b, { w, h, theme = 'light', page = 'demo.html', reduce = false, js = true, dsf = 1, touch = false, speed = 0 }) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: reduce ? 'reduce' : 'no-preference', javaScriptEnabled: js, deviceScaleFactor: dsf, hasTouch: touch });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); localStorage.setItem('bare-theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  if (speed) await ctx.route('**/' + page, async route => { const r = await route.fetch(); await route.fulfill({ response: r, body: (await r.text()).replace(/data-kws="shader"/g, 'data-kws="shader" data-shader-speed="' + speed + '"') }); });
  const p = await ctx.newPage(); await p.goto(BASE + page); await p.waitForTimeout(1500);
  return { ctx, p };
};
const go = async (p, sel, off) => { await p.evaluate(([s, o]) => { const r = document.querySelector(s).getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top - o, behavior: 'instant' }); }, [sel, off]); await p.waitForTimeout(1600); };
(async () => {
  const b = await chromium.launch({ args: ARGS });
  // 1. every section, both widths, both themes
  for (const theme of ['light', 'dark']) for (const [w, h, dsf] of [[1440, 900, 1], [390, 844, 2]]) {
    const { ctx, p } = await open(b, { w, h, theme, dsf });
    for (const [name, sel, off] of SECTIONS) { await go(p, sel, off); await p.screenshot({ path: `${OUT}${name}-${w}-${theme}.png` }); }
    await ctx.close();
  }
  // 2. the backgrounds at three moments (shader time run 20x faster, so the frames are about 40 seconds apart)
  for (const theme of ['light', 'dark']) {
    const { ctx, p } = await open(b, { w: 1440, h: 900, theme, speed: 20 });
    for (const [name, sel, off] of [SECTIONS[0], SECTIONS[1], SECTIONS[5]]) {
      await go(p, sel, off);
      for (let i = 0; i < 3; i++) { await p.screenshot({ path: `${OUT}motion-${name}-${theme}-t${i}.png` }); await p.waitForTimeout(2000); }
    }
    await ctx.close();
  }
  // 3. the stack: before, 120ms into the change, settled; keyboard focus on a tab; a card under the pointer and with focus
  {
    const { ctx, p } = await open(b, { w: 390, h: 844, theme: 'light', dsf: 2, touch: true });
    await go(p, '#pricing .kws-folders', 96);
    const clip = await p.evaluate(() => { const r = document.querySelector('#pricing .kws-folders').getBoundingClientRect(); return { x: 0, y: Math.max(0, r.top - 16), width: innerWidth, height: Math.min(innerHeight - Math.max(0, r.top - 16), r.height + 32) }; });
    await p.screenshot({ path: OUT + 'stack-390-a-before.png', clip });
    await p.tap('#pricing [role=tab]:nth-child(3)'); await p.waitForTimeout(110);
    await p.screenshot({ path: OUT + 'stack-390-b-changing.png', clip });
    await p.waitForTimeout(600);
    await p.screenshot({ path: OUT + 'stack-390-c-settled.png', clip });
    await ctx.close();
  }
  {
    const { ctx, p } = await open(b, { w: 1440, h: 900, theme: 'light' });
    await go(p, '#pricing .kws-folders', 120);
    await p.focus('#pricing [role=tab][aria-selected=true]'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(600);
    await p.screenshot({ path: OUT + 'stack-1440-keyboard-focus.png' });
    await go(p, '#services .kws-marks', 140);
    await p.hover('#services .kws-mark:nth-child(2)'); await p.waitForTimeout(500);
    await p.screenshot({ path: OUT + 'cards-1440-hover.png' });
    await p.mouse.move(5, 5);
    await p.focus('#services .kws-mark:nth-child(3) h3 a'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(400);
    await p.screenshot({ path: OUT + 'cards-1440-keyboard-focus.png' });
    // paused: the button in the footer
    await go(p, '.site-footer', 300);
    await p.evaluate(() => document.querySelector('.footer-links .kws-motion').click()); await p.waitForTimeout(400);
    await p.screenshot({ path: OUT + 'pause-button-1440-paused.png' });
    await ctx.close();
  }
  // 4. script off; reduced motion; the bare page with another brand
  { const { ctx, p } = await open(b, { w: 390, h: 844, js: false }); await p.screenshot({ path: OUT + 'script-off-390-full.png', fullPage: true }); await ctx.close(); }
  { const { ctx, p } = await open(b, { w: 1440, h: 900, js: false }); for (const [name, sel, off] of [SECTIONS[1], SECTIONS[3], SECTIONS[5]]) { await p.evaluate(([s, o]) => { const r = document.querySelector(s).getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top - o, behavior: 'instant' }); }, [sel, off]); await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}script-off-1440-${name}.png` }); } await ctx.close(); }
  { const { ctx, p } = await open(b, { w: 1440, h: 900, reduce: true }); await go(p, '#services .kws-marks', 110); await p.screenshot({ path: OUT + 'reduced-motion-1440-cards.png' }); await go(p, '.cta-band', 110); await p.screenshot({ path: OUT + 'reduced-motion-1440-band.png' }); await ctx.close(); }
  for (const theme of ['dark', 'light']) for (const [w, h] of [[1440, 900], [390, 844]]) {
    const { ctx, p } = await open(b, { w, h, theme, page: 'portable.html' });
    for (let y = 0, i = 0; i < (w > 400 ? 3 : 5); i++, y += h - 80) { await p.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y); await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}bare-page-${w}-${theme}-${i}.png` }); }
    await ctx.close();
  }
  await b.close(); console.log('shots done');
})();
