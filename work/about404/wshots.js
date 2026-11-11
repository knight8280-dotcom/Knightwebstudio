// node wshots.js PATH W1,W2,...  -> full-page screenshots at the given widths
const { chromium } = require('playwright');
(async () => {
  const [path, ws, theme] = process.argv.slice(2);
  const b = await chromium.launch();
  for (const w of ws.split(',').map(Number)) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce', colorScheme: theme === 'dark' ? 'dark' : 'light' });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme === 'dark' ? 'dark' : 'light');
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path); await p.waitForTimeout(500);
    await p.screenshot({ path: `${__dirname}/extra/w${w}-${path.replace(/\W/g, '')}${theme === 'dark' ? '-dark' : ''}.png`, fullPage: true });
    await ctx.close();
  }
  await b.close();
})();
