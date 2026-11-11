const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const rm of ['reduce','no-preference']) {
    const ctx = await b.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, reducedMotion:rm });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/web-design-gonzales/',{waitUntil:'load'}); await p.waitForTimeout(400);
    await p.tap('a.price-strip'); await p.waitForTimeout(1500);
    const r = await p.evaluate(()=>{ const h=document.getElementById('site-header').getBoundingClientRect(); const bd=document.querySelector('#pricing .board').getBoundingClientRect(); const t=document.querySelector('#pricing h2').getBoundingClientRect(); return {hash:location.hash, headerBottom:Math.round(h.bottom), boardTop:Math.round(bd.top), titleTop:Math.round(t.top), y:Math.round(scrollY)}; });
    console.log(`390 ${rm}: tap price strip ->`, JSON.stringify(r));
    await p.screenshot({path:`clips/anchor-390-${rm}.png`});
    await ctx.close();
  }
  // direct load with hash
  const ctx = await b.newContext({ viewport:{width:390,height:844}, isMobile:true });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/web-design-gonzales/#questions',{waitUntil:'load'}); await p.waitForTimeout(800);
  console.log('direct #questions:', JSON.stringify(await p.evaluate(()=>{ const h=document.getElementById('site-header').getBoundingClientRect(); const t=document.querySelector('#questions h2').getBoundingClientRect(); return {headerBottom:Math.round(h.bottom), h2Top:Math.round(t.top), op:[...document.querySelectorAll('#questions *')].filter(e=>getComputedStyle(e).opacity!=='1').length}; })));
  await b.close();
})();
