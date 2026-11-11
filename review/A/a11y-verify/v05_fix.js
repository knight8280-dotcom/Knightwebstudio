// A11Y-05: corrected fix = live+atomic on the headline line only, set() skips unchanged text, NO delay on the visible result.
const { chromium } = require('playwright');
const fs = require('fs');
const calc = fs.readFileSync('/home/user/Knightwebstudio/assets/js/calculator.js', 'utf8');
const OLD = "if (el) el.textContent = text;";
if (!calc.includes(OLD)) { console.log('pattern not found'); process.exit(1); }
const patched = calc.replace(OLD, "if (el && el.textContent !== text) el.textContent = text;").replace("payback.textContent = 'At these", "var __t = 'At these").replace("in ' + label + '.';", "in ' + label + '.'; if (payback.textContent !== __t) payback.textContent = __t;");
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
  await ctx.route(/\/assets\/js\/calculator\.js/, r => r.fulfill({ contentType: 'application/javascript', body: patched }));
  await ctx.route('**/consulting/', async r => { const resp = await r.fetch(); let body = await resp.text(); body = body.replace('<div class="receipt" aria-live="polite">', '<div class="receipt">').replace('<p class="receipt-total"><span>Estimated extra revenue', '<p class="receipt-total" aria-live="polite" aria-atomic="true"><span>Estimated extra revenue'); r.fulfill({ response: resp, body }); });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8720/consulting/', { waitUntil: 'load' });
  await p.evaluate(() => { window.__m = []; const region = document.querySelector('[aria-live]'); window.__region = region.className + ' atomic=' + region.getAttribute('aria-atomic') + ' text="' + region.innerText.replace(/\s+/g, ' ') + '"'; new MutationObserver(ms => ms.forEach(m => window.__m.push(m.target.id || m.target.parentElement.id))).observe(region, { childList: true, subtree: true, characterData: true }); });
  console.log('live regions:', await p.evaluate(() => document.querySelectorAll('[aria-live]').length), await p.evaluate(() => window.__region));
  await p.fill('#c-calls', '10'); await p.waitForTimeout(100);
  console.log('100ms after input r-month =', await p.textContent('#r-month'), '(behaviour.js expects $3,867)');
  console.log('mutations in live region for that input:', JSON.stringify(await p.evaluate(() => window.__m)));
  console.log('other results still update:', await p.textContent('#r-calls'), '|', await p.textContent('#r-payback'));
  console.log('page errors:', errs.length);
  await b.close();
})();
