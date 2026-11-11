const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const base of ['http://localhost:8720','http://localhost:8700']) for (const t of ['baton-rouge','denham-springs','gonzales','prairieville']) {
    const ctx = await b.newContext({ viewport:{width:390,height:844}, reducedMotion:'reduce', isMobile:true });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(`${base}/web-design-${t}/`,{waitUntil:'load'}); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(300);
    const r = await p.evaluate(()=>{ const h=e=>Math.round(e.getBoundingClientRect().height); const parts=[...document.querySelectorAll('main > section')].map(s=>(s.id||s.className.split(' ')[0])+':'+h(s)); const tb=document.querySelector('.topbar'); const hd=document.querySelector('.site-header,header'); const ft=document.querySelector('footer');
      const extra={}; const q=(k,s)=>{const e=document.querySelector(s); if(e) extra[k]=h(e);}; q('board','.board'); q('boardHead','.board-head'); q('tiers','.board-tiers'); q('extras','.board-extras'); q('foot','.board-foot'); q('card','main .card'); q('prose','#intro .prose'); q('steps','.steps'); q('case','.case'); q('faq','.faq'); q('ctaCopy','.cta-copy');
      const st=s=>{const e=document.querySelector(s); if(!e) return ''; const cs=getComputedStyle(e); return cs.paddingTop+'/'+cs.paddingBottom;};
      return {total:document.documentElement.scrollHeight, main:h(document.querySelector('main')), topbar:tb?h(tb):0, header:hd?h(hd):0, footer:ft?h(ft):0, parts, extra, secPad:st('#pricing'), firstPad:st('#intro'), tightPad:st('#questions'), ctaPad:st('.cta-band')}; });
    console.log(`${base.slice(-4)} ${t}: total ${r.total} main ${r.main} topbar ${r.topbar} header ${r.header} footer ${r.footer}\n    ${r.parts.join(' | ')}\n    ${JSON.stringify(r.extra)} pads: sec ${r.secPad} first ${r.firstPad} tight ${r.tightPad} cta ${r.ctaPad}`);
    await ctx.close();
  }
  await b.close();
})();
