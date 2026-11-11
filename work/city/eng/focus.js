const { chromium } = require('playwright');
const base = 'http://localhost:8720';
(async () => {
  const b = await chromium.launch();
  for (const t of ['baton-rouge','denham-springs']) for (const [w,h,theme] of [[390,844,'light'],[390,844,'dark'],[1440,900,'light'],[1440,900,'dark'],[820,1100,'light']]) {
    const ctx = await b.newContext({ viewport:{width:w,height:h}, reducedMotion:'reduce', colorScheme:theme });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(`${base}/web-design-${t}/`,{waitUntil:'load'}); await p.waitForTimeout(300);
    const seen=[]; const probs=[];
    for (let i=0;i<70;i++){ await p.keyboard.press('Tab'); await p.waitForTimeout(140);
      const f = await p.evaluate(()=>{ const a=document.activeElement; if(!a||a===document.body) return null; const r=a.getBoundingClientRect(); const cs=getComputedStyle(a);
        const bar=document.getElementById('mobile-cta'); const barShown=bar&&bar.classList.contains('show')&&getComputedStyle(bar).display!=='none'; const barTop=barShown?bar.getBoundingClientRect().top:innerHeight;
        const hdr=document.getElementById('site-header').getBoundingClientRect();
        const parse=c=>{const m=c.match(/[\d.]+/g).map(Number);return m;};
        const lum=c=>{const [r,g,b]=parse(c).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*r+.7152*g+.0722*b;};
        // background behind the ring: nearest ancestor with non-transparent bg (outside element)
        let e=a.parentElement, bg='rgb(255,255,255)'; while(e){ const c=getComputedStyle(e).backgroundColor; if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c)){bg=c;break;} e=e.parentElement; }
        const oc=cs.outlineColor; const L1=lum(oc),L2=lum(bg); const ratio=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);
        return { label:(a.textContent||a.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,34), tag:a.tagName, ow:cs.outlineWidth, os:cs.outlineStyle, oc, bg, ratio:+ratio.toFixed(2), top:Math.round(r.top), bottom:Math.round(r.bottom), hdrBottom:Math.round(hdr.bottom), barTop:Math.round(barTop), inBar:!!a.closest('#mobile-cta'), inHeader:!!a.closest('.site-header,.topbar,.skip-link'), inFooter:!!a.closest('.site-footer'), fv:a.matches(':focus-visible') };
      });
      if(!f) continue; seen.push(f);
      if(f.os==='none'||parseFloat(f.ow)<2) probs.push(['NO RING',f.label,f.ow,f.os]);
      if(f.ratio<3) probs.push(['RING CONTRAST',f.label,f.oc,f.bg,f.ratio]);
      if(!f.inBar&&!f.inHeader&&(f.bottom>f.barTop+1)) probs.push(['UNDER BAR',f.label,f.bottom,f.barTop]);
      if(!f.inHeader&&!f.inBar&&f.top<f.hdrBottom-1&&f.hdrBottom>0) probs.push(['UNDER HEADER',f.label,f.top,f.hdrBottom]);
      if(f.bottom<0||f.top>h) probs.push(['OFFSCREEN',f.label,f.top,f.bottom]);
      if(f.inFooter && seen.filter(x=>x.inFooter).length>3) break; }
    console.log(`${t} ${w} ${theme}: ${seen.length} stops; order: ${seen.map(s=>s.label).join(' | ')}`);
    console.log('   problems:', JSON.stringify(probs));
    await ctx.close();
  }
  await b.close();
})();
