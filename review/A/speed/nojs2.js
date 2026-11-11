const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false, isMobile: true, hasTouch: true });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const shots = [['/consulting/', '#c-job', 'calc'], ['/contact/', '#contact-form', 'form'], ['/contact/', '#submit-btn', 'formend'], ['/checkout/', 'main', 'checkout'], ['/checkout/success/', 'main', 'success'], ['/faq/', 'main', 'faq'], ['/services/', 'details', 'services']];
  for (const [p, sel, name] of shots) {
    const page = await ctx.newPage(); await page.goto('http://localhost:8720' + p, { waitUntil: 'load' });
    await page.evaluate(s => { const el = document.querySelector(s); if (el) window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 120); }, sel); await page.waitForTimeout(300);
    await page.screenshot({ path: `${__dirname}/nojs/view-${name}.png` });
    if (name === 'calc') { const info = await page.evaluate(() => { const f = document.querySelector('#c-job').closest('form, section'); const txt = f.innerText; return { noscript: [...document.querySelectorAll('noscript')].map(n => n.textContent.trim().slice(0, 200)), inputs: [...document.querySelectorAll('#c-job,#c-rate,#c-calls,#c-callwin,#c-quotes,#c-quotewin,#c-hours,#c-auto')].map(i => i.id + '=' + i.value + (i.disabled ? '(disabled)' : '') + (i.readOnly ? '(ro)' : '')), hasNote: /JavaScript|turn on|script/i.test(txt), live: [...document.querySelectorAll('[aria-live]')].map(e => e.id || e.className) }; }); console.log('calc', JSON.stringify(info)); }
    if (name === 'form') { console.log('form', JSON.stringify(await page.evaluate(() => ({ noscript: [...document.querySelectorAll('main noscript')].map(n => n.textContent.trim().slice(0, 200)), captchaSlot: (() => { const c = document.getElementById('hcaptcha-slot'); const r = c.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), c.className, c.getAttribute('data-sitekey') ? 'sitekey' : '']; })(), hidden: [...document.querySelectorAll('#contact-form input[type=hidden]')].map(i => i.name + '=' + i.value.slice(0, 30)), required: [...document.querySelectorAll('#contact-form [required]')].map(i => i.name), novalidate: document.getElementById('contact-form').noValidate })))); }
    await page.close();
  }
  await browser.close();
})();
