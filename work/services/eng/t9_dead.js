const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    const sheet = [...document.styleSheets].find(s => s.href && s.href.includes('pages/services.css')); const out = [];
    const walk = (rules, media) => { for (const rule of rules) { if (rule.cssRules && rule.media) walk(rule.cssRules, rule.conditionText); else if (rule.selectorText) { for (const s of rule.selectorText.split(/,(?![^()]*\))/)) { const clean = s.replace(/::(before|after)/g, '').replace(/:(hover|active|target|focus-visible)/g, '').trim(); let n = -1; try { n = document.querySelectorAll(clean).length; } catch (e) { n = 'ERR'; } out.push([n, media || '', s.trim().replace('[data-page="services"] ', '')]); } } } };
    walk(sheet.cssRules);
    return out;
  });
  for (const x of r) console.log(String(x[0]).padStart(3), x[2], x[1] ? '   @' + x[1] : '');
  // which declarations change nothing? toggle the page sheet off and compare a few computed props
  await b.close();
})();
