const { chromium } = require('playwright');
// node clip.js town width selector name [theme] [height]
const [,, town, width, sel, name, theme='light', height='900'] = process.argv;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:+width,height:+height}, reducedMotion:'reduce', colorScheme:theme, deviceScaleFactor:1 });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto(`http://localhost:8720/web-design-${town}/`,{waitUntil:'load'}); await p.evaluate(()=>document.fonts.ready);
  await p.evaluate(()=>document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')); await p.waitForTimeout(400);
  if (sel==='viewport') await p.screenshot({path:`clips/${name}.png`});
  else if (sel==='full') await p.screenshot({path:`clips/${name}.png`, fullPage:true});
  else { const el=p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); await p.evaluate(()=>{const h=document.getElementById('site-header'); if(h) h.style.position='static'; const m=document.getElementById('mobile-cta'); if(m) m.style.display='none';}); await el.screenshot({path:`clips/${name}.png`}); }
  await b.close();
})();
