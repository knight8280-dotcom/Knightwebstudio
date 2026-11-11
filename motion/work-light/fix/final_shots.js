// The screenshots that ship in kit/light/shots/ after the fix pass.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const OUT = '/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/motion/kit/light/shots/';
const BASE = 'http://localhost:8730/kit/light/';
const ARGS = ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'];
const SECTIONS = [['1-first-screen-wash', 'body', 0], ['2-bookmark-cards', '#services .kws-marks', 110], ['3-folder-cards', '#process .kws-folders', 110], ['4-folder-stack', '#pricing .kws-folders', 110], ['5-other-brand', '.demo-brand', 90], ['6-closing-band', '.cta-band', 110]];
const open = async (b, { w, h, theme = 'light', page = 'demo.html', reduce = false, js = true, dsf = 1, touch = false, block = null, motion = '' }) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: reduce ? 'reduce' : 'no-preference', javaScriptEnabled: js, deviceScaleFactor: dsf, hasTouch: touch });
  await ctx.addInitScript(([t, m]) => { try { localStorage.setItem('theme', t); localStorage.setItem('bare-theme', t); if (m) localStorage.setItem('kws-motion', m); sessionStorage.setItem('kws-crest', '1'); } catch (e) {} }, [theme, motion]);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  if (block) await ctx.route(block, r => r.abort());
  const p = await ctx.newPage(); await p.goto(BASE + page); await p.waitForTimeout(1800);
  return { ctx, p };
};
const go = async (p, sel, off, wait = 1300) => { await p.evaluate(([s, o]) => { const r = document.querySelector(s).getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top - o, behavior: 'instant' }); }, [sel, off]); await p.waitForTimeout(wait); };
const fast = (p, sp) => p.evaluate(s => document.querySelectorAll('[data-kws="shader"]').forEach(el => { KWS.shader.mount(el)(); KWS.shader.mount(el, { speed: s }); }), sp);
(async () => {
  fs.mkdirSync(OUT, { recursive: true }); for (const f of fs.readdirSync(OUT)) fs.unlinkSync(OUT + f);
  const b = await chromium.launch({ args: ARGS });
  // 1. every section, phone and desktop, both themes
  for (const theme of ['light', 'dark']) for (const [w, h, dsf] of [[1440, 900, 1], [390, 844, 2]]) {
    const { ctx, p } = await open(b, { w, h, theme, dsf });
    for (const [name, sel, off] of SECTIONS) { await go(p, sel, off); await p.screenshot({ path: `${OUT}${name}-${w}-${theme}.png` }); }
    await ctx.close();
  }
  // 2. the backgrounds at three moments (shader time 20x faster: frames about 40 seconds apart)
  for (const theme of ['light', 'dark']) {
    const { ctx, p } = await open(b, { w: 1440, h: 900, theme }); await fast(p, 20); await p.waitForTimeout(700);
    for (const [name, sel, off] of [SECTIONS[0], SECTIONS[1], SECTIONS[5]]) {
      await go(p, sel, off);
      for (let i = 0; i < 3; i++) { await p.screenshot({ path: `${OUT}motion-${name}-${theme}-t${i}.png` }); await p.waitForTimeout(2000); }
    }
    await ctx.close();
  }
  // 3. the stack. Phone: before, 120ms into the change, settled. Tablet. Desktop: hover and keyboard focus on a tab
  for (const theme of ['light', 'dark']) {
    const { ctx, p } = await open(b, { w: 390, h: 844, theme, dsf: 2, touch: true });
    await go(p, '#pricing .kws-folders', 96);
    await p.screenshot({ path: `${OUT}stack-390-${theme}-a-before.png` });
    await p.tap('#pricing [role=tab]:nth-child(3)'); await p.waitForTimeout(110);
    await p.screenshot({ path: `${OUT}stack-390-${theme}-b-changing.png` });
    await p.waitForTimeout(600);
    await p.screenshot({ path: `${OUT}stack-390-${theme}-c-settled.png` });
    await ctx.close();
  }
  { const { ctx, p } = await open(b, { w: 360, h: 800, dsf: 2 }); await go(p, '#pricing .kws-folders', 96); await p.screenshot({ path: OUT + 'stack-360-light.png' }); await ctx.close(); }
  { const { ctx, p } = await open(b, { w: 820, h: 1000 }); await go(p, '#pricing .kws-folders', 110); await p.screenshot({ path: OUT + 'stack-820-light.png' }); await go(p, '#services .kws-marks', 110); await p.screenshot({ path: OUT + 'cards-820-light.png' }); await ctx.close(); }
  { const { ctx, p } = await open(b, { w: 1000, h: 800 }); await go(p, '#services .kws-marks', 110); await p.screenshot({ path: OUT + 'cards-1000-light.png' }); await go(p, '#pricing .kws-folders', 110); await p.screenshot({ path: OUT + 'stack-1000-light-narrow-column.png' }); await ctx.close(); }
  for (const theme of ['light', 'dark']) {
    const { ctx, p } = await open(b, { w: 1440, h: 900, theme });
    await go(p, '#pricing .kws-folders', 120);
    await p.hover('#pricing [role=tab]:nth-child(2)'); await p.waitForTimeout(400);
    await p.screenshot({ path: `${OUT}stack-1440-${theme}-tab-hover.png`, clip: { x: 560, y: 80, width: 840, height: 360 } });
    await p.mouse.move(5, 5);
    await p.focus('#pricing [role=tab][aria-selected=true]'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(600);
    await p.screenshot({ path: `${OUT}stack-1440-${theme}-keyboard-focus.png` });
    await go(p, '#services .kws-marks', 140);
    await p.hover('#services .kws-mark:nth-child(2)'); await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}cards-1440-${theme}-hover.png` });
    await p.mouse.move(5, 5);
    await p.focus('#services .kws-mark:nth-child(3) h3 a'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(400);
    await p.screenshot({ path: `${OUT}cards-1440-${theme}-keyboard-focus.png` });
    await go(p, '#process .kws-folders', 140);
    await p.focus('#process .kws-folder h3 a'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(400);
    await p.screenshot({ path: `${OUT}folders-1440-${theme}-keyboard-focus.png` });
    // the pause button: top strip, then pressed in the footer
    await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await p.waitForTimeout(300);
    await p.screenshot({ path: `${OUT}pause-1440-${theme}-top-strip.png`, clip: { x: 0, y: 0, width: 1440, height: 110 } });
    await go(p, '.site-footer', 300);
    await p.click('.footer-links .kws-motion'); await p.waitForTimeout(400);
    await p.screenshot({ path: `${OUT}pause-1440-${theme}-footer-paused.png` });
    await ctx.close();
  }
  { const { ctx, p } = await open(b, { w: 390, h: 844, dsf: 2 }); await p.click('#nav-toggle'); await p.waitForTimeout(900); await p.screenshot({ path: OUT + 'pause-390-menu.png' }); await ctx.close(); }
  // the band's glints close up, at device pixels 2
  for (const theme of ['light', 'dark']) { const { ctx, p } = await open(b, { w: 1440, h: 900, theme, dsf: 2 }); await go(p, '.cta-band', 110); await p.screenshot({ path: `${OUT}band-glints-1440-${theme}-2x-detail.png`, clip: { x: 380, y: 120, width: 720, height: 300 } }); await ctx.close(); }
  for (const theme of ['light', 'dark']) { const { ctx, p } = await open(b, { w: 390, h: 844, theme, dsf: 3 }); await go(p, '#services .kws-marks', 110); await p.screenshot({ path: `${OUT}ribbon-390-${theme}-3x-detail.png`, clip: { x: 0, y: 100, width: 390, height: 300 } }); await ctx.close(); }
  // 4. script off; cards.js blocked; reduced motion; paused at load
  { const { ctx, p } = await open(b, { w: 390, h: 844, js: false }); await p.screenshot({ path: OUT + 'script-off-390-full.png', fullPage: true }); await ctx.close(); }
  { const { ctx, p } = await open(b, { w: 1440, h: 900, js: false }); for (const [name, sel, off] of [SECTIONS[1], SECTIONS[3], SECTIONS[5]]) { await go(p, sel, off, 300); await p.screenshot({ path: `${OUT}script-off-1440-${name}.png` }); } await ctx.close(); }
  { const { ctx, p } = await open(b, { w: 390, h: 844, dsf: 2, block: '**/cards.js' }); await go(p, '#pricing .kws-folders', 96, 400); await p.screenshot({ path: OUT + 'cards-js-blocked-390.png' }); await ctx.close(); }
  { const { ctx, p } = await open(b, { w: 1440, h: 900, reduce: true }); await p.screenshot({ path: OUT + 'reduced-motion-1440-first-screen.png' }); await go(p, '#services .kws-marks', 110); await p.screenshot({ path: OUT + 'reduced-motion-1440-cards.png' }); await go(p, '.cta-band', 110); await p.screenshot({ path: OUT + 'reduced-motion-1440-band.png' }); await ctx.close(); }
  // 5. the bare page with a third brand, both themes
  for (const theme of ['dark', 'light']) for (const [w, h] of [[1440, 900], [390, 844]]) {
    const { ctx, p } = await open(b, { w, h, theme, page: 'portable.html?theme=' + theme, dsf: w < 500 ? 2 : 1 });
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0, i = 0; y < H - 60 && i < 9; i++, y += h - 80) { await p.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y); await p.waitForTimeout(1300); await p.screenshot({ path: `${OUT}bare-page-${w}-${theme}-${i}.png` }); }
    await ctx.close();
  }
  await b.close(); console.log('shots done', fs.readdirSync(OUT).length);
})();
