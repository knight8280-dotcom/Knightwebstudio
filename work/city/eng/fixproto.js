const { chromium } = require('playwright');
const FIX='[data-page="city"] .city-name, [data-page="city"] .city-name .mark { white-space: normal; overflow-wrap: anywhere; }';
(async () => {
  const b = await chromium.launch();
  for (const t of ['baton-rouge','denham-springs','gonzales','prairieville']) {
    const ctx = await b.newContext({ viewport:{width:360,height:800}, reducedMotion:'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(`http://localhost:8720/web-design-${t}/`,{waitUntil:'load'}); await p.evaluate(()=>document.fonts.ready);
    const before={}; for (let w=360;w<=1920;w+=20){ await p.setViewportSize({width:w,height:800}); before[w]=await p.evaluate(()=>Math.round(document.querySelector('h1').getBoundingClientRect().height)); }
    await p.addStyleTag({content:FIX}); const wrapped=[];
    for (let w=360;w<=1920;w+=20){ await p.setViewportSize({width:w,height:800}); const h=await p.evaluate(()=>Math.round(document.querySelector('h1').getBoundingClientRect().height)); if(h!==before[w]) wrapped.push(w+':'+before[w]+'->'+h); }
    // with text spacing
    await p.addStyleTag({content:'*{line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important} p{margin-bottom:2em !important}'});
    const res=[]; for (const w of [360,390,768,1440]){ await p.setViewportSize({width:w,height:800}); res.push(w+':'+JSON.stringify(await p.evaluate(()=>{ const cw=document.documentElement.clientWidth; const rg=document.createRange(); rg.selectNodeContents(document.querySelector('.city-name .mark')); const rects=[...rg.getClientRects()].filter(x=>x.width>1); return {lines:new Set(rects.map(x=>Math.round(x.top))).size, past:Math.round(Math.max(...rects.map(x=>x.right))-cw)}; }))); }
    console.log(`${t}: with the wrap fix, default layout changes at: ${wrapped.join(' ')||'no width (still one line everywhere)'}; under text-spacing: ${res.join(' ')}`);
    if(t==='denham-springs'){ await p.setViewportSize({width:390,height:800}); await p.screenshot({path:'clips/fixproto-denham-390.png'}); }
    await ctx.close();
  }
  await b.close();
})();
