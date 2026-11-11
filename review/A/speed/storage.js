// localStorage / sessionStorage unavailable (Safari with cookies blocked, some in-app browsers): does anything throw? Do the theme toggle, menu and form still work?
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const PAGES = ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/web-design-denham-springs/', '/web-design-gonzales/', '/web-design-prairieville/', '/privacy/', '/terms/', '/checkout/', '/checkout/?plan=starter', '/checkout/success/', '/checkout/success/?session_id=cs_test_123', '/404.html'];
(async () => {
  const browser = await chromium.launch();
  for (const mode of ['getter-throws', 'methods-throw']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    await ctx.addInitScript(mode => {
      const boom = () => { throw new DOMException('The operation is insecure.', 'SecurityError'); };
      if (mode === 'getter-throws') { for (const k of ['localStorage', 'sessionStorage']) Object.defineProperty(window, k, { get: boom, configurable: true }); }
      else { for (const m of ['getItem', 'setItem', 'removeItem', 'clear', 'key']) Storage.prototype[m] = boom; }
    }, mode);
    let bad = 0;
    for (const p of PAGES) {
      const page = await ctx.newPage(); const errs = [];
      page.on('pageerror', e => errs.push('pageerror: ' + String(e).slice(0, 160)));
      page.on('console', m => { if (m.type() === 'error' && !/net::ERR|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
      await page.goto('http://localhost:8720' + p, { waitUntil: 'load' }); await page.waitForTimeout(500);
      const st = await page.evaluate(() => ({ cls: document.documentElement.className, theme: document.documentElement.getAttribute('data-theme'), ready: !!window.kwsReady }));
      let acts = '';
      const tt = await page.$('#theme-toggle');
      if (tt && await tt.isVisible()) { await tt.click(); const t2 = await page.evaluate(() => document.documentElement.getAttribute('data-theme')); acts += ` toggle:${st.theme}→${t2}`; }
      const nt = await page.$('#nav-toggle');
      if (nt && await nt.isVisible()) { await nt.click(); await page.waitForTimeout(350); acts += ' menuOpen:' + await page.evaluate(() => document.getElementById('nav').classList.contains('open')); await page.keyboard.press('Escape'); }
      if (p === '/contact/') { await page.fill('#name', 'Test'); await page.fill('#email', 'a@b.co'); await page.fill('#message', 'Hello there, testing'); await page.waitForTimeout(600); acts += ' formFilled'; }
      if (errs.length) bad++;
      console.log(`${mode.padEnd(14)} ${p.padEnd(44)} class="${st.cls}" theme=${st.theme} mainjs=${st.ready}${acts} ${errs.length ? 'ERRORS: ' + errs.join(' || ') : 'no errors'}`);
      await page.close();
    }
    console.log(`-- ${mode}: ${bad} pages with errors`);
    await ctx.close();
  }
  await browser.close();
})();
