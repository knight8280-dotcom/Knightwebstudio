const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({viewport:{width:1440,height:900}, reducedMotion:'reduce'})).newPage();
  await p.goto('http://localhost:8720/web-design-denham-springs/',{waitUntil:'load'}); await p.evaluate(()=>document.fonts.ready);
  const r = await p.evaluate(()=>{ const out={}; const names={'Baton Rouge':6.05,'Denham Springs':7.9,'Gonzales':4.3,'Prairieville':5.25};
    const s=document.createElement('span'); s.style.cssText='position:absolute;left:0;top:0;white-space:nowrap;font-family:var(--font-display);font-weight:600;letter-spacing:-.03em;font-size:100px;line-height:1'; document.body.appendChild(s);
    for(const [n,em] of Object.entries(names)){ s.textContent=n; const o={}; 
      s.style.fontVariationSettings='"SOFT" 100'; s.style.fontOpticalSizing='auto'; o.auto=s.getBoundingClientRect().width/100;
      s.style.fontOpticalSizing='none'; o.opszNone=s.getBoundingClientRect().width/100;
      s.style.fontOpticalSizing='auto'; s.style.fontVariationSettings='"SOFT" 100, "opsz" 9'; o.opsz9=s.getBoundingClientRect().width/100;
      s.style.fontVariationSettings='"SOFT" 100, "opsz" 144'; o.opsz144=s.getBoundingClientRect().width/100;
      s.style.fontVariationSettings='"SOFT" 100'; s.style.fontSize='44px'; o.at44=s.getBoundingClientRect().width/44; s.style.fontSize='140px'; o.at140=s.getBoundingClientRect().width/140; s.style.fontSize='100px';
      s.style.fontFamily='Georgia, serif'; s.style.fontWeight='700'; o.genericSerifBold=s.getBoundingClientRect().width/100; s.style.fontFamily='var(--font-display)'; s.style.fontWeight='600';
      o.declared=em; o.air=((em/o.auto-1)*100).toFixed(1)+'%'; out[n]=Object.fromEntries(Object.entries(o).map(([k,v])=>[k,typeof v==='number'?+v.toFixed(3):v])); }
    s.remove(); return out; });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})();
