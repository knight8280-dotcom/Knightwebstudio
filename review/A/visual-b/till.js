const { chromium } = require('playwright');
const BASE = 'http://localhost:8720', OUT = __dirname + '/till/';
const STRIPE = `window.Stripe=function(){return{initCheckoutFormSdk:function(){return{createForm:function(){return{mount:function(sel){var el=document.querySelector(sel);el.innerHTML='<div style="font:16px system-ui;color:#30313d;background:#fff"><label style="display:block;margin:0 0 4px">Email</label><div style="border:1px solid #e6e6e6;border-radius:4px;height:44px;margin-bottom:12px"></div><label style="display:block;margin:0 0 4px">Card information</label><div style="border:1px solid #e6e6e6;border-radius:4px;height:44px;margin-bottom:12px"></div><label style="display:block;margin:0 0 4px">Cardholder name</label><div style="border:1px solid #e6e6e6;border-radius:4px;height:44px;margin-bottom:16px"></div><div style="background:#0570de;color:#fff;border-radius:4px;height:44px;line-height:44px;text-align:center;font-weight:600">Pay</div></div>';},on:function(){}};},loadActions:function(){return Promise.resolve({type:'success',actions:{confirm:function(){return Promise.resolve({})}}});}};}};};`;
(async () => {
  const browser = await chromium.launch();
  for (const w of [360, 600, 760, 820, 980, 1100, 1280, 1920]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: 'light' });
    await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
    await ctx.route(/plausible\.io|calendly\.com|hcaptcha/, r => r.abort());
    await ctx.route(/js\.stripe\.com/, r => r.fulfill({ contentType: 'application/javascript', body: STRIPE }));
    await ctx.route(/onrender\.com\/api\/create-checkout-session/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ client_secret: 'x', session_id: 'cs_test_abcdefghijklmnop' }) }));
    await ctx.route(/onrender\.com\/api\/session-status/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'complete', payment_status: 'paid', mode: 'subscription', plan: 'commerce-care', amount_total: 100000, currency: 'usd' }) }));
    for (const [nm, url, ids] of [['checkout', '/checkout/?plan=commerce-care', ['checkout-plan', 'checkout-plan-name', 'checkout-plan-price']], ['success', '/checkout/success/?plan=commerce-care&session_id=cs_test_abcdefghijklmnop', ['success-plan', 'success-plan-name', 'success-plan-price']]]) {
      const page = await ctx.newPage(); await page.goto(BASE + url); await page.waitForTimeout(900);
      await page.screenshot({ path: OUT + `${nm}-${w}.png` });
      const r = await page.evaluate(ids => { const b = id => { const e = document.getElementById(id); const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; }; const rec = b(ids[0]), nme = b(ids[1]), pr = b(ids[2]); const pe = document.getElementById(ids[2]); const lh = parseFloat(getComputedStyle(pe).lineHeight) || parseFloat(getComputedStyle(pe).fontSize) * 1.1; const main = document.querySelector('main'); const kids = [...document.querySelectorAll('.till > *')].filter(e => e.getBoundingClientRect().height > 0).map(e => { const r = e.getBoundingClientRect(); return (e.id || e.className.split(' ').slice(-1)[0]) + '[' + Math.round(r.left) + ',' + Math.round(r.top + scrollY) + ',' + Math.round(r.width) + 'x' + Math.round(r.height) + ']'; }); return { rec, nme, pr, priceLines: Math.round((pr[3] - pr[1]) / lh), priceInside: pr[0] >= rec[0] && pr[2] <= rec[2], nameOverlapsPrice: Math.min(nme[2], pr[2]) - Math.max(nme[0], pr[0]) > 0 && Math.min(nme[3], pr[3]) - Math.max(nme[1], pr[1]) > 0, kids: kids.join(' '), overflow: document.documentElement.scrollWidth - innerWidth }; }, ids);
      console.log(w, nm, JSON.stringify(r));
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
})();
