const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const t of ['baton-rouge','prairieville']) {
    const ctx = await b.newContext({ viewport:{width:390,height:844}, reducedMotion:'reduce', isMobile:true });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(`http://localhost:8720/web-design-${t}/`,{waitUntil:'load'}); await p.evaluate(()=>document.fonts.ready);
    const H=()=>p.evaluate(()=>document.documentElement.scrollHeight);
    const h0=await H();
    await p.addStyleTag({content:'@media (max-width:599.98px){[data-page="city"] .steps .ticks{display:flex;flex-wrap:wrap;gap:var(--s-1) var(--s-4)}}'}); const h1=await H();
    await p.addStyleTag({content:'@media (max-width:599.98px){[data-page="city"] .case-facts{display:flex;flex-wrap:wrap;gap:0 var(--s-5);border-top:var(--dash)} [data-page="city"] .case-facts div{border:0;grid-template-columns:auto auto}}'}); const h2=await H();
    await p.addStyleTag({content:'@media (max-width:599.98px){[data-page="city"] .board-head > p{font:inherit;font-size:var(--fs-body);color:inherit}}'}); const h3=await H();
    await p.addStyleTag({content:'@media (max-width:599.98px){[data-page="city"] .section-head .eyebrow, [data-page="city"] .board-head .eyebrow{display:none}}'}); const h4=await H();
    console.log(t, 'base', h0, '| inline ticks', h1-h0, '| facts one row', h2-h1, '| board claim at body size', h3-h2, '| hide 3 eyebrows', h4-h3, '| total now', h4);
    await p.screenshot({path:`clips/proto-${t}.png`, fullPage:true});
    await ctx.close();
  }
  await b.close();
})();
