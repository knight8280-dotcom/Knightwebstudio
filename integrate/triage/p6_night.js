const { chromium } = require('playwright');
const base = 'http://localhost:8720'; const S = process.argv[2];
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [1280, 800]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', colorScheme: 'dark' }); await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'dark'); } catch (e) {} });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    for (const [path, sel, name] of [['/start/', '.ticket', 'start-ticket'], ['/', '.vig', 'home-vig'], ['/', '.ticket', 'home-ticket'], ['/', '.bizcard', 'home-bizcard'], ['/web-design-gonzales/', '.city-meet', 'city-meet'], ['/consulting/', '.cal', 'consulting-cal']]) {
      const p = await ctx.newPage(); await p.goto(base + path); await p.waitForTimeout(350);
      await p.evaluate(s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); scrollTo(0, r.top + scrollY - 120); }, sel); await p.waitForTimeout(250);
      await p.screenshot({ path: `${S}/n-${name}-${w}-now.png` });
      await p.addStyleTag({ content: ':root[data-theme="dark"]{--paper-2:#0F131D}' }); await p.waitForTimeout(150);
      await p.screenshot({ path: `${S}/n-${name}-${w}-sandDarker.png` });
      await p.close();
    }
    await ctx.close();
  }
  await b.close();
})();
