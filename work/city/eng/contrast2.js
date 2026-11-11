const { chromium } = require('playwright');
const towns = ['baton-rouge','denham-springs','gonzales','prairieville'];
(async () => {
  const b = await chromium.launch();
  for (const t of towns) for (const theme of ['light','dark']) for (const [w,h] of [[390,844],[1440,900]]) {
    const ctx = await b.newContext({ viewport:{width:w,height:h}, reducedMotion:'reduce', colorScheme:theme });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(`http://localhost:8720/web-design-${t}/`,{waitUntil:'load'}); await p.evaluate(()=>document.fonts.ready);
    await p.evaluate(()=>{document.querySelectorAll('details').forEach(d=>d.open=true); const m=document.getElementById('mobile-cta'); if(m){m.hidden=false;m.classList.add('show');}});
    await p.waitForTimeout(200);
    const r = await p.evaluate(()=>{
      const parse=c=>{ const m=c.match(/rgba?\(([^)]+)\)/); if(!m) return null; const a=m[1].split(/[,\/ ]+/).filter(Boolean).map(Number); return {r:a[0],g:a[1],b:a[2],a:a.length>3?a[3]:1}; };
      const over=(f,bk)=>({r:f.r*f.a+bk.r*(1-f.a), g:f.g*f.a+bk.g*(1-f.a), b:f.b*f.a+bk.b*(1-f.a), a:1});
      const lum=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b);};
      const ratio=(a,b)=>{const l1=lum(a),l2=lum(b);return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);};
      const bgOf=e=>{ const stack=[]; let img=false; let n=e; while(n&&n.nodeType===1){ const cs=getComputedStyle(n); const c=parse(cs.backgroundColor); if(cs.backgroundImage&&cs.backgroundImage!=='none'&&!c?.a) img=img||cs.backgroundImage.slice(0,30); if(c&&c.a>0){ stack.push(c); if(c.a>=1) break; } n=n.parentElement; } let bg={r:255,g:255,b:255,a:1}; if(stack.length&&stack[stack.length-1].a>=1){ bg=stack.pop(); } while(stack.length) bg=over(stack.pop(),bg); return {bg,img}; };
      const res={}; const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n;
      while(n=tw.nextNode()){ const s=n.nodeValue.trim(); if(!s) continue; const e=n.parentElement; if(e.closest('script,style,.sr-only,svg,[hidden]')) continue; const cs=getComputedStyle(e); const rc=e.getBoundingClientRect(); if(cs.display==='none'||cs.visibility==='hidden'||!rc.width) continue; let dn=false; for(let a=e;a;a=a.parentElement){ if(getComputedStyle(a).display==='none'){dn=true;break;} } if(dn) continue;
        const col=parse(cs.color); const {bg,img}=bgOf(e); const fg=col.a<1?over(col,bg):col; let op=1; for(let a=e;a;a=a.parentElement){ op*=parseFloat(getComputedStyle(a).opacity); } const fg2=op<1?over({...fg,a:op},bg):fg;
        const fs=parseFloat(cs.fontSize), fwt=parseInt(cs.fontWeight); const large=fs>=24||(fs>=18.66&&fwt>=700); const need=large?3:4.5; const cr=ratio(fg2,bg);
        if(cr<need){ const k=`${cr.toFixed(2)} (need ${need}) ${Math.round(fs)}px/${fwt} ${cs.color} on rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)}) ${e.tagName.toLowerCase()}.${e.className} in ${(e.closest('section,header,footer,.mobile-cta,.topbar')||{}).className||''}${img?' [bg image '+img+']':''}`; (res[k]=res[k]||[]).push(s.slice(0,30)); } }
      // non-text: borders of buttons vs bg (3:1) and summary plus, ticks icon
      const nt=[]; for(const e of document.querySelectorAll('main .btn:not(.btn-primary), .mobile-cta .btn:not(.btn-primary)')){ const cs=getComputedStyle(e); if(cs.display==='none') continue; const bc=parse(cs.borderTopColor); const {bg}=bgOf(e.parentElement); const own=parse(cs.backgroundColor); const cr=ratio(bc.a<1?over(bc,bg):bc,bg); if(cr<3&&parseFloat(cs.borderTopWidth)>0){ nt.push(`btn border ${cr.toFixed(2)} "${e.textContent.trim().slice(0,20)}" ${cs.borderTopColor} on rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)}) own bg ${cs.backgroundColor}`);} }
      return {res, nt};
    });
    const keys=Object.keys(r.res);
    console.log(`${t} ${theme} ${w}: ${keys.length? '\n   '+keys.map(k=>k+' :: '+r.res[k].slice(0,3).join(' | ')).join('\n   '):'all text passes'}${r.nt.length?'\n   NON-TEXT: '+r.nt.join('\n   NON-TEXT: '):''}`);
    await ctx.close();
  }
  await b.close();
})();
