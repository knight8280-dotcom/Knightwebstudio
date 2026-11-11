// Measure section heights at a given width. Usage: node measure.js [width] [url]
const { chromium } = require(process.env.PW || 'playwright');
(async () => {
  const w = parseInt(process.argv[2] || '390', 10);
  const url = process.argv[3] || 'http://localhost:8720/pricing/';
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: w, height: w < 700 ? 844 : 900 } });
  await p.goto(url, { waitUntil: 'networkidle' });
  const r = await p.evaluate(() => {
    const out = [];
    const q = s => [...document.querySelectorAll(s)];
    out.push(['PAGE', document.documentElement.scrollHeight]);
    for (const el of q('.topbar, .site-header, main > section, .site-footer')) out.push([(el.id || el.className).slice(0, 40), Math.round(el.getBoundingClientRect().height)]);
    for (const el of q('main .toc, main .spec tbody tr, main .payplan, main .pricelist, main .panel, main table.table, main .section-head, main .card, main .spec-grid, main .terms-box')) out.push(['  ' + (el.className || el.tagName).slice(0, 40), Math.round(el.getBoundingClientRect().height), Math.round(el.getBoundingClientRect().top + scrollY)]);
    return out;
  });
  for (const row of r) console.log(row.join('\t'));
  await b.close();
})();
