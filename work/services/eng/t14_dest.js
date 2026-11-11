const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720/services/');
  const hrefs = await p.evaluate(() => [...new Set([...document.querySelectorAll('main a')].map(a => a.getAttribute('href')))].filter(h => h.startsWith('/')));
  for (const h of hrefs) {
    const resp = await p.goto('http://localhost:8720' + h); await p.waitForTimeout(700);
    const info = await p.evaluate(() => { const id = location.hash.slice(1); const t = id && document.getElementById(id); const sel = document.querySelector('select[name="package"]'); return { title: document.title.slice(0, 50), hashTarget: id ? (t ? `${t.tagName.toLowerCase()}.${t.className} top ${Math.round(t.getBoundingClientRect().top)} "${(t.querySelector('h2,h3,caption') || t).textContent.trim().slice(0, 40)}"` : 'MISSING') : '-', selected: sel && new URLSearchParams(location.search).get('package') ? sel.selectedOptions[0].value + ' = ' + sel.selectedOptions[0].textContent.trim() : '-' }; });
    console.log(resp.status(), h.padEnd(28), JSON.stringify(info));
  }
  await b.close();
})();
