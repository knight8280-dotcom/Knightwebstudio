const { chromium } = require('playwright');
const towns = ['baton-rouge','denham-springs','gonzales','prairieville'];
(async () => {
  const b = await chromium.launch();
  for (const t of towns) for (const [w,h] of [[390,844],[1440,900]]) {
    const ctx = await b.newContext({ viewport:{width:w,height:h}, javaScriptEnabled:false });
    const p = await ctx.newPage(); await p.goto(`http://localhost:8720/web-design-${t}/`,{waitUntil:'load'}); await p.waitForTimeout(1200);
    // evaluate still works via CDP even with JS disabled in page? Playwright evaluate works with javaScriptEnabled false.
    const r = await p.evaluate(()=>{ const R=e=>e.getBoundingClientRect(); const out={invisible:[], dead:[]};
      for(const e of document.querySelectorAll('main *')){ const cs=getComputedStyle(e); if(e.closest('[hidden]')) continue; if((cs.opacity!=='1'&&parseFloat(cs.opacity)<0.99)||cs.visibility==='hidden') { if(e.textContent.trim()&&!e.closest('.sr-only')) out.invisible.push(e.tagName+'.'+e.className+' op='+cs.opacity+' vis='+cs.visibility); } }
      // display none text in main
      out.hiddenText=[...document.querySelectorAll('main *')].filter(e=>getComputedStyle(e).display==='none'&&e.textContent.trim()&&!e.parentElement.closest('main *:not(main)') ).map(e=>e.tagName+'.'+e.className+': '+e.textContent.trim().slice(0,40));
      out.displayNone=[...document.querySelectorAll('main *')].filter(e=>getComputedStyle(e).display==='none'&&getComputedStyle(e.parentElement).display!=='none'&&e.textContent.trim()).map(e=>e.tagName+'.'+e.className+': '+e.textContent.trim().replace(/\s+/g,' ').slice(0,40));
      const vis=e=>{const cs=getComputedStyle(e);const r=R(e);return cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0&&!e.closest('[hidden]');};
      out.controls=[...document.querySelectorAll('button')].map(bt=>(bt.id||bt.className)+':'+(vis(bt)?'VISIBLE':'hidden'));
      out.mobileCta=vis(document.getElementById('mobile-cta'))?'VISIBLE':'hidden';
      out.nav=[...document.querySelectorAll('#nav .nav-links a')].filter(vis).length+' menu links visible';
      out.booking=[...document.querySelectorAll('[data-booking]')].map(a=>a.getAttribute('href')).join(',');
      out.htmlClass=document.documentElement.className; out.theme=document.documentElement.getAttribute('data-theme');
      out.mark=getComputedStyle(document.querySelector('.city-name .mark'),'::after').transform+' / anim '+getComputedStyle(document.querySelector('.city-name .mark'),'::after').animationName;
      out.over=document.documentElement.scrollWidth-innerWidth; out.H=document.documentElement.scrollHeight;
      out.detailsWork=true; return out; });
    // details open without JS
    await p.locator('details.faq-item summary').first().click(); const open = await p.evaluate(()=>document.querySelector('details.faq-item').open);
    console.log(`noJS ${t} ${w}:`, JSON.stringify(r), 'details opens:', open);
    if (t==='baton-rouge') await p.screenshot({path:`clips/nojs-${t}-${w}.png`});
    await ctx.close();
  }
  // reduced motion + animations list
  for (const rm of ['reduce','no-preference']) {
    const ctx = await b.newContext({ viewport:{width:1440,height:900}, reducedMotion:rm });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(`http://localhost:8720/web-design-baton-rouge/`,{waitUntil:'load'});
    await p.waitForTimeout(100);
    const early = await p.evaluate(()=>document.getAnimations().map(a=>({name:a.animationName||a.transitionProperty||'?', target:(a.effect.target&&(a.effect.target.className||a.effect.target.tagName))+(a.effect.pseudoElement||''), iter:a.effect.getComputedTiming().iterations, dur:a.effect.getComputedTiming().duration, delay:a.effect.getComputedTiming().delay, state:a.playState})));
    for (let y=0;y<8000;y+=400){ await p.evaluate(y=>scrollTo(0,y),y); await p.waitForTimeout(80); }
    await p.waitForTimeout(2500);
    const late = await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').map(a=>({name:a.animationName||a.transitionProperty||'?', target:(a.effect.target&&(a.effect.target.className||a.effect.target.tagName))+(a.effect.pseudoElement||''), iter:a.effect.getComputedTiming().iterations})));
    const infinite = await p.evaluate(()=>{ const out=[]; for(const e of document.querySelectorAll('*')){ for(const ps of [null,'::before','::after']){ const cs=getComputedStyle(e,ps); if(cs.animationName&&cs.animationName!=='none'&&cs.animationIterationCount.includes('infinite')) out.push((e.className||e.tagName)+(ps||'')+' '+cs.animationName); } } return out; });
    const mark = await p.evaluate(()=>{ const cs=getComputedStyle(document.querySelector('.city-name .mark'),'::after'); return {anim:cs.animationName, dur:cs.animationDuration, delay:cs.animationDelay, fill:cs.animationFillMode, iter:cs.animationIterationCount, transform:cs.transform}; });
    console.log(`\nmotion=${rm}: at load animations:`, JSON.stringify(early), '\n  still running after 2.5s:', JSON.stringify(late), '\n  infinite:', JSON.stringify(infinite), '\n  brush:', JSON.stringify(mark));
    await ctx.close();
  }
  await b.close();
})();
