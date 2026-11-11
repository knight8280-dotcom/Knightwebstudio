const { firefox } = require('playwright');
const base = 'http://localhost:8720';
(async () => {
  let b;
  try { b = await firefox.launch(); } catch (e) { console.log('firefox launch failed:', String(e).split('\n')[0]); process.exit(0); }
  console.log('firefox', b.version());
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(base + '/services/#seo'); await p.waitForTimeout(800);
  console.log('firefox /services/#seo: row open =', await p.evaluate(() => document.getElementById('seo').closest('details').open), '| target top =', await p.evaluate(() => Math.round(document.getElementById('seo').getBoundingClientRect().top)), '| scrollY', await p.evaluate(() => scrollY));
  await p.goto(base + '/services/'); await p.waitForTimeout(400); await p.click('a[href="#brand"]'); await p.waitForTimeout(800);
  console.log('firefox menu tap #brand: row open =', await p.evaluate(() => document.getElementById('brand').closest('details').open), '| scrollY', await p.evaluate(() => scrollY));
  // header wrap in firefox
  const q = await ctx.newPage(); await q.goto(base + '/pricing/'); const rows = [];
  for (let w = 1100; w <= 1320; w += 20) { await q.setViewportSize({ width: w, height: 800 }); await q.waitForTimeout(60); rows.push(w + ':' + await q.evaluate(() => Math.round(document.querySelector('.header-cta').getBoundingClientRect().height))); }
  console.log('firefox header button height:', rows.join(' '));
  await b.close();
})();
