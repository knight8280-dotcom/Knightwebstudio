const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const html = fs.readFileSync('/home/user/Knightwebstudio/consulting/index.html', 'utf8');
  const ids = ['r-month','r-year','r-jobs','r-calls','r-quotes','r-hours','r-timeval','r-payback'];
  const stat = {}; for (const id of ids) { const m = html.match(new RegExp('id="' + id + '"[^>]*>([^<]*)<')); stat[id] = m && m[1]; }
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const page = await ctx.newPage();
  await page.route('**/*', r => { const u = new URL(r.request().url()); return u.hostname === 'localhost' ? r.continue() : r.abort(); });
  for (const base of ['http://localhost:8720', 'http://localhost:8700']) {
    await page.goto(base + '/consulting/', { waitUntil: 'load' }); await page.waitForTimeout(500);
    const live = await page.evaluate(ids => Object.fromEntries(ids.map(i => [i, document.getElementById(i) && document.getElementById(i).textContent])), ids);
    const inputs = await page.evaluate(() => Object.fromEntries(['c-job','c-rate','c-calls','c-callwin','c-quotes','c-quotewin','c-hours','c-auto'].map(i => [i, document.getElementById(i) && document.getElementById(i).value])));
    console.log(base, '\n inputs', JSON.stringify(inputs), '\n after JS', JSON.stringify(live));
    if (base.endsWith('8720')) { console.log(' static  ', JSON.stringify(stat)); console.log(' equal:', ids.every(i => stat[i] === live[i])); }
    // surrounding text of results
    const txt = await page.evaluate(() => { const r = document.querySelector('.receipt') || document.getElementById('r-month').closest('div,section'); return r.innerText; });
    console.log(' results text:\n' + txt.split('\n').map(l => '   | ' + l).join('\n'));
  }
  await b.close();
})();
