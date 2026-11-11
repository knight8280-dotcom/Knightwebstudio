// node states.js <out-prefix> <url-path> <theme>  : rest / hover / pressed / focus crops of each pressable thing, as one sheet per state
const { chromium } = require('playwright');
const [out, path, theme] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8730' + path, { waitUntil: 'networkidle' });
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelectorAll('.reveal').forEach(e => e.classList.add('visible')); });
  await p.addStyleTag({ content: '.topbar,.site-header,.demo-bar,#mobile-cta{display:none!important}' });
  const items = [['band-main', '.kws-close .kws-btn--main'], ['band-plain', '.kws-close-acts .kws-btn:not(.kws-btn--main)'], ['band-tel', '.kws-close-tel a'], ['foot-tel', 'footer .kws-foot-tel'], ['foot-mail', 'footer .kws-foot-mail'], ['foot-btn', 'footer .kws-btn'], ['foot-link', 'footer nav:not(.kws-foot-call) li a'], ['foot-pause', 'footer .kws-motion']];
  const res = {};
  for (const [name, sel] of items) {
    const el = p.locator(sel).first();
    if (!(await el.count())) continue;
    await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(150);
    const bb = await el.boundingBox(); const clip = { x: Math.max(0, bb.x - 24), y: Math.max(0, bb.y - 16), width: bb.width + 48, height: bb.height + 32 };
    const cs = () => el.evaluate(e => { const c = getComputedStyle(e); return [c.backgroundColor, c.transform, c.textDecorationLine + ' ' + c.textDecorationColor + ' ' + c.textDecorationThickness + ' ' + c.textUnderlineOffset, c.outlineStyle + ' ' + c.outlineWidth + ' ' + c.outlineColor].join(' | '); });
    await p.mouse.move(5, 5); await p.waitForTimeout(250);
    await p.screenshot({ path: `${out}-${name}-0rest.png`, clip }); res[name] = { rest: await cs() };
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(300);
    await p.screenshot({ path: `${out}-${name}-1hover.png`, clip }); res[name].hover = await cs();
    await p.mouse.down(); await p.waitForTimeout(300);
    await p.screenshot({ path: `${out}-${name}-2press.png`, clip }); res[name].press = await cs();
    await p.mouse.move(5, 5); await p.mouse.up(); await p.waitForTimeout(100);
    await el.focus(); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(250);
    await p.screenshot({ path: `${out}-${name}-3focus.png`, clip }); res[name].focus = await cs();
    await p.evaluate(() => document.activeElement && document.activeElement.blur());
  }
  console.log(JSON.stringify(res, null, 1));
  await b.close();
})();
