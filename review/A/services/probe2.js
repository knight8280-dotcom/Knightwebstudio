const { launch, watch } = require('./lib');
const base = process.argv[2] || 'http://localhost:8720';
const tag = process.argv[3] || 'new';
(async () => {
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const log = []; watch(page, log);
  await page.goto(base + '/checkout/?plan=starter-deposit', { waitUntil: 'load', timeout: 60000 });
  const measure = () => page.evaluate(() => {
    const s = document.getElementById('checkout-status'); const f = document.getElementById('checkout-form');
    const r = e => { const x = e.getBoundingClientRect(); return [Math.round(x.left), Math.round(x.top), Math.round(x.width), Math.round(x.height)]; };
    return { status: s.textContent, hidden: s.hidden, form: r(f), formCS: (c => ({ overflow: c.overflow, display: c.display, height: c.height, minHeight: c.minHeight }))(getComputedStyle(f)),
      frames: [...document.querySelectorAll('iframe')].map(i => ({ name: (i.name || '').slice(0, 40), title: i.title, src: (i.src || '').slice(0, 80), rect: r(i), style: i.getAttribute('style'), inForm: f.contains(i), vis: getComputedStyle(i).visibility, op: getComputedStyle(i).opacity })),
      children: [...f.children].map(c => ({ tag: c.tagName, cls: c.className, style: c.getAttribute('style'), rect: r(c) })) };
  });
  for (const t of [1500, 3000, 6000, 12000]) {
    await page.waitForTimeout(t === 1500 ? 1500 : t / 2);
    const m = await measure();
    console.log('t+' + t, JSON.stringify(m, null, 0));
    await page.screenshot({ path: `probe2-${tag}-${t}.png` });
  }
  await page.screenshot({ path: `probe2-${tag}-full.png`, fullPage: true });
  console.log('after fullPage', JSON.stringify(await measure()));
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
