// hCaptcha fit inside the enquiry card at narrow widths. Real hCaptcha script, form endpoint never touched (no submit).
const { chromium } = require('playwright');
const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy;
const FIXES = {
  none: '',
  reviewer: '@media (max-width:339.98px){[data-page="contact"] .h-captcha{transform:scale(.78)}}',
  wider: '@media (max-width:353.98px){[data-page="contact"] .h-captcha{transform:scale(.78)}}',
};
(async () => {
  const browser = await chromium.launch({ proxy: PROXY ? { server: PROXY, bypass: 'localhost,127.0.0.1' } : undefined });
  const rows = [];
  const jobs = [];
  for (const w of [320, 332, 334, 340, 344, 350, 354, 360, 375, 380, 390]) jobs.push({ w, fix: 'none', theme: 'light' });
  jobs.push({ w: 320, fix: 'none', theme: 'dark' });
  for (const w of [320, 339, 340, 344, 353, 354]) { jobs.push({ w, fix: 'reviewer', theme: 'light' }); jobs.push({ w, fix: 'wider', theme: 'light' }); }
  for (const j of jobs) {
    const ctx = await browser.newContext({ viewport: { width: j.w, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, colorScheme: j.theme });
    const page = await ctx.newPage();
    const posts = [];
    page.on('request', r => { if (r.method() === 'POST' && !/hcaptcha/.test(r.url())) posts.push(r.url()); });
    await page.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, j.theme);
    await page.goto('http://localhost:8720/contact/', { waitUntil: 'load' });
    if (FIXES[j.fix]) await page.addStyleTag({ content: FIXES[j.fix] });
    await page.evaluate(() => document.getElementById('hcaptcha-slot').scrollIntoView({ block: 'center' }));
    let ok = true;
    try { await page.waitForSelector('#hcaptcha-slot iframe', { timeout: 30000 }); } catch (e) { ok = false; }
    await page.waitForTimeout(2500);
    const m = await page.evaluate(() => {
      const slot = document.getElementById('hcaptcha-slot'); const ifr = slot.querySelector('iframe');
      const form = document.getElementById('contact-form');
      // the visible card: nearest ancestor (or the form) with a border or background
      let card = form; for (let e = slot.parentElement; e; e = e.parentElement) { const cs = getComputedStyle(e); if (parseFloat(cs.borderRightWidth) > 0 || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && e !== document.body && e.tagName !== 'HTML')) { card = e; break; } }
      const cs = getComputedStyle(card);
      const cr = card.getBoundingClientRect(), ir = ifr ? ifr.getBoundingClientRect() : null, sr = slot.getBoundingClientRect();
      const sub = document.querySelector('#contact-form button[type=submit]');
      return { card: card.tagName + '.' + card.className + '#' + card.id, cardL: cr.left, cardR: cr.right, innerR: cr.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth), innerL: cr.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth), cardOverflow: cs.overflow,
        slot: [sr.left, sr.right, sr.width, sr.height], slotTransform: getComputedStyle(slot).transform, slotTheme: slot.getAttribute('data-theme'),
        ifr: ir ? [ir.left, ir.right, ir.width, ir.height] : null, ifrNatural: ifr ? [ifr.offsetWidth, ifr.offsetHeight] : null,
        vw: innerWidth, sw: document.documentElement.scrollWidth, btn: sub ? [sub.getBoundingClientRect().left, sub.getBoundingClientRect().right] : null };
    });
    m.job = j; m.loaded = ok; m.posts = posts;
    rows.push(m);
    const f = n => n == null ? 'na' : (+n).toFixed(1);
    console.log(`${j.w} ${j.theme} fix=${j.fix} loaded=${ok} | iframe L ${m.ifr && f(m.ifr[0])} R ${m.ifr && f(m.ifr[1])} W ${m.ifr && f(m.ifr[2])} H ${m.ifr && f(m.ifr[3])} nat ${m.ifrNatural} | card ${m.card.slice(0, 40)} L ${f(m.cardL)} R ${f(m.cardR)} innerR ${f(m.innerR)} | pastCard ${m.ifr ? f(m.ifr[1] - m.cardR) : ''} pastInner ${m.ifr ? f(m.ifr[1] - m.innerR) : ''} | toScreenEdge ${m.ifr ? f(m.vw - m.ifr[1]) : ''} | pageOverflow ${m.sw - m.vw} | theme ${m.slotTheme} | posts ${posts.length}`);
    if (j.w === 320 || j.w === 344 || (j.w === 340 && j.fix !== 'none')) {
      const box = await page.evaluate(() => { const r = document.getElementById('hcaptcha-slot').getBoundingClientRect(); return { y: r.top }; });
      await page.screenshot({ path: `shots/cap__${j.w}-${j.theme}-${j.fix}.png`, clip: { x: 0, y: Math.max(0, box.y - 150), width: j.w, height: 330 } });
    }
    await ctx.close();
  }
  require('fs').writeFileSync('cap.json', JSON.stringify(rows, null, 1));
  await browser.close();
})();
