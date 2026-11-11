const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/web-design-gonzales/','/web-design-prairieville/','/web-design-baton-rouge/','/web-design-denham-springs/','/pricing/','/services/']) for (const [w,h] of [[390,844],[1440,900]]) {
    const ctx = await b.newContext({ viewport:{width:w,height:h} });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    await ctx.route(/\.woff2/, async r => { await new Promise(s=>setTimeout(s,1500)); r.continue(); });
    const p = await ctx.newPage();
    await p.addInitScript(()=>{ window.__cls=0; window.__shifts=[]; new PerformanceObserver(l=>{ for(const e of l.getEntries()){ if(!e.hadRecentInput){ window.__cls+=e.value; window.__shifts.push({v:+e.value.toFixed(4), t:Math.round(e.startTime), src:(e.sources||[]).map(s=>(s.node&&(s.node.className||s.node.tagName||s.node.nodeName))+' '+Math.round(s.previousRect.y)+'/'+Math.round(s.previousRect.height)+'->'+Math.round(s.currentRect.y)+'/'+Math.round(s.currentRect.height)).slice(0,5)}); } } }).observe({type:'layout-shift',buffered:true}); });
    await p.goto(`http://localhost:8720${path}`,{waitUntil:'commit'});
    await p.waitForTimeout(700);
    const before = await p.evaluate(()=>{ const q=s=>{const e=document.querySelector(s); if(!e) return null; const r=e.getBoundingClientRect(); return Math.round(r.top)+'/'+Math.round(r.height);}; return {h1:q('h1'), name:q('.city-name'), lede:q('.lede'), btn:q('.page-head .btn-row'), strip:q('.price-strip'), ff:getComputedStyle(document.querySelector('h1')).fontFamily.slice(0,30), loaded:[...document.fonts].map(f=>f.family+':'+f.status).join(',')}; });
    await p.waitForTimeout(3200);
    const after = await p.evaluate(()=>{ const q=s=>{const e=document.querySelector(s); if(!e) return null; const r=e.getBoundingClientRect(); return Math.round(r.top)+'/'+Math.round(r.height);}; return {h1:q('h1'), name:q('.city-name'), lede:q('.lede'), btn:q('.page-head .btn-row'), strip:q('.price-strip'), cls:+window.__cls.toFixed(4), shifts:window.__shifts}; });
    console.log(`${path} ${w}: CLS ${after.cls}\n   before(top/height): h1 ${before.h1} name ${before.name} lede ${before.lede} btn ${before.btn} strip ${before.strip} [${before.loaded}]\n   after : h1 ${after.h1} name ${after.name} lede ${after.lede} btn ${after.btn} strip ${after.strip}\n   ${JSON.stringify(after.shifts).slice(0,600)}`);
    await ctx.close();
  }
  await b.close();
})();
