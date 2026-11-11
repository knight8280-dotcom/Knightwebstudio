const { chromium } = require('playwright');
const base = 'http://localhost:8720';
const towns = ['baton-rouge','denham-springs','gonzales','prairieville'];
(async () => {
  const b = await chromium.launch();
  for (const t of towns) {
    const ctx = await b.newContext({ viewport:{width:360,height:900}, reducedMotion:'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(`${base}/web-design-${t}/`,{waitUntil:'load'}); await p.evaluate(()=>document.fonts.ready);
    await p.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=true));
    const issues={}; const info=[];
    for (let w=360; w<=1920; w+=20) {
      await p.setViewportSize({width:w,height:900}); await p.waitForTimeout(70);
      const r = await p.evaluate(() => {
        const out=[]; const R=e=>e.getBoundingClientRect(); const hit=(a,b,pad=0)=>a.left<b.right-pad&&b.left<a.right-pad&&a.top<b.bottom-pad&&b.top<a.bottom-pad;
        const vis=e=>{const cs=getComputedStyle(e);const r=R(e);return cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0;};
        // a) stamp vs card content
        const stamp=document.querySelector('.card .stamp'); const card=document.querySelector('main .card');
        if(stamp&&vis(stamp)){ const sr=R(stamp); for(const e of card.querySelectorAll('.pills li, h2, p:not(.stamp)')){ if(hit(sr,R(e),1)) out.push('stamp overlaps '+(e.className||e.tagName)+' "'+e.textContent.trim().slice(0,20)+'"'); }
          // stamp vs next section
          const sec=card.closest('section'); const nxt=sec.nextElementSibling; if(sr.bottom>R(sec).bottom) out.push('stamp pokes below its section by '+Math.round(sr.bottom-R(sec).bottom));
          const cont=card.closest('.container'); if(sr.right>innerWidth||sr.left<0) out.push('stamp off-screen'); }
        // b) city name
        const name=document.querySelector('.city-name'), h1=document.querySelector('h1'), mark=document.querySelector('.city-name .mark');
        const cont=h1.parentElement; const cs=getComputedStyle(cont); const contRight=R(cont).right-parseFloat(cs.paddingRight); const contLeft=R(cont).left+parseFloat(cs.paddingLeft);
        const mr=R(mark); if(mr.right>contRight+0.5) out.push('town name wider than column by '+(mr.right-contRight).toFixed(1));
        if(mr.right>innerWidth) out.push('town name past viewport');
        // c) brush vs last line
        const last=h1.querySelector(':scope > span:last-child'); const lr=R(last);
        const after=getComputedStyle(mark,'::after'); 
        // d) clipped text
        for(const e of document.querySelectorAll('main *')){ if(!vis(e)) continue; const c=getComputedStyle(e); if((c.overflowX==='hidden'||c.overflowX==='clip')&&e.scrollWidth>e.clientWidth+1&&e.textContent.trim()) out.push('clipped x: '+e.tagName+'.'+e.className+' by '+(e.scrollWidth-e.clientWidth)); if((c.overflowY==='hidden'||c.overflowY==='clip')&&e.scrollHeight>e.clientHeight+1&&e.textContent.trim()&&!e.matches('.print-img,details')) out.push('clipped y: '+e.tagName+'.'+e.className+' by '+(e.scrollHeight-e.clientHeight)); }
        // e) buttons wrapping
        for(const bt of document.querySelectorAll('main .btn, .site-header .btn')){ if(!vis(bt)) continue; const lh=parseFloat(getComputedStyle(bt).lineHeight)||20; const range=document.createRange(); range.selectNodeContents(bt); const rects=[...range.getClientRects()].filter(x=>x.width>1); const lines=new Set(rects.map(x=>Math.round(x.top))).size; if(lines>1) out.push('button wraps to '+lines+' lines: "'+bt.textContent.trim()+'"'); }
        // f) generic overlap between leaf text blocks in main
        const leaves=[...document.querySelectorAll('main h1 > span, main h2, main h3, main p, main li, main dt, main dd, main summary, main .btn, main .tier > span, main .price-strip > span, main .steps-no, main .print-name, main img')].filter(vis).filter(e=>!e.closest('[aria-hidden=true]')||e.matches('.stamp,.steps-no'));
        for(let i=0;i<leaves.length;i++) for(let j=i+1;j<leaves.length;j++){ const a=leaves[i],c=leaves[j]; if(a.contains(c)||c.contains(a)) continue; if(a===stamp||c===stamp) continue; if(hit(R(a),R(c),1.5)) { // refine with text rects
            const tr=e=>{const rg=document.createRange(); rg.selectNodeContents(e); return [...rg.getClientRects()].filter(x=>x.width>1&&x.height>1);} ; const ra=a.tagName==='IMG'?[R(a)]:tr(a), rc=c.tagName==='IMG'?[R(c)]:tr(c); if(ra.some(x=>rc.some(y=>hit(x,y,1.5)))) out.push('text overlap: ['+(a.className||a.tagName)+' "'+a.textContent.trim().slice(0,18)+'"] x ['+(c.className||c.tagName)+' "'+c.textContent.trim().slice(0,18)+'"]'); } }
        // info
        const bh=document.querySelector('.board-head h2'); const rg=document.createRange(); rg.selectNodeContents(bh); const bl=new Set([...rg.getClientRects()].map(x=>Math.round(x.top))).size;
        const eb=document.querySelector('.page-head .eyebrow'); const rg2=document.createRange(); rg2.selectNodeContents(eb); const el=new Set([...rg2.getClientRects()].filter(x=>x.width>1).map(x=>Math.round(x.top))).size;
        const strip=R(document.querySelector('.price-strip'));
        return {out, nameFs:Math.round(parseFloat(getComputedStyle(name).fontSize)*10)/10, nameW:Math.round(mr.width), colW:Math.round(contRight-contLeft), boardTitleLines:bl, eyebrowLines:el, stripBottom:Math.round(strip.bottom+scrollY), H:document.documentElement.scrollHeight};
      });
      for(const o of r.out){ (issues[o]=issues[o]||[]).push(w); }
      info.push(`${w}:${r.nameFs}px/${r.nameW}of${r.colW} bt${r.boardTitleLines} eb${r.eyebrowLines} strip${r.stripBottom}`);
    }
    console.log(`\n===== ${t}`);
    for(const [k,v] of Object.entries(issues)) console.log('  '+k+'  @ '+(v.length>12? v[0]+'..'+v[v.length-1]+' ('+v.length+' widths)': v.join(',')));
    console.log('  info: '+info.join(' | '));
    await ctx.close();
  }
  await b.close();
})();
