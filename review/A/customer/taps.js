// Real taps at 390x844: load page fresh, scroll link into view, tap, wait for settle, screenshot and report where we landed.
const { chromium } = require('playwright');
const base = 'http://localhost:8720';
const out = process.argv[2];
const jobs = [
  ['/', 'a[href="#pricing"]', 'home_fourfixed'],
  ['/', 'a.tier[href="/checkout/?plan=starter-deposit"]', 'home_tier_starter'],
  ['/', 'a.tier[href="/contact/?package=onepage"]', 'home_tier_onepage'],
  ['/start/', 'a[href="#pricing"]', 'start_fourfixed'],
  ['/start/', 'a[href="/contact/"].btn', 'start_getquote'],
  ['/pricing/', 'a[href="#packages"]', 'pricing_toc_packages'],
  ['/pricing/', 'a[href="#payment"]', 'pricing_toc_payment'],
  ['/pricing/', 'a[href="#addons"]', 'pricing_toc_addons'],
  ['/pricing/', 'a[href="#consulting"]', 'pricing_toc_consulting'],
  ['/pricing/', 'a[href="#care"]', 'pricing_toc_care'],
  ['/pricing/', 'main a[href="/contact/?package=audit"]', 'pricing_audit'],
  ['/pricing/', 'a[href="/contact/?package=bundle"]', 'pricing_bundle'],
  ['/pricing/', 'a[href="/contact/?package=care"]', 'pricing_care_basic'],
  ['/pricing/', 'a[href="/checkout/?plan=essential-care"]', 'pricing_care_essential'],
  ['/pricing/', 'a[href="/checkout/?plan=business-deposit"]', 'pricing_deposit_business'],
  ['/consulting/', '.page-head a[href="/contact/?package=audit"], main a[href="/contact/?package=audit"]', 'consulting_audit'],
  ['/consulting/', 'a[href="#calculator"]', 'consulting_calc'],
  ['/consulting/', 'a[href="#services"]', 'consulting_setups'],
  ['/consulting/', 'a[href="#how"]', 'consulting_how'],
  ['/consulting/', 'a[href="#process"]', 'consulting_process'],
  ['/consulting/', 'a[href="#plans"]', 'consulting_plans'],
  ['/consulting/', 'a[href="/contact/?package=check"]', 'consulting_freecheck'],
  ['/', 'a[href="/consulting/#calculator"]', 'home_to_calc'],
  ['/', 'a[href="/consulting/#how"]', 'home_to_how'],
];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'light' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  for (const [p, sel, name] of jobs) {
    const page = await ctx.newPage();
    await page.goto(base + p, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const loc = page.locator(sel).first();
    const label = (await loc.innerText().catch(() => '?')).replace(/\s+/g, ' ').slice(0, 50);
    try {
      await loc.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await loc.tap({ timeout: 5000 });
    } catch (e) { console.log(name, 'TAP FAILED', String(e).slice(0, 200)); await page.close(); continue; }
    // wait for scroll to settle
    let last = -1, same = 0;
    for (let i = 0; i < 40 && same < 4; i++) { await page.waitForTimeout(150); const y = await page.evaluate(() => Math.round(scrollY)).catch(() => -2); if (y === last) same++; else { same = 0; last = y; } }
    await page.waitForTimeout(600);
    const info = await page.evaluate(() => {
      const hdr = document.getElementById('site-header'); const hb = hdr ? Math.round(hdr.getBoundingClientRect().bottom) : null;
      const bar = document.getElementById('mobile-cta'); const barTop = bar && bar.classList.contains('show') ? Math.round(bar.getBoundingClientRect().top) : null;
      const id = location.hash.slice(1); const t = id ? document.getElementById(id) : null;
      let tgt = null;
      if (t) { const h = t.matches('h1,h2,h3,h4') ? t : t.querySelector('h1,h2,h3,h4,summary'); tgt = { tag: t.tagName, top: Math.round(t.getBoundingClientRect().top), heading: h ? h.innerText.replace(/\s+/g, ' ').slice(0, 60) : null, headingTop: h ? Math.round(h.getBoundingClientRect().top) : null }; }
      const h1 = document.querySelector('h1'); const sel = document.getElementById('package');
      return { url: location.pathname + location.search + location.hash, scrollY: Math.round(scrollY), headerBottom: hb, barTop, tgt, h1: h1 ? h1.innerText.replace(/\s+/g, ' ') : null, packageSelected: sel ? sel.options[sel.selectedIndex].text : undefined };
    });
    await page.screenshot({ path: `${out}/${name}.png` });
    console.log(name.padEnd(26), '| tapped:', label.padEnd(50), '|', JSON.stringify(info));
    await page.close();
  }
  await b.close();
})();
