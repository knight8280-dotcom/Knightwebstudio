// At every 20px from 1100 to 1920: are the two head buttons on one row, is the h1 three lines, does the strip fit in 800px?
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 800 } });
  await p.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  let bad = 0;
  for (let w = 600; w <= 980; w += 20) {
    await p.setViewportSize({ width: w, height: 800 }); await p.goto('http://localhost:8720/start/'); await p.waitForTimeout(120);
    const r = await p.evaluate(() => {
      const [a, c] = document.querySelectorAll('.head-copy .btn'); const h1 = document.querySelector('h1');
      return { oneRow: Math.abs(a.getBoundingClientRect().top - c.getBoundingClientRect().top) < 2, lines: Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).fontSize)),
               strip: Math.round(document.querySelector('.price-strip').getBoundingClientRect().bottom), spare: Math.round(document.querySelector('.head-copy').getBoundingClientRect().width - (a.getBoundingClientRect().width + c.getBoundingClientRect().width + 12)) };
    });
    if (!r.oneRow || r.lines !== 3 || (w >= 1280 && r.strip > 800)) { bad++; console.log('CHECK', w, JSON.stringify(r)); }
    if (w === 600 || w === 620 || w === 760) console.log(w, JSON.stringify(r));
  }
  console.log(bad ? bad + ' widths to look at' : 'buttons on one row, h1 three lines at every width from 600 to 980');
  await b.close();
})();
