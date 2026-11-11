// A11Y-05: what changes inside the calculator's live region on one keystroke?
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720/consulting/', { waitUntil: 'load' });
  const info = await p.evaluate(() => {
    const live = [...document.querySelectorAll('[aria-live]')].map(e => ({ cls: e.className, live: e.getAttribute('aria-live'), atomic: e.getAttribute('aria-atomic'), role: e.getAttribute('role'), words: e.innerText.trim().split(/\s+/).length, controls: e.querySelectorAll('a,button').length, hasResults: !!e.querySelector('#r-month') }));
    window.__m = [];
    const region = document.querySelector('#r-month').closest('[aria-live]');
    if (region) new MutationObserver(ms => ms.forEach(m => window.__m.push({ type: m.type, target: (m.target.id || m.target.parentElement && m.target.parentElement.id || m.target.nodeName), added: [...m.addedNodes].map(n => n.textContent).join(''), removed: [...m.removedNodes].map(n => n.textContent).join('') }))).observe(region, { childList: true, subtree: true, characterData: true });
    return { live, defaults: [...document.querySelectorAll('#growth-calc input')].map(i => i.id + '=' + i.value) };
  });
  console.log(JSON.stringify(info, null, 1));
  await p.focus('#c-job'); await p.keyboard.press('End'); await p.keyboard.type('0'); await p.waitForTimeout(200);
  const m1 = await p.evaluate(() => { const m = window.__m; window.__m = []; return m; });
  console.log('one keystroke ->', m1.length, 'mutations in the live region'); m1.forEach(x => console.log('  ', JSON.stringify(x)));
  // accessibility tree of the region
  const snap = await p.locator('.receipt[aria-live]').ariaSnapshot().catch(e => String(e));
  console.log(snap);
  await b.close();
})();
