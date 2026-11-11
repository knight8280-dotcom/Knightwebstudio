// The slip price at every width, for the longest string in use and for longer ones: one line, inside the slip.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const url of ['/checkout/?plan=commerce-care', '/checkout/success/?plan=commerce-care']) {
    const ctx = await b.newContext({ viewport: { width: 1920, height: 900 }, reducedMotion: 'reduce' }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    await ctx.route(/js\.stripe\.com/, r => r.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.Stripe=function(){return{initCheckoutFormSdk:function(){return{createForm:function(){return{mount:function(){},on:function(){}}},loadActions:function(){return new Promise(function(){})}}}}}' }));
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + url); await p.waitForTimeout(600);
    for (const s of ['$1,000/month', '$1,234.56/month', '$12,345.67/month', '$4,000']) { await p.evaluate(s => { document.querySelector('.receipt-total b').textContent = s; }, s);
      const out = []; let minSlack = 1e9, minFont = 1e9, maxFont = 0;
      for (let w = 320; w <= 1920; w += 10) { await p.setViewportSize({ width: w, height: 900 });
        const m = await p.evaluate(() => { const el = document.querySelector('.receipt-total b'), pr = el.getBoundingClientRect(), row = document.querySelector('.receipt-total').getBoundingClientRect(), fs = parseFloat(getComputedStyle(el).fontSize);
          return { slack: Math.round(row.width - pr.width), lines: Math.round(pr.height / fs), fs, over: document.documentElement.scrollWidth - document.documentElement.clientWidth, out: pr.right > row.right + 1 || pr.left < row.left - 1 }; });
        minSlack = Math.min(minSlack, m.slack); minFont = Math.min(minFont, m.fs); maxFont = Math.max(maxFont, m.fs);
        if (m.lines > 1 || m.out || m.over > 0) out.push(w + (m.lines > 1 ? ' wraps' : '') + (m.out ? ' OUT' : '') + (m.over ? ' PAGE' : '')); }
      console.log(url.includes('success') ? 'success ' : 'checkout', s.padEnd(18), 'font ' + minFont.toFixed(1) + ' to ' + maxFont.toFixed(1) + 'px, least room ' + minSlack + 'px,', out.length ? out.length + ' widths: ' + out.slice(0, 12).join(', ') + (out.length > 12 ? ' …' : '') : 'one line inside the slip at every width from 320 to 1920'); }
    await ctx.close(); }
  await b.close(); })();
