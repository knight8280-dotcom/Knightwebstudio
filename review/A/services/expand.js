// One more real load: open the "Card" and "US bank account" rows (a click on the row only: nothing is typed,
// nothing is submitted) to see the page take the taller form at a phone and a desktop width.
const { launch, watch } = require('./lib');
(async () => {
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, colorScheme: 'dark' });
  await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'dark'); } catch (e) {} });
  const page = await ctx.newPage(); const log = []; watch(page, log);
  await page.goto('http://localhost:8720/checkout/?plan=starter-deposit', { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => document.getElementById('checkout-status').hidden, null, { timeout: 100000 });
  await page.waitForTimeout(5000);
  const M = () => page.evaluate(() => { const f = document.getElementById('checkout-form'), c = f.closest('.card'), fr = f.querySelector('iframe'); const R = e => { const x = e.getBoundingClientRect(); return [Math.round(x.left), Math.round(x.top + scrollY), Math.round(x.width), Math.round(x.height)]; };
    return { vw: innerWidth, overflowX: document.documentElement.scrollWidth - innerWidth, card: R(c), iframe: R(fr), cardBottomMinusIframeBottom: Math.round(c.getBoundingClientRect().bottom - fr.getBoundingClientRect().bottom), pageH: document.documentElement.scrollHeight, aside: R(document.querySelector('aside.till-side')), receipt: R(document.getElementById('checkout-plan')) }; });
  const shot = async name => { const m = await M(); const vh = page.viewportSize().height; let y = m.card[1] - 80, n = 0; while (n < 3) { await page.evaluate(yy => scrollTo(0, yy), y); await page.waitForTimeout(500); await page.screenshot({ path: `shots/checkout/expand__${name}__${++n}.png` }); if (y + vh > m.card[1] + m.card[3] + 30) break; y += vh - 120; } return m; };
  console.log('closed 390', JSON.stringify(await M()));
  const fr = page.frames().find(f => /elements-inner-habanero/.test(f.url()));
  await fr.getByText('Card', { exact: true }).first().click(); await page.waitForTimeout(3500);
  console.log('card open 390', JSON.stringify(await shot('card-390-dark')));
  await page.setViewportSize({ width: 360, height: 740 }); await page.waitForTimeout(1500);
  console.log('card open 360', JSON.stringify(await shot('card-360-dark')));
  console.log('inner 360', JSON.stringify(await fr.evaluate(() => ({ iw: innerWidth, sw: document.documentElement.scrollWidth, ih: innerHeight, sh: document.documentElement.scrollHeight }))));
  await page.setViewportSize({ width: 1280, height: 800 }); await page.waitForTimeout(1500);
  console.log('card open 1280', JSON.stringify(await shot('card-1280-dark')));
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(1200);
  await fr.getByText('US bank account', { exact: true }).first().click(); await page.waitForTimeout(3500);
  console.log('bank open 390', JSON.stringify(await shot('bank-390-dark')));
  console.log('errors', JSON.stringify(log.filter(l => /error|failed/.test(l.t)).filter(l => !/logo\.png/.test(l.url || '')).slice(0, 8)));
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
