// node work/el.js <selector> <outfile> [width] [theme]   element screenshot from the gallery
const { chromium } = require('playwright');
(async () => { const [sel, out, w = '1440', theme = 'light'] = process.argv.slice(2);
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: +w, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  const p = await ctx.newPage(); await p.goto('http://localhost:8721/'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  await p.locator(sel).first().scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await p.locator(sel).first().screenshot({ path: out }); await b.close(); })();
