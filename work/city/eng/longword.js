const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:360,height:800}, reducedMotion:'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/web-design-baton-rouge/',{waitUntil:'load'}); await p.evaluate(()=>document.fonts.ready);
  const W='Supercalifragilisticexpialidociouswestbankexpresswayconstruction';
  const sels=['.lede','#intro .prose p','main .card h2','main .card p:not(.stamp)','.pills li:last-child','.board-head h2','.board-head > p','.tier-note','.board-extras dt','.board-extras dd','.board-foot p','.board-foot .btn','.section-head h2','.steps h3','.steps p','.steps .ticks li','.section-sub','.print-name h3','.case-copy > p','.case-facts dd','summary','.faq-body p','.cta-copy h2','.cta-copy p','.cta-copy .fine','.page-head .btn-primary'];
  for (const s of sels) {
    const r = await p.evaluate(([s,W])=>{ const e=document.querySelector(s); if(!e) return 'MISSING'; const old=e.innerHTML; if(e.closest('details')) e.closest('details').open=true; e.textContent=W+' '+e.textContent.slice(0,20); const cw=document.documentElement.clientWidth; const rg=document.createRange(); rg.selectNodeContents(e); const right=Math.max(...[...rg.getClientRects()].map(x=>x.right)); let box=e.closest('.btn, .pills li, .card, .board, .tier')||e; const br=box.getBoundingClientRect(); const res={pastViewport:Math.round(right-cw), pastBox:Math.round(right-br.right), pageScroll:document.documentElement.scrollWidth-cw}; e.innerHTML=old; return res; },[s,W]);
    if (r==='MISSING' || r.pastViewport>0 || r.pastBox>0 || r.pageScroll>0) console.log('long word in', s, '->', JSON.stringify(r));
  }
  console.log('long-word test done (only problems are listed above)');
  await b.close();
})();
