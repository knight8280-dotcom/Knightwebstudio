const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'http://localhost:8720', OLD = '/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/baseline';
(async () => {
  const b = await chromium.launch();
  for (const [label, oldCss, oldJs, p] of [['oldcss-oldjs', true, true, '/'], ['oldcss-oldjs', true, true, '/pricing/'], ['newcss-oldjs', false, true, '/pricing/'], ['newcss-oldjs', false, true, '/contact/']]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message.slice(0, 120))); page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 120)); });
    await page.route('**/*', r => {
      const u = r.request().url();
      if (!u.startsWith(BASE)) return r.abort();
      if (oldCss && u.endsWith('/assets/css/styles.css')) return r.fulfill({ body: fs.readFileSync(OLD + '/assets/css/styles.css'), contentType: 'text/css' });
      if (oldJs && u.endsWith('/assets/js/main.js')) return r.fulfill({ body: fs.readFileSync(OLD + '/assets/js/main.js'), contentType: 'application/javascript' });
      r.continue();
    });
    await page.goto(BASE + p, { waitUntil: 'load' });
    await page.waitForTimeout(4700);
    const st = await page.evaluate(() => ({ cls: document.documentElement.className, ready: window.kwsReady, toggleW: (document.getElementById('nav-toggle') || { offsetWidth: -1 }).offsetWidth, navVisible: !!(document.getElementById('nav') && document.getElementById('nav').offsetHeight), docH: document.documentElement.scrollHeight, overflowX: document.documentElement.scrollWidth - innerWidth, hiddenReveal: [...document.querySelectorAll('.reveal')].filter(e => getComputedStyle(e).opacity === '0').length }));
    console.log(label, p, JSON.stringify(st), 'errors:', JSON.stringify(errs));
    await page.screenshot({ path: __dirname + '/stale-' + label + '-' + (p.replace(/\//g, '') || 'home') + '.png' });
    await ctx.close();
  }
  await b.close();
})();
