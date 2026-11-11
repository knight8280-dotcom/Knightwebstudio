const { open, done, close, shotEl } = require('./lib');
const path = require('path');
(async () => {
  for (const w of [360, 390, 599, 600, 820, 1280]) {
    const page = await open('/services/', w);
    await page.evaluate(() => { const b = document.querySelector('.svc-lead > a.btn'); const d = document.createElement('div'); d.className = 'btn-row'; b.replaceWith(d); d.appendChild(b); });
    const r = await page.evaluate(() => { const b = document.querySelector('.svc-lead .btn-row .btn'); const row = b.parentElement; const prev = row.previousElementSibling; return { w: Math.round(b.getBoundingClientRect().width), colW: Math.round(row.parentElement.getBoundingClientRect().width), gapAbove: Math.round(row.getBoundingClientRect().top - prev.getBoundingClientRect().bottom), mt: getComputedStyle(row).marginTop }; });
    console.log('VA-06 wrapped in btn-row', w, JSON.stringify(r));
    if (w === 390) { await page.evaluate(() => scrollTo(0, document.querySelector('#website-design').getBoundingClientRect().top + scrollY - 140)); await page.waitForTimeout(300); await page.screenshot({ path: path.join(__dirname, 'fix06_services_390.png') }); }
    await done(page);
  }
  // gap above the button before the change
  let page = await open('/services/', 390);
  console.log('before: gap above', await page.evaluate(() => { const b = document.querySelector('.svc-lead > a.btn'); return Math.round(b.getBoundingClientRect().top - b.previousElementSibling.getBoundingClientRect().bottom); }));
  await done(page);
  // pricing bundle button at 390
  page = await open('/pricing/', 390);
  const r = await page.evaluate(() => { const b = [...document.querySelectorAll('main .btn')].find(x => /Start the Launch bundle/.test(x.textContent)); const par = b.parentElement; const bb = b.getBoundingClientRect(), pb = par.getBoundingClientRect(); const pcs = getComputedStyle(par); return { btn: [Math.round(bb.left), Math.round(bb.right)], parent: par.className, parentBox: [Math.round(pb.left), Math.round(pb.right)], padL: pcs.paddingLeft, padR: pcs.paddingRight, border: pcs.borderLeftWidth, display: pcs.display, sibs: [...par.children].map(c => c.className + ':' + Math.round(c.getBoundingClientRect().left) + '-' + Math.round(c.getBoundingClientRect().right)) }; });
  console.log('pricing bundle btn@390', JSON.stringify(r));
  await done(page);
  await close();
})();
