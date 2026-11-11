const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/web-design-baton-rouge/','/web-design-denham-springs/','/web-design-gonzales/','/web-design-prairieville/']) for (const [w,h] of [[360,800],[390,844],[820,1000],[1280,800],[1440,900]]) {
    const ctx = await b.newContext({ viewport:{width:w,height:h}, reducedMotion:'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(`http://localhost:8720${path}`,{waitUntil:'load'}); await p.evaluate(()=>document.fonts.ready);
    await p.addStyleTag({content:'*{line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important} p{margin-bottom:2em !important}'});
    await p.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=true)); await p.waitForTimeout(300);
    const r = await p.evaluate(()=>{ const R=e=>e.getBoundingClientRect(); const out=[]; const vis=e=>{const cs=getComputedStyle(e);const r=R(e);return cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0;};
      const vw=document.documentElement.clientWidth;
      const tw=document.createTreeWalker(document.querySelector('main'),NodeFilter.SHOW_TEXT); let n; const seen=new Set();
      while(n=tw.nextNode()){ if(!n.nodeValue.trim()) continue; const e=n.parentElement; if(!vis(e)||e.closest('.sr-only,svg,[aria-hidden=true]')) continue; const rg=document.createRange(); rg.selectNodeContents(n); for(const x of rg.getClientRects()){ if(x.width>1&&(x.right>vw+1||x.left<-1)){ const k=e.tagName+'.'+e.className+' "'+n.nodeValue.trim().slice(0,24)+'" past viewport by '+Math.round(x.right-vw); if(!seen.has(k)){seen.add(k); out.push(k);} break; } }
        // text escaping a clipping ancestor
        let a=e; while(a&&a!==document.body){ const cs=getComputedStyle(a); if(cs.overflow!=='visible'&&cs.overflowX!=='visible'){ const ar=R(a); for(const x of rg.getClientRects()){ if(x.width>1&&(x.right>ar.right+1||x.bottom>ar.bottom+2)){ const k='clipped by '+a.tagName+'.'+a.className+': "'+n.nodeValue.trim().slice(0,24)+'"'; if(!seen.has(k)){seen.add(k); out.push(k);} break; } } } a=a.parentElement; } }
      return {scroll:document.documentElement.scrollWidth-innerWidth, bodyOverflow:getComputedStyle(document.body).overflowX, out}; });
    console.log(`text-spacing ${path} ${w}: page scroll +${r.scroll} (body overflow-x ${r.bodyOverflow}) ${JSON.stringify(r.out)}`);
    if (w===390) await p.screenshot({path:`/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/work/city/fix/clips/spacing-${path.replace(/\W/g,'')}-390.png`});
    await ctx.close();
  }
  await b.close();
})();
