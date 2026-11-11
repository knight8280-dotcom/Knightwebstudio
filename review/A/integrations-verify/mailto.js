// Mailto fallback: what does the pre-filled email carry? EVERYTHING off-site is blocked, so no enquiry can leave this machine.
const { chromium } = require('playwright');
const fs = require('fs');
const SRC = fs.readFileSync('/home/user/Knightwebstudio/assets/js/main.js', 'utf8');
const OLD = "        'Package: ' + (f['package'].selectedOptions[0] || {}).text + '\\n\\n' +\n";
const REVIEWER = OLD + "        'Needs: ' + Array.prototype.slice.call(form.querySelectorAll('input[name=\"services\"]:checked')).map(function (c) { return c.value; }).join(', ') + '\\n' +\n";
const MINE = "        'Package: ' + (f['package'].selectedOptions[0] || {}).text + '\\n' +\n        (needs ? 'Needs: ' + needs + '\\n' : '') + '\\n' +\n";
const MINE_VAR = "      var f = form.elements;\n      var needs = Array.prototype.slice.call(form.querySelectorAll('input[name=\"services\"]:checked'))\n        .map(function (c) { return c.value; }).join(', ');\n";
if (!SRC.includes(OLD)) { console.log('anchor line not found'); process.exit(1); }
const variants = {
  asis: null,
  reviewer: SRC.replace(OLD, REVIEWER),
  mine: SRC.replace(OLD, MINE).replace("      var f = form.elements;\n      var subject", MINE_VAR + "      var subject"),
};
(async () => {
  const browser = await chromium.launch();
  for (const [name, body] of Object.entries(variants)) for (const ticks of [['Automation', 'Google reviews'], []]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const offsite = [];
    await page.route('**/*', r => {
      const u = r.request().url();
      if (/^http:\/\/localhost:8720\//.test(u)) {
        if (body && /\/assets\/js\/main\.js/.test(u)) return r.fulfill({ status: 200, contentType: 'application/javascript', body });
        return r.continue();
      }
      offsite.push(r.request().method() + ' ' + u.slice(0, 70) + (r.request().method() === 'POST' ? ' body:' + (r.request().postData() || '').replace(/\r?\n/g, ' ').slice(0, 0) : ''));
      return r.abort('connectionrefused');
    });
    await page.addInitScript(() => { window.__enc = []; const o = window.encodeURIComponent; window.encodeURIComponent = function (s) { window.__enc.push(String(s)); return o(s); }; });
    const client = await ctx.newCDPSession(page);
    await client.send('Page.enable');
    const navs = [];
    client.on('Page.frameRequestedNavigation', e => navs.push(e.url));
    await page.goto('http://localhost:8720/contact/?package=audit', { waitUntil: 'load' });
    await page.fill('#name', 'TEST Do Not Reply');
    await page.fill('#email', 'test@example.invalid');
    await page.fill('#company', 'TEST ONLY (site review)');
    await page.fill('#message', 'Test message line one.\nLine two. Please ignore.');
    for (const t of ticks) await page.locator(`input[name="services"][value="${t}"]`).check({ force: true });
    const pkg = await page.evaluate(() => document.getElementById('contact-form').elements['package'].value);
    const widget = await page.evaluate(() => !!document.querySelector('#hcaptcha-slot iframe, #hcaptcha-slot textarea'));
    await page.evaluate(() => document.getElementById('submit-btn').scrollIntoView({ block: 'center' }));
    await page.click('#submit-btn');
    await page.waitForFunction(() => /Opening your email app/.test(document.getElementById('form-status').textContent), null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(800);
    const status = await page.evaluate(() => document.getElementById('form-status').textContent);
    const enc = await page.evaluate(() => window.__enc);
    console.log(`\n=== ${name} | ticked: ${ticks.join(' + ') || '(none)'} | package preselect: ${pkg} | captcha widget present: ${widget}`);
    console.log('status:', status);
    console.log('off-site requests (all aborted):', offsite.filter(x => /POST/.test(x)).join(' | '));
    console.log('mailto navigation seen by the browser:', navs.filter(u => /^mailto:/.test(u)).map(u => u.slice(0, 90) + '…').join(' | ') || '(none captured)');
    console.log('subject:', JSON.stringify(enc[enc.length - 2]));
    console.log('body:\n' + (enc[enc.length - 1] || '').split('\n').map(l => '   | ' + l).join('\n'));
    await ctx.close();
  }
  await browser.close();
})();
