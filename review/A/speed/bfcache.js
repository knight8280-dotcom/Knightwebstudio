// Back/forward cache: go A -> B, change something, press Back. What state is A in?
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chromium', ignoreDefaultArgs: ['--disable-back-forward-cache'], args: ['--enable-features=BackForwardCache'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  await ctx.addInitScript(() => { window.addEventListener('pageshow', e => { window.__persisted = e.persisted; }); });
  const page = await ctx.newPage();
  const state = () => page.evaluate(() => ({ url: location.pathname, persisted: window.__persisted, theme: document.documentElement.getAttribute('data-theme'), stored: (() => { try { return localStorage.getItem('theme'); } catch (e) { return 'n/a'; } })(), toggleLabel: (document.getElementById('theme-toggle') || {}).ariaLabel, themeColor: (document.querySelector('meta[name=theme-color]') || {}).content, navOpen: document.getElementById('nav') ? document.getElementById('nav').classList.contains('open') : null, bodyOverflow: document.body.style.overflow, inert: [...document.querySelectorAll('[inert]')].length, ctaShown: document.getElementById('mobile-cta') ? document.getElementById('mobile-cta').classList.contains('show') : null, scrollY: Math.round(scrollY), hiddenReveals: [...document.querySelectorAll('.reveal:not(.visible)')].filter(el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }).length }));
  // 1. theme changed on another page
  await page.goto('http://localhost:8720/', { waitUntil: 'load' }); await page.waitForTimeout(400);
  console.log('A (home) first visit      ', JSON.stringify(await state()));
  await page.evaluate(() => window.scrollTo(0, 3000)); await page.waitForTimeout(500);
  await page.click('#nav-toggle'); await page.waitForTimeout(400);
  console.log('A menu open               ', JSON.stringify(await state()));
  await page.click('#nav a[href="/pricing/"]'); await page.waitForLoadState('load'); await page.waitForTimeout(400);
  console.log('B (pricing)               ', JSON.stringify(await state()));
  await page.click('#theme-toggle'); await page.waitForTimeout(200);
  console.log('B after theme toggle      ', JSON.stringify(await state()));
  await page.goBack({ waitUntil: 'load' }).catch(() => {}); await page.waitForTimeout(700);
  console.log('A after Back              ', JSON.stringify(await state()));
  await page.goForward({ waitUntil: 'load' }).catch(() => {}); await page.waitForTimeout(700);
  console.log('B after Forward           ', JSON.stringify(await state()));
  // 2. contact form draft
  await page.goto('http://localhost:8720/contact/', { waitUntil: 'load' }); await page.fill('#name', 'Pat Roofer'); await page.fill('#message', 'Need a new site for my roofing company'); await page.check('input[name="services"] >> nth=1', { force: true }).catch(() => {}); await page.waitForTimeout(700);
  await page.click('footer a[href="/pricing/"]').catch(async () => { await page.goto('http://localhost:8720/pricing/'); }); await page.waitForLoadState('load'); await page.waitForTimeout(300);
  await page.goBack({ waitUntil: 'load' }).catch(() => {}); await page.waitForTimeout(700);
  console.log('contact after Back        ', JSON.stringify(await page.evaluate(() => ({ persisted: window.__persisted, name: document.getElementById('name').value, message: document.getElementById('message').value, checked: [...document.querySelectorAll('input[name=services]:checked')].map(c => c.value), draft: localStorage.getItem('kws-enquiry-draft') }))));
  await browser.close();
})();
