const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:980,height:900}, reducedMotion:'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/web-design-gonzales/',{waitUntil:'load'}); await p.evaluate(()=>document.fonts.ready);
  await p.addStyleTag({content:'@media (min-width: 980px) and (max-width: 1279.98px) { [data-page="city"] .board-head { grid-template-columns: minmax(0, 1fr); } } [data-page="city"] .board-foot .btn { text-wrap: balance; }'});
  const lines=async sel=>p.evaluate(sel=>{const e=document.querySelector(sel); const rg=document.createRange(); rg.selectNodeContents(e); return new Set([...rg.getClientRects()].filter(x=>x.width>1).map(x=>Math.round(x.top))).size;},sel);
  const out=[]; for (const w of [980,1000,1024,1100,1180,1260,1280,1440]) { await p.setViewportSize({width:w,height:900}); out.push(w+':title '+await lines('.board-head h2')+' line(s), claim '+await lines('.board-head > p')); }
  console.log('board head stacked until 1280 ->', out.join(' | '));
  await p.setViewportSize({width:1024,height:900}); await p.locator('.board-head').screenshot({path:'clips/fix-boardhead-1024.png'});
  await p.setViewportSize({width:390,height:844}); await p.waitForTimeout(100);
  console.log('button at 390 with text-wrap balance:', await p.evaluate(()=>{const e=document.querySelector('.board-foot .btn'); const rg=document.createRange(); rg.selectNodeContents(e); return [...rg.getClientRects()].filter(x=>x.width>1).map(x=>Math.round(x.width)+'px').join(' / ');}));
  await p.locator('.board-foot .btn').screenshot({path:'clips/fix-btn-390.png'});
  await b.close();
})();
