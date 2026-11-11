// hCaptcha refuses localhost ("localhost detected"), so serve the same local files under a made-up host name
// (resolved to 127.0.0.1 inside this browser only). Analytics and the form endpoint are blocked here so that
// nothing is recorded for the real site and nothing can be sent. The checkbox is clicked once to see where the
// challenge opens; it is not solved and the form is not submitted.
const { chromium } = require('./lib');
const fs = require('fs');
const PROXY = process.env.HTTPS_PROXY;
const HOST = 'kws-review.test';
(async () => {
  const b = await chromium.launch({ proxy: { server: PROXY, bypass: 'localhost,127.0.0.1,' + HOST }, args: [`--host-resolver-rules=MAP ${HOST} 127.0.0.1`] });
  const out = {};
  for (const [w, h, theme] of [[360, 740, 'dark'], [390, 844, 'light'], [1280, 800, 'dark']]) {
    const mob = w < 700;
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, deviceScaleFactor: 1, colorScheme: theme });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|api\.web3forms\.com/, r => r.abort());
    const page = await ctx.newPage(); const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
    const k = `${w}-${theme}`; const r = out[k] = {};
    await page.goto(`http://${HOST}:8720/contact/`, { waitUntil: 'load', timeout: 60000 });
    await page.locator('#submit-btn').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => { const f = document.querySelector('#hcaptcha-slot iframe'); return f && f.getBoundingClientRect().height > 20; }, null, { timeout: 30000 }).catch(() => { r.widgetTimeout = true; });
    await page.waitForTimeout(2500);
    const cb = page.frames().find(f => /frame=checkbox/.test(f.url()));
    r.widgetText = cb ? await cb.evaluate(() => document.body.innerText.replace(/\s+/g, ' ')).catch(e => String(e)) : null;
    await page.evaluate(() => document.getElementById('hcaptcha-slot').scrollIntoView({ block: 'center' })); await page.waitForTimeout(300);
    await page.screenshot({ path: `shots/contact/host__captcha-${k}__1-widget.png` });
    // one click on the checkbox
    const box = await page.locator('#hcaptcha-slot iframe').boundingBox();
    await page.mouse.click(box.x + 30 * (box.width / 302), box.y + box.height / 2);
    await page.waitForTimeout(6000);
    r.after = await page.evaluate(() => { const R = e => { const x = e.getBoundingClientRect(); return { l: Math.round(x.left), t: Math.round(x.top), w: Math.round(x.width), h: Math.round(x.height), r: Math.round(x.right), b: Math.round(x.bottom) }; };
      const ch = [...document.querySelectorAll('iframe')].filter(f => /frame=challenge/.test(f.src)).map(f => ({ rect: R(f), vis: getComputedStyle(f).visibility, parent: (p => ({ rect: R(p), z: getComputedStyle(p).zIndex, pos: getComputedStyle(p).position, vis: getComputedStyle(p).visibility, op: getComputedStyle(p).opacity, display: getComputedStyle(p).display }))(f.parentElement.parentElement || f.parentElement) }));
      const hdr = document.getElementById('site-header');
      return { vw: innerWidth, vh: innerHeight, overflowX: document.documentElement.scrollWidth - innerWidth, challenge: ch, header: { rect: R(hdr), z: getComputedStyle(hdr).zIndex }, token: (document.querySelector('[name="h-captcha-response"]') || {}).value ? 'has value' : 'empty', bodyOverflow: getComputedStyle(document.body).overflowX }; });
    await page.screenshot({ path: `shots/contact/host__captcha-${k}__2-after-click.png` });
    r.errs = errs; await ctx.close(); console.log(k, JSON.stringify(r));
  }
  fs.writeFileSync('captcha_host.json', JSON.stringify(out, null, 1));
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
