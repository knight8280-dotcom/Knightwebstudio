const { chromium } = require('playwright');
const towns = ['baton-rouge','denham-springs','gonzales','prairieville'];
(async () => {
  const b = await chromium.launch();
  // 1) fonts blocked entirely
  for (const t of towns) for (const w of [360,390,430,768,1280]) {
    const ctx = await b.newContext({ viewport:{width:w,height:844}, reducedMotion:'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    await ctx.route(/\.woff2/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(`http://localhost:8720/web-design-${t}/`,{waitUntil:'load'}); await p.waitForTimeout(500);
    const r = await p.evaluate(()=>{ const m=document.querySelector('.city-name .mark').getBoundingClientRect(); const c=document.querySelector('.page-head .container'); const cs=getComputedStyle(c); const right=c.getBoundingClientRect().right-parseFloat(cs.paddingRight); return {font:getComputedStyle(document.querySelector('.city-name')).fontFamily.slice(0,40), markRight:Math.round(m.right), colRight:Math.round(right), vw:innerWidth, over:Math.round(m.right-right), pageScroll:document.documentElement.scrollWidth-innerWidth, bodyOverflowX:getComputedStyle(document.body).overflowX, htmlOverflowX:getComputedStyle(document.documentElement).overflowX}; });
    console.log(`fonts blocked ${t} ${w}:`, JSON.stringify(r));
    if (w===390 && (t==='denham-springs'||t==='baton-rouge')) await p.screenshot({path:`clips/nofont-${t}-390.png`});
    await ctx.close();
  }
  // 2) CLS with fonts delayed by 1.5s
  for (const t of towns) for (const [w,h] of [[390,844],[1440,900]]) {
    const ctx = await b.newContext({ viewport:{width:w,height:h} });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    await ctx.route(/\.woff2/, async r => { await new Promise(s=>setTimeout(s,1500)); r.continue(); });
    const p = await ctx.newPage();
    await p.addInitScript(()=>{ window.__cls=0; window.__shifts=[]; new PerformanceObserver(l=>{ for(const e of l.getEntries()){ if(!e.hadRecentInput){ window.__cls+=e.value; window.__shifts.push({v:+e.value.toFixed(4), t:Math.round(e.startTime), src:(e.sources||[]).map(s=>s.node&&(s.node.className||s.node.tagName)).slice(0,4)}); } } }).observe({type:'layout-shift',buffered:true}); });
    await p.goto(`http://localhost:8720/web-design-${t}/`,{waitUntil:'load'}); await p.waitForTimeout(3500);
    const r = await p.evaluate(()=>({cls:+window.__cls.toFixed(4), shifts:window.__shifts}));
    console.log(`CLS delayed fonts ${t} ${w}:`, JSON.stringify(r));
    await ctx.close();
  }
  await b.close();
})();
