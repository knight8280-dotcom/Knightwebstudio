const { chromium } = require('playwright');
const towns = ['baton-rouge','denham-springs','gonzales','prairieville'];
(async () => {
  const b = await chromium.launch();
  // A) text-only zoom 200%: root font-size 200%
  for (const t of towns) for (const [w,h] of [[390,844],[1280,800]]) {
    const ctx = await b.newContext({ viewport:{width:w,height:h}, reducedMotion:'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(`http://localhost:8720/web-design-${t}/`,{waitUntil:'load'}); await p.evaluate(()=>document.fonts.ready);
    const base = await p.evaluate(()=>({name:parseFloat(getComputedStyle(document.querySelector('.city-name')).fontSize), small:parseFloat(getComputedStyle(document.querySelector('.city-title > span')).fontSize), lede:parseFloat(getComputedStyle(document.querySelector('.lede')).fontSize)}));
    await p.addStyleTag({content:'html{font-size:200%}'}); await p.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=true)); await p.waitForTimeout(300);
    const r = await p.evaluate(()=>{ const R=e=>e.getBoundingClientRect(); const out=[]; const vis=e=>{const cs=getComputedStyle(e);const r=R(e);return cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0;};
      const over=document.documentElement.scrollWidth-innerWidth; let worst=0,who='';
      for(const e of document.querySelectorAll('main *')){ if(!vis(e)||e.ownerSVGElement) continue; const d=R(e).right-innerWidth; if(d>worst+.5){worst=d;who=e.tagName+'.'+e.className;} const c=getComputedStyle(e); if((c.overflowX==='hidden'||c.overflowX==='clip')&&e.scrollWidth>e.clientWidth+1&&e.textContent.trim()) out.push('clipped x '+e.tagName+'.'+e.className+' +'+(e.scrollWidth-e.clientWidth)); }
      // text escaping its box
      for(const e of document.querySelectorAll('main .btn, main .tier, main .pills li, main .stamp, main .price-strip-nums b, main summary, main .tier-amt, main .board-extras dd')){ if(!vis(e)) continue; const rg=document.createRange(); rg.selectNodeContents(e); const er=R(e); for(const x of rg.getClientRects()){ if(x.width>1&&(x.right>er.right+2||x.left<er.left-2)) { out.push('text outside box: '+e.className+' "'+e.textContent.trim().slice(0,24)+'" by '+Math.round(Math.max(x.right-er.right, er.left-x.left))); break; } } }
      const stamp=document.querySelector('.card .stamp'); const hit=(a,b)=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1; if(stamp){ for(const e of document.querySelectorAll('main .card .pills li, main .card > p:not(.stamp), main .card h2')) if(hit(R(stamp),R(e))) out.push('stamp overlaps '+e.textContent.trim().slice(0,16)); }
      return {over, worst:Math.round(worst), who, out:[...new Set(out)], name:parseFloat(getComputedStyle(document.querySelector('.city-name')).fontSize), small:parseFloat(getComputedStyle(document.querySelector('.city-title > span')).fontSize), lede:parseFloat(getComputedStyle(document.querySelector('.lede')).fontSize)}; });
    console.log(`text 200% ${t} ${w}: page +${r.over}, element +${r.worst} ${r.who}; name ${base.name.toFixed(1)}->${r.name.toFixed(1)}px, h1 small ${base.small}->${r.small}, lede ${base.lede}->${r.lede}; ${JSON.stringify(r.out)}`);
    if(t==='denham-springs') await p.screenshot({path:`clips/zoom200-${t}-${w}.png`, fullPage:false});
    await ctx.close();
  }
  // B) page zoom 200% on a 1280 desktop = 640 CSS px; 400% = 320 CSS px (reflow 1.4.10)
  for (const t of towns) for (const w of [640,320]) {
    const ctx = await b.newContext({ viewport:{width:w,height:w===320?256:400}, reducedMotion:'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(`http://localhost:8720/web-design-${t}/`,{waitUntil:'load'}); await p.evaluate(()=>document.fonts.ready); await p.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=true));
    const r = await p.evaluate(()=>{ const R=e=>e.getBoundingClientRect(); let worst=0,who=''; for(const e of document.querySelectorAll('main *, header *, footer *')){ const cs=getComputedStyle(e); if(cs.display==='none'||cs.visibility==='hidden'||cs.position==='fixed'||e.ownerSVGElement||e.closest('.sr-only')) continue; const r=R(e); if(!r.width) continue; const d=r.right-innerWidth; if(d>worst+.5){worst=d;who=e.tagName+'.'+e.className;} } return {over:document.documentElement.scrollWidth-innerWidth, worst:Math.round(worst), who, name:parseFloat(getComputedStyle(document.querySelector('.city-name')).fontSize)}; });
    console.log(`page zoom (${w} css px) ${t}: page +${r.over}, element +${r.worst} ${r.who}; name ${r.name.toFixed(1)}px`);
    if(w===320&&t==='denham-springs') await p.screenshot({path:`clips/w320-${t}.png`, fullPage:true});
    await ctx.close();
  }
  await b.close();
})();
