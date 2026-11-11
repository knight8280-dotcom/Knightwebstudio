#!/usr/bin/env node
/* Chrome states that the page screenshots do not show: node work/chrome_shots.js  (writes shots/pass2/chrome/) */
const { chromium } = require('playwright');
const fs = require('fs');
const out = __dirname + '/../shots/pass2/chrome'; fs.mkdirSync(out, { recursive: true });
const base = 'http://localhost:8720';
(async () => {
  const b = await chromium.launch();
  const open = async (w, h, theme, path, phone) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme, isMobile: !!phone, hasTouch: !!phone, reducedMotion: 'reduce' });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(base + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    return [ctx, p];
  };
  const shot = (p, name, clip) => p.screenshot({ path: `${out}/${name}.png`, clip });
  for (const theme of ['light', 'dark']) {
    // desktop header: at the top, and scrolled
    let [ctx, p] = await open(1440, 500, theme, '/pricing/');
    await shot(p, `header-1440-top-${theme}`, { x: 0, y: 0, width: 1440, height: 140 });
    await p.evaluate(() => scrollTo(0, 700)); await p.waitForTimeout(500);
    await shot(p, `header-1440-scrolled-${theme}`, { x: 0, y: 0, width: 1440, height: 140 });
    await ctx.close();
    [ctx, p] = await open(1280, 500, theme, '/start/');
    await shot(p, `start-header-1280-${theme}`, { x: 0, y: 0, width: 1280, height: 140 });
    await ctx.close();
    // footer and skyline on a page that ends on paper, and on one that ends in the band
    for (const [w, h, phone] of [[1440, 900, false], [390, 844, true]]) {
      for (const path of ['/contact/', '/pricing/', '/404.html']) {
        [ctx, p] = await open(w, h, theme, path, phone);
        await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(600);
        const top = await p.evaluate(() => document.querySelector('.site-footer').getBoundingClientRect().top);
        await p.evaluate(t => scrollBy(0, t - Math.min(420, innerHeight * .5)), top); await p.waitForTimeout(400);
        await shot(p, `footer-${w}${path.replace(/[\/.]/g, '_')}${theme}`);
        await ctx.close();
      }
    }
    // phone menu: short screen at the top, scrolled, and with its list scrolled; tablet
    [ctx, p] = await open(375, 667, theme, '/', true);
    await p.click('#nav-toggle'); await p.waitForTimeout(400); await shot(p, `menu-375x667-top-${theme}`);
    await p.evaluate(() => { document.querySelector('.nav-inner').scrollTop = 9999; }); await p.waitForTimeout(200); await shot(p, `menu-375x667-top-listend-${theme}`);
    await p.keyboard.press('Escape'); await p.evaluate(() => scrollTo(0, 900)); await p.waitForTimeout(400);
    await p.click('#nav-toggle'); await p.waitForTimeout(400); await shot(p, `menu-375x667-scrolled-${theme}`);
    await p.evaluate(() => { document.querySelector('.nav-inner').scrollTop = 9999; }); await p.waitForTimeout(200); await shot(p, `menu-375x667-scrolled-listend-${theme}`);
    await ctx.close();
    [ctx, p] = await open(390, 844, theme, '/pricing/', true);
    await p.click('#nav-toggle'); await p.waitForTimeout(400); await shot(p, `menu-390-${theme}`);
    await ctx.close();
    [ctx, p] = await open(820, 1100, theme, '/', true);
    await p.click('#nav-toggle'); await p.waitForTimeout(400); await shot(p, `menu-820-${theme}`);
    await ctx.close();
    [ctx, p] = await open(360, 740, theme, '/', true);
    await shot(p, `top-360-${theme}`, { x: 0, y: 0, width: 360, height: 200 });
    await ctx.close();
  }
  await b.close(); console.log('chrome shots in', out);
})();
