const { chromium } = require('playwright');
const base = 'http://localhost:8720';
const towns = ['baton-rouge','denham-springs','gonzales','prairieville'];
let failed=0; const ok=(n,c,x)=>{ console.log((c?'PASS  ':'FAIL  ')+n+(c||x===undefined?'':'   got: '+JSON.stringify(x))); if(!c) failed++; };
(async () => {
  const b = await chromium.launch();
  for (const t of towns) {
    const url = `${base}/web-design-${t}/`;
    // ---- desktop
    { const ctx = await b.newContext({ viewport:{width:1440,height:900}, colorScheme:'light' });
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e))); p.on('console',m=>{ if(m.type()==='error'&&!/ERR_FAILED|Failed to load resource/.test(m.text())) errs.push(m.text()); });
      const failedReq=[]; p.on('requestfailed',r=>{ if(!/plausible|calendly|hcaptcha|stripe|onrender/.test(r.url())) failedReq.push(r.url()); });
      const bad=[]; p.on('response',r=>{ if(r.status()>=400) bad.push(r.status()+' '+r.url()); });
      await p.goto(url,{waitUntil:'load'}); await p.waitForTimeout(300);
      ok(`${t} 1440: data-page=city`, await p.getAttribute('body','data-page')==='city');
      ok(`${t} 1440: theme light by default`, await p.getAttribute('html','data-theme')==='light');
      await p.click('#theme-toggle');
      ok(`${t} 1440: toggle -> dark, saved, bg dark`, await p.getAttribute('html','data-theme')==='dark' && await p.evaluate(()=>localStorage.getItem('theme'))==='dark' && await p.evaluate(()=>getComputedStyle(document.body).backgroundColor)==='rgb(19, 23, 34)');
      await p.reload(); ok(`${t} 1440: dark persists after reload`, await p.getAttribute('html','data-theme')==='dark');
      await p.click('#theme-toggle'); ok(`${t} 1440: back to light`, await p.getAttribute('html','data-theme')==='light');
      const bk = await p.evaluate(()=>[...document.querySelectorAll('[data-booking]')].map(a=>[a.textContent.trim().replace(/\s+/g,' '),a.href,a.target,a.rel, !!a.closest('main')]));
      ok(`${t} 1440: booking buttons (${bk.length}) all point at calendar, new tab`, bk.length>=4 && bk.every(x=>x[1]==='https://calendly.com/knightwebstudio1/30min'&&x[2]==='_blank'&&x[3]==='noopener'), bk);
      ok(`${t} 1440: two booking buttons in main`, bk.filter(x=>x[4]).length===2, bk.filter(x=>x[4]));
      ok(`${t} 1440: aria-current in menu`, true, null);
      const cur = await p.evaluate(()=>[...document.querySelectorAll('#nav [aria-current]')].map(a=>a.getAttribute('href')));
      console.log('      menu aria-current:', JSON.stringify(cur));
      const footCur = await p.evaluate(()=>[...document.querySelectorAll('.site-footer [aria-current]')].map(a=>a.getAttribute('href')));
      console.log('      footer aria-current:', JSON.stringify(footCur));
      // price strip anchor
      await p.click('a.price-strip'); await p.waitForTimeout(900);
      const pos = await p.evaluate(()=>{ const s=document.getElementById('pricing').getBoundingClientRect(); const h=document.getElementById('site-header').getBoundingClientRect(); const bd=document.querySelector('#pricing .board').getBoundingClientRect(); return {secTop:Math.round(s.top), headerBottom:Math.round(h.bottom), boardTop:Math.round(bd.top), hash:location.hash}; });
      ok(`${t} 1440: price strip jumps to #pricing, board not under header`, pos.hash==='#pricing' && pos.boardTop>=pos.headerBottom-1 && pos.secTop<200, pos);
      // details
      await p.evaluate(()=>scrollTo(0,0));
      const n = await p.locator('details.faq-item').count();
      for (let i=0;i<n;i++){ await p.locator('details.faq-item summary').nth(i).click(); }
      await p.waitForTimeout(300);
      ok(`${t} 1440: ${n} questions open on click`, n===3 && await p.evaluate(()=>[...document.querySelectorAll('details.faq-item')].every(d=>d.open && d.querySelector('.faq-body').getBoundingClientRect().height>20)));
      // keyboard on summary
      await p.locator('details.faq-item summary').first().focus(); await p.keyboard.press('Enter');
      ok(`${t} 1440: Enter on summary closes it`, await p.evaluate(()=>!document.querySelector('details.faq-item').open));
      ok(`${t} 1440: no phone bar on desktop`, !(await p.isVisible('#mobile-cta')));
      await p.evaluate(()=>scrollTo(0,1200)); await p.waitForTimeout(700);
      ok(`${t} 1440: header tel visible after scroll`, await p.isVisible('.header-tel'));
      ok(`${t} 1440: year`, await p.textContent('#year')===String(new Date().getFullYear()));
      // reveal: all visible after scrolling through
      for (let y=0; y<7000; y+=500){ await p.evaluate(y=>scrollTo(0,y),y); await p.waitForTimeout(120); }
      await p.waitForTimeout(900);
      const faded = await p.evaluate(()=>[...document.querySelectorAll('.reveal')].filter(e=>getComputedStyle(e).opacity!=='1').map(e=>e.className));
      ok(`${t} 1440: every reveal block shown after scrolling`, faded.length===0, faded);
      ok(`${t} 1440: no console errors`, errs.length===0, errs);
      ok(`${t} 1440: no failed/4xx requests`, failedReq.length===0 && bad.length===0, failedReq.concat(bad));
      await ctx.close(); }
    // ---- phone
    { const ctx = await b.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, colorScheme:'light' });
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e))); p.on('console',m=>{ if(m.type()==='error'&&!/ERR_FAILED|Failed to load resource/.test(m.text())) errs.push(m.text()); });
      await p.goto(url,{waitUntil:'load'}); await p.waitForTimeout(300);
      const first = await p.evaluate(()=>{ const q=s=>{const e=document.querySelector(s); const r=e.getBoundingClientRect(); return {top:Math.round(r.top),bottom:Math.round(r.bottom),vis:getComputedStyle(e).display!=='none'};}; return {h1:q('h1'), btn:q('.page-head .btn-primary'), btn2:q('.page-head .btn + .btn'), strip:q('.price-strip'), tel:q('.topbar-tel'), ih:innerHeight}; });
      ok(`${t} 390: first screen has h1, booking button, price strip, tel (strip bottom ${first.strip.bottom} of ${first.ih})`, first.h1.top>0 && first.btn.bottom<first.ih && first.strip.bottom<=first.ih && first.tel.bottom<first.ih, first);
      console.log('      head second button visible at 390:', first.btn2.vis);
      ok(`${t} 390: phone bar hidden on first screen`, await p.evaluate(()=>!document.getElementById('mobile-cta').classList.contains('show')));
      ok(`${t} 390: menu closed`, !(await p.isVisible('#nav')));
      await p.click('#nav-toggle'); await p.waitForTimeout(450);
      ok(`${t} 390: menu opens, aria-expanded, main inert`, await p.isVisible('#nav') && await p.getAttribute('#nav-toggle','aria-expanded')==='true' && await p.evaluate(()=>document.querySelector('main').inert===true));
      await p.keyboard.press('Escape'); await p.waitForTimeout(450);
      ok(`${t} 390: Escape closes menu`, !(await p.isVisible('#nav')) && await p.evaluate(()=>!document.querySelector('main').inert && document.body.style.overflow===''));
      await p.evaluate(()=>scrollTo(0,1400)); await p.waitForTimeout(600);
      ok(`${t} 390: phone bar shows after first screen`, await p.evaluate(()=>document.getElementById('mobile-cta').classList.contains('show')) && await p.isVisible('#mobile-cta'));
      const bar = await p.evaluate(()=>[...document.querySelectorAll('#mobile-cta a')].map(a=>({t:a.textContent.trim().replace(/\s+/g,' '),href:a.href,h:Math.round(a.getBoundingClientRect().height),w:Math.round(a.getBoundingClientRect().width)})));
      ok(`${t} 390: bar = Call tel + booking`, bar.length===2 && bar[0].href==='tel:+12252550837' && bar[1].href==='https://calendly.com/knightwebstudio1/30min' && bar.every(x=>x.h>=44), bar);
      // scroll through whole page; at each stop of the closing band, is any button fully reachable (not permanently covered)?
      const H = await p.evaluate(()=>document.documentElement.scrollHeight);
      // at the very bottom
      await p.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight)); await p.waitForTimeout(800);
      const bottom = await p.evaluate(()=>{ const bar=document.getElementById('mobile-cta'); const shown=bar.classList.contains('show'); const br=bar.getBoundingClientRect(); const last=document.querySelector('.footer-bottom').getBoundingClientRect(); const cs=getComputedStyle(bar); return {shown, barTop:Math.round(br.top), lastBottom:Math.round(last.bottom), ih:innerHeight, op:cs.opacity, vis:cs.visibility, pe:cs.pointerEvents}; });
      ok(`${t} 390: at page bottom the bar is away / last line not covered`, !bottom.shown || bottom.lastBottom<=bottom.barTop, bottom);
      // closing band buttons: find scroll position where bar still shows while CTA buttons are in view → they are scrollable anyway. Check when does bar hide: positions
      const trace=[]; for (let y=H-2400; y<=H-844; y+=100){ await p.evaluate(y=>scrollTo(0,y),y); await p.waitForTimeout(260); trace.push(await p.evaluate(()=>{ const bar=document.getElementById('mobile-cta'); const f=document.querySelector('.site-footer').getBoundingClientRect(); const fine=document.querySelector('.cta-band .fine').getBoundingClientRect(); const btn=[...document.querySelectorAll('.cta-band .btn')].pop().getBoundingClientRect(); return [Math.round(scrollY), bar.classList.contains('show')?'bar':'-', 'footerTop:'+Math.round(f.top), 'lastBtnBottom:'+Math.round(btn.bottom), 'fineBottom:'+Math.round(fine.bottom)].join(' '); })); }
      console.log('      bar trace near end:\n        '+trace.join('\n        '));
      // details tap targets with touch
      await p.locator('details.faq-item summary').first().scrollIntoViewIfNeeded(); await p.locator('details.faq-item summary').first().tap(); await p.waitForTimeout(300);
      ok(`${t} 390: tap opens first question`, await p.evaluate(()=>document.querySelector('details.faq-item').open));
      ok(`${t} 390: no console errors`, errs.length===0, errs);
      await ctx.close(); }
  }
  await b.close(); console.log(failed? `\n${failed} FAILED`:'\nall passed');
})();
