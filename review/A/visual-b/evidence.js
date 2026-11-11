const { chromium } = require('playwright');
const BASE = 'http://localhost:8720', OUT = __dirname + '/evidence/';
(async () => {
  const browser = await chromium.launch();
  const mk = async (w, h, theme) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme || 'light', deviceScaleFactor: 2 }); await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme || 'light'); await ctx.route(/plausible\.io|calendly\.com|hcaptcha|js\.stripe/, r => r.abort()); await ctx.route(/onrender\.com\/api\/session-status/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'complete', payment_status: 'paid', mode: 'payment', plan: 'business-deposit', amount_total: 200000, currency: 'usd' }) })); return ctx; };
  const clipOf = async (page, sel, pad, find) => { await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 300)); }); const r = await page.evaluate(([s, f]) => { const el = f ? [...document.querySelectorAll(s)].find(e => new RegExp(f).test(e.textContent)) : document.querySelector(s); const b = el.getBoundingClientRect(); return { y: b.top + scrollY, h: b.height }; }, [sel, find || '']); return { fullPage: true, clip: { x: 0, y: Math.max(0, r.y - pad), width: page.viewportSize().width, height: r.h + pad * 2 } }; };
  let ctx, page;
  // 1 eyebrow: Denham Springs 390, Baton Rouge 360
  ctx = await mk(390, 844); page = await ctx.newPage(); await page.goto(BASE + '/web-design-denham-springs/'); await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + 'eyebrow-denham-springs-390.png', clip: { x: 0, y: 100, width: 390, height: 240 } }); await ctx.close();
  ctx = await mk(360, 740); page = await ctx.newPage(); await page.goto(BASE + '/web-design-baton-rouge/'); await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + 'eyebrow-baton-rouge-360.png', clip: { x: 0, y: 100, width: 360, height: 240 } }); await ctx.close();
  // 2 work eyebrow 390 + 820
  for (const w of [390, 820]) { ctx = await mk(w, 900); page = await ctx.newPage(); await page.goto(BASE + '/work/'); await page.waitForTimeout(500); const c = await clipOf(page, '.case-copy .eyebrow', 40, 'Bookkeeping'); await page.screenshot({ path: OUT + `work-eyebrow-${w}.png`, ...c }); await ctx.close(); }
  // 3 Prairieville h2 at 390, 1024, 1440
  for (const w of [390, 1024, 1440]) { ctx = await mk(w, 900); page = await ctx.newPage(); await page.goto(BASE + '/web-design-prairieville/'); await page.waitForTimeout(500); const c = await clipOf(page, 'main h2', 50, 'home-service'); await page.screenshot({ path: OUT + `prairieville-h2-${w}.png`, ...c }); await ctx.close(); }
  // 4 Baton Rouge h2 at 1024
  for (const w of [1024, 1100, 1280]) { ctx = await mk(w, 768); page = await ctx.newPage(); await page.goto(BASE + '/web-design-baton-rouge/'); await page.waitForTimeout(500); const c = await clipOf(page, 'main h2', 50, 'site needs to do'); await page.screenshot({ path: OUT + `baton-rouge-h2-${w}.png`, ...c }); await ctx.close(); }
  // 5 success paid headline at 390 light
  ctx = await mk(390, 844); page = await ctx.newPage(); await page.goto(BASE + '/checkout/success/?plan=business-deposit&session_id=cs_test_abcdefghijklmnop'); await page.waitForTimeout(900);
  await page.screenshot({ path: OUT + 'success-paid-headline-390.png', clip: { x: 0, y: 100, width: 390, height: 330 } });
  console.log('em widths', JSON.stringify(await page.evaluate(() => { const h = document.querySelector('h1'); const cs = getComputedStyle(h); const s = document.createElement('span'); s.style.cssText = 'position:absolute;white-space:nowrap;visibility:hidden;font:' + cs.font + ';letter-spacing:' + cs.letterSpacing + ';font-variation-settings:' + cs.fontVariationSettings; document.body.appendChild(s); const m = t => { s.textContent = t; return +(s.getBoundingClientRect().width / parseFloat(cs.fontSize)).toFixed(3); }; return { fontSize: cs.fontSize, containerW: h.getBoundingClientRect().width, 'Payment confirmed —': m('Payment confirmed —'), 'Payment confirmed': m('Payment confirmed'), 'Payment confirmed — thank you': m('Payment confirmed — thank you') }; })));
  const sizes = {}; for (const w of [340, 360, 375, 390, 414, 430, 480, 540, 599]) { await page.setViewportSize({ width: w, height: 844 }); sizes[w] = await page.evaluate(() => { const h = document.querySelector('h1'); return [parseFloat(getComputedStyle(h).fontSize).toFixed(1), Math.round(h.getBoundingClientRect().width)]; }); }
  console.log('h1 [fontSize, containerW] by width', JSON.stringify(sizes));
  await ctx.close();
  await browser.close();
})();
