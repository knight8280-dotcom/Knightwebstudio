// Simulates browsers that scroll a focused control to the NEAREST edge (Firefox, Safari), honouring scroll-padding:
//  1) is the control hidden under the sticky header / phone bar?  2) is it still faded out inside an unrevealed .reveal block?
const { chromium, BASE, PAGES, slug, ctxFor } = require('./lib');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const pages = arg('pages', PAGES.join(',')).split(','); const widths = arg('widths', '390,1280').split(',').map(Number);
const doReveal = !process.argv.includes('--noreveal');
const LIST = `[...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex]')].filter(e=>e.tabIndex>=0&&e.checkVisibility({checkVisibilityCSS:true})&&!e.closest('.site-header,.topbar,.mobile-cta,.skip-link,[inert]')&&e.getBoundingClientRect().width>0)`;
const measure = `(el)=>{const r=el.getBoundingClientRect();let cov=0,tot=0,by={};for(let i=0;i<7;i++)for(let j=0;j<5;j++){tot++;const x=r.left+r.width*(i+.5)/7,y=r.top+r.height*(j+.5)/5;if(x<0||y<0||x>=innerWidth||y>=innerHeight){cov++;by.offscreen=(by.offscreen||0)+1;continue;}const t=document.elementFromPoint(x,y);if(!t)continue;const fx=t.closest('.site-header,.mobile-cta,.topbar');if(fx&&!fx.contains(el)){cov++;const k=fx.className.split(' ')[0];by[k]=(by[k]||0)+1;}}
 let op=1,rv=null;for(let e=el;e&&e.nodeType===1;e=e.parentElement){op*=+getComputedStyle(e).opacity;if(e.classList.contains('reveal')&&!rv)rv=e;}
 return {cov,tot,by,op:+op.toFixed(2),top:Math.round(r.top),bottom:Math.round(r.bottom),h:Math.round(r.height),vh:innerHeight,rv:rv?(rv.tagName.toLowerCase()+'.'+rv.className.replace(/\\s+/g,'.')+' h='+Math.round(rv.getBoundingClientRect().height)+' top='+Math.round(rv.getBoundingClientRect().top)+' visible='+rv.classList.contains('visible')):null,text:(el.getAttribute('aria-label')||el.textContent||el.name||'').trim().replace(/\\s+/g,' ').slice(0,40),sy:Math.round(scrollY)};}`;
(async () => {
  const b = await chromium.launch();
  for (const w of widths) for (const path of pages) {
    const h = w === 390 ? 844 : 800;
    const ctx = await ctxFor(b, { w, h, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(400);
    const n = await p.evaluate(`${LIST}.length`); const covered = [];
    for (const dir of ['down', 'up']) for (let i = 0; i < n; i++) {
      const m = await p.evaluate(`(async()=>{const el=${LIST}[${i}];if(!el)return null;const r=el.getBoundingClientRect();const top=r.top+scrollY;scrollTo({top:${dir === 'down' ? `Math.max(0,top-innerHeight-300)` : `top+r.height+300`},behavior:'instant'});await new Promise(r=>setTimeout(r,120));el.scrollIntoView({block:'nearest',behavior:'instant'});el.focus({preventScroll:true});await new Promise(r=>setTimeout(r,420));return (${measure})(el);})()`);
      if (m && m.cov > 0) covered.push(`${dir} "${m.text}" covered ${m.cov}/${m.tot} by ${JSON.stringify(m.by)} top=${m.top} bottom=${m.bottom} vh=${m.vh} scrollY=${m.sy}`);
    }
    console.log(`=== ${path} @${w} focusables=${n} covered-cases=${covered.length}`); covered.slice(0, 12).forEach(c => console.log('   COVER ' + c));
    await ctx.close();
    if (!doReveal) continue;
    // reveal state: fresh load per control that lives in a .reveal block; motion allowed
    const ctx2 = await ctxFor(b, { w, h }); const p2 = await ctx2.newPage(); await p2.goto(BASE + path); await p2.waitForTimeout(300);
    const idx = await p2.evaluate(`${LIST}.map((e,i)=>e.closest('.reveal')?i:-1).filter(i=>i>=0)`);
    const faded = [];
    for (const i of idx) {
      await p2.goto(BASE + path); await p2.waitForTimeout(250);
      const m = await p2.evaluate(`(async()=>{const el=${LIST}[${i}];const r=el.getBoundingClientRect();const top=r.top+scrollY;if(r.bottom<=innerHeight)return null;scrollTo({top:Math.max(0,top-innerHeight-120),behavior:'instant'});await new Promise(r=>setTimeout(r,900));el.scrollIntoView({block:'nearest',behavior:'instant'});el.focus({preventScroll:true});await new Promise(r=>setTimeout(r,1500));return (${measure})(el);})()`);
      if (m && m.op < 1) faded.push(`"${m.text}" opacity=${m.op} after 1.5s; control top=${m.top} bottom=${m.bottom} vh=${m.vh}; block: ${m.rv}`);
    }
    console.log(`    in-reveal controls=${idx.length} still-faded-when-focused=${faded.length}`); faded.forEach(f => console.log('   FADED ' + f));
    await ctx2.close();
  }
  await b.close();
})();
