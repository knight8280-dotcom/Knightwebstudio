const { chromium } = require('playwright');
const base = 'http://localhost:8720';
const towns = ['baton-rouge','denham-springs','gonzales','prairieville'];
(async () => {
  const b = await chromium.launch();
  for (const t of towns) {
    for (const [w,h] of [[390,844],[1440,900]]) {
      const ctx = await b.newContext({ viewport:{width:w,height:h}, reducedMotion:'reduce', isMobile: w<600, hasTouch: w<600 });
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      const p = await ctx.newPage();
      const errs=[]; p.on('pageerror',e=>errs.push(String(e))); p.on('console',m=>{ if(m.type()==='error'&&!/ERR_FAILED|Failed to load resource/.test(m.text())) errs.push(m.text()); });
      await p.goto(`${base}/web-design-${t}/`, {waitUntil:'load'}); await p.evaluate(()=>document.fonts.ready);
      // open details to measure
      const r = await p.evaluate(() => {
        const out = {};
        const vis = e => { const cs=getComputedStyle(e); const r=e.getBoundingClientRect(); return cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0; };
        out.h1 = document.querySelectorAll('h1').length;
        const hs=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h=>[+h.tagName[1],h.textContent.trim().replace(/\s+/g,' ').slice(0,60)]);
        out.headings = hs.map(x=>x[0]+':'+x[1]);
        out.skips=[]; for(let i=1;i<hs.length;i++) if(hs[i][0]>hs[i-1][0]+1) out.skips.push(hs[i-1].join(':')+' -> '+hs[i].join(':'));
        out.landmarks = [...document.querySelectorAll('header,main,nav,footer,aside,section[aria-label],section[aria-labelledby],[role]')].map(e=>e.tagName.toLowerCase()+(e.getAttribute('role')?'[role='+e.getAttribute('role')+']':'')+(e.getAttribute('aria-label')?'("'+e.getAttribute('aria-label')+'")':'')).join(', ');
        // ids
        const ids={}; document.querySelectorAll('[id]').forEach(e=>ids[e.id]=(ids[e.id]||0)+1); out.dupIds=Object.entries(ids).filter(x=>x[1]>1);
        out.badAnchors=[...document.querySelectorAll('a[href^="#"]')].filter(a=>{const id=a.getAttribute('href').slice(1); return id && id!=='top' && !document.getElementById(id);}).map(a=>a.getAttribute('href'));
        // lists
        out.badLists=[...document.querySelectorAll('ul,ol')].filter(l=>[...l.children].some(c=>c.tagName!=='LI'&&c.tagName!=='SCRIPT'&&c.tagName!=='TEMPLATE')).map(l=>l.className);
        out.badDl=[...document.querySelectorAll('dl')].filter(l=>[...l.children].some(c=>!['DIV','DT','DD'].includes(c.tagName))).map(l=>l.className);
        out.listStyleNone=[...document.querySelectorAll('main ul, main ol')].map(l=>l.className+': '+getComputedStyle(l).listStyleType+' role='+l.getAttribute('role'));
        // images
        out.imgs=[...document.querySelectorAll('img')].map(i=>({src:i.getAttribute('src'),alt:i.getAttribute('alt'),w:i.getAttribute('width'),h:i.getAttribute('height'),loading:i.getAttribute('loading'),top:Math.round(i.getBoundingClientRect().top+scrollY), natural:i.naturalWidth+'x'+i.naturalHeight, rendered: Math.round(i.getBoundingClientRect().width)+'x'+Math.round(i.getBoundingClientRect().height), fit:getComputedStyle(i).objectFit}));
        // aria-hidden with focusable descendants
        out.hiddenFocusable=[...document.querySelectorAll('[aria-hidden="true"] a, [aria-hidden="true"] button, [aria-hidden="true"] [tabindex]')].map(e=>e.outerHTML.slice(0,80));
        // links without names
        out.noName=[...document.querySelectorAll('a,button')].filter(e=>vis(e)&&!(e.textContent.trim()||e.getAttribute('aria-label')||e.querySelector('img[alt]'))).map(e=>e.outerHTML.slice(0,80));
        // new-tab links
        out.newTab=[...document.querySelectorAll('main a[target=_blank]')].map(a=>a.textContent.trim().replace(/\s+/g,' ').slice(0,40)+' rel='+a.rel);
        // svg without aria-hidden
        out.svgNotHidden=[...document.querySelectorAll('svg')].filter(s=>s.getAttribute('aria-hidden')!=='true'&&!s.getAttribute('role')&&!s.closest('[aria-hidden=true]')).length;
        // details
        out.details=[...document.querySelectorAll('details')].map(d=>({open:d.open, sumH:Math.round(d.querySelector('summary').getBoundingClientRect().height)}));
        // touch targets
        out.small=[...document.querySelectorAll('a,button,summary,input,select,textarea,[tabindex]')].filter(vis).map(e=>{const r=e.getBoundingClientRect();return {t:(e.textContent.trim().replace(/\s+/g,' ')||e.getAttribute('aria-label')||'').slice(0,40),w:Math.round(r.width),h:Math.round(r.height),inP:!!e.closest('p,li,dd')&&getComputedStyle(e).display==='inline',where:e.closest('header,footer,main,.topbar,.mobile-cta')?.tagName+'.'+(e.closest('header,footer,main,.topbar,.mobile-cta')?.className||'').split(' ')[0]};}).filter(x=>x.h<44||x.w<44);
        // font sizes
        const sizes={}; const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n;
        while(n=tw.nextNode()){ const s=n.nodeValue.trim(); if(!s) continue; const e=n.parentElement; if(!vis(e)||e.closest('.sr-only,script,style,svg')) continue; const cs=getComputedStyle(e); const fs=parseFloat(cs.fontSize); if(fs<15){ const k=fs+'px '+(cs.textTransform==='uppercase'?'CAPS ':'')+(e.closest('main')?'main ':e.closest('footer')?'footer ':'chrome ')+e.tagName.toLowerCase()+'.'+e.className; (sizes[k]=sizes[k]||[]).push(s.slice(0,40)); } }
        out.smallText=sizes;
        return out;
      });
      console.log(`\n===== ${t} @${w}`); console.log(JSON.stringify(r,null,1)); if(errs.length) console.log('ERRORS',errs);
      await ctx.close();
    }
  }
  await b.close();
})();
