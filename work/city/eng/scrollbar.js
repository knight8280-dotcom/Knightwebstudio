const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] });
  for (const t of ['baton-rouge','denham-springs','gonzales','prairieville']) {
    const ctx = await b.newContext({ viewport:{width:360,height:800}, reducedMotion:'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(`http://localhost:8720/web-design-${t}/`,{waitUntil:'load'}); await p.evaluate(()=>document.fonts.ready);
    const fails=[]; let sb=null; const notes=[];
    for (let w=360; w<=1920; w+=20) { await p.setViewportSize({width:w,height:800}); await p.waitForTimeout(50);
      const r = await p.evaluate(()=>{ const cw=document.documentElement.clientWidth; const sb=innerWidth-cw; const m=document.querySelector('.city-name .mark').getBoundingClientRect(); const c=document.querySelector('.page-head .container'); const cs=getComputedStyle(c); const colRight=c.getBoundingClientRect().right-parseFloat(cs.paddingRight);
        let worst=0,who=''; for(const e of document.querySelectorAll('main *, header *, footer *')){ const s=getComputedStyle(e); if(s.position==='fixed'||s.visibility==='hidden'||e.ownerSVGElement||e.closest('.sr-only')) continue; const rc=e.getBoundingClientRect(); if(!rc.width||!rc.height) continue; const d=rc.right-cw; if(d>worst+.5){worst=d;who=e.tagName+'.'+e.className;} }
        return {sb, pageScroll:document.documentElement.scrollWidth-cw, nameOverCol:+(m.right-colRight).toFixed(1), nameOverViewport:+(m.right-cw).toFixed(1), worst:Math.round(worst), who}; });
      sb=r.sb; if(r.pageScroll>0||r.worst>0) fails.push(`${w}: page +${r.pageScroll}, element +${r.worst} ${r.who}`); if(r.nameOverCol>0) notes.push(`${w}:+${r.nameOverCol}`); }
    console.log(`${t} with classic scrollbar (${sb}px): ${fails.length?fails.join(' | '):'no horizontal overflow 360-1920'}; town name wider than its column at: ${notes.join(' ')||'never'}`);
    await ctx.close();
  }
  await b.close();
})();
