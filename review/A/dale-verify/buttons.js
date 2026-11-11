// CUST-06: every button in <main> on a page: its label, where it goes, and (for a sample) what the first screen after the tap says.
// node buttons.js <path> [old]
const { chromium } = require('playwright');
const path = require('path');
const OUT = __dirname;
(async () => {
  const [p, old] = process.argv.slice(2);
  const base = old === 'old' ? 'http://localhost:8700' : 'http://localhost:8720';
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light', isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const page = await ctx.newPage();
  await page.goto(base + p, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  const btns = await page.evaluate(() => [...document.querySelectorAll('main a.btn, main a.more-link, main button')].filter(a => a.getBoundingClientRect().width > 0).map(a => ({
    y: Math.round(a.getBoundingClientRect().top + scrollY), label: a.innerText.replace(/\s+/g, ' ').trim(), href: a.getAttribute('href') || '(button)', aria: a.getAttribute('aria-label') || '', booking: a.hasAttribute('data-booking') })));
  for (const b of btns) console.log(String(b.y).padStart(6), b.label.padEnd(42), b.href.padEnd(40), b.booking ? '[booking]' : '', b.aria ? `aria="${b.aria}"` : '');
  await browser.close();
})();
