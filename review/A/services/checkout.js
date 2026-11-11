// One real load per plan (each load creates one unpaid live Checkout Session, exactly as a visitor's would).
// Theme and width are then changed inside the same load. No field is typed into; nothing is submitted.
const { launch, watch } = require('./lib');
const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8720';
const tag = process.argv[3] || 'new';
const only = process.argv[4] ? process.argv[4].split(',') : null;
const PLANS = [
  ['starter-deposit', 'mobile', 'light'], ['business-deposit', 'desktop', 'dark'], ['commerce-deposit', 'mobile', 'dark'],
  ['essential-care', 'desktop', 'light'], ['growth-care', 'mobile', 'light'], ['commerce-care', 'desktop', 'dark'],
].filter(p => !only || only.includes(p[0]));
const VIEW = { desktop: [1280, 800], mobile: [390, 844] };
const out = {};
const measure = page => page.evaluate(() => {
  const R = e => { if (!e) return null; const x = e.getBoundingClientRect(); return { l: +x.left.toFixed(1), t: +(x.top + scrollY).toFixed(1), w: +x.width.toFixed(1), h: +x.height.toFixed(1), r: +x.right.toFixed(1) }; };
  const s = document.getElementById('checkout-status'), f = document.getElementById('checkout-form'), card = f.closest('.card'), rec = document.getElementById('checkout-plan');
  const fr = f.querySelector('iframe[title="Secure embedded form frame"]') || f.querySelector('iframe');
  // any ancestor that would clip the iframe
  const clips = []; for (let e = fr && fr.parentElement; e && e !== document.documentElement; e = e.parentElement) { const c = getComputedStyle(e); if (/hidden|clip|auto|scroll/.test(c.overflowX + c.overflowY) || c.contain !== 'none' || c.maxHeight !== 'none') clips.push({ el: e.tagName + '.' + e.className, ox: c.overflowX, oy: c.overflowY, contain: c.contain, maxH: c.maxHeight, rect: R(e) }); }
  return { theme: document.documentElement.getAttribute('data-theme'), vw: innerWidth, docW: document.documentElement.scrollWidth, overflowX: document.documentElement.scrollWidth - innerWidth, pageH: document.documentElement.scrollHeight,
    statusHidden: s.hidden, statusText: s.textContent, statusCls: s.className, receiptHidden: rec.hidden, name: document.getElementById('checkout-plan-name').textContent, price: document.getElementById('checkout-plan-price').textContent,
    receipt: R(rec), card: R(card), form: R(f), iframe: R(fr), iframeCount: f.querySelectorAll('iframe').length, clips,
    cardBg: getComputedStyle(card).backgroundColor, bodyBg: getComputedStyle(document.body).backgroundColor, order: [...document.querySelectorAll('#checkout .till > *')].map(e => (e.id || e.className) + '@' + Math.round(e.getBoundingClientRect().top + scrollY)) };
});
async function inner(page) {
  // read-only look inside Stripe's own frame: does its content fit its box?
  const fr = page.frames().find(f => /elements-inner-habanero/.test(f.url()));
  if (!fr) return null;
  try { return await fr.evaluate(() => ({ iw: innerWidth, ih: innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, bodyBg: getComputedStyle(document.body).backgroundColor,
    texts: [...document.querySelectorAll('h1,h2,h3,label,button,legend')].map(e => e.textContent.trim().slice(0, 40)).filter(Boolean).slice(0, 40),
    wide: [...document.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).length })); } catch (e) { return { err: String(e).slice(0, 200) }; }
}
async function shots(page, key) {
  const m = await measure(page);
  const vh = page.viewportSize().height; const files = [];
  let y = Math.max(0, m.card.t - 110), n = 0; const end = m.card.t + m.card.h;
  while (n < 4) { await page.evaluate(yy => scrollTo(0, yy), y); await page.waitForTimeout(500); const f = `shots/checkout/${tag}__${key}__${++n}.png`; await page.screenshot({ path: f }); files.push(f); if (y + vh >= end + 40) break; y += vh - 140; }
  await page.evaluate(() => scrollTo(0, 0));
  return files;
}
(async () => {
  const b = await launch();
  for (const [plan, device, theme] of PLANS) {
    const [w, h] = VIEW[device];
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: device === 'mobile', hasTouch: device === 'mobile', deviceScaleFactor: device === 'mobile' ? 2 : 1, colorScheme: theme });
    await ctx.addInitScript(t => { try { if (!sessionStorage.getItem('kws-test-init')) { localStorage.setItem('theme', t); sessionStorage.setItem('kws-test-init', '1'); } } catch (e) {} }, theme);
    const page = await ctx.newPage(); const log = []; watch(page, log);
    const rec = out[plan] = { device, theme, states: {} };
    page.on('response', async r => { if (/create-checkout-session/.test(r.url()) && r.request().method() === 'POST') { rec.server = { status: r.status(), acao: r.headers()['access-control-allow-origin'] }; try { const j = await r.json(); rec.session_id = j.session_id; rec.server.body = { plan: j.plan, label: j.label, mode: j.mode, hasSecret: !!j.client_secret }; } catch (e) {} } });
    const t0 = Date.now();
    await page.goto(`${base}/checkout/?plan=${plan}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // loading state, as early as it can be caught
    await page.screenshot({ path: `shots/checkout/${tag}__${plan}__${device}-${theme}__loading.png` });
    rec.loading = await measure(page);
    try { await page.waitForFunction(() => document.getElementById('checkout-status').hidden || document.getElementById('checkout-status').classList.contains('error'), null, { timeout: 100000 }); } catch (e) { rec.timeout = true; }
    rec.msToMount = Date.now() - t0;
    await page.waitForTimeout(2500);
    const key = (d, t) => `${plan}__${d}-${t}`;
    rec.states[`${device}-${theme}`] = { m: await measure(page), inner: await inner(page), files: await shots(page, key(device, theme)) };
    // other theme, same width
    const other = theme === 'light' ? 'dark' : 'light';
    await page.evaluate(() => document.getElementById('theme-toggle').click()); await page.waitForTimeout(500);
    rec.states[`${device}-${other}`] = { m: await measure(page), files: await shots(page, key(device, other)) };
    // other widths in the same load (still the night/day theme just set), then back
    for (const [vw, vh, name] of device === 'mobile' ? [[360, 740, 'w360'], [430, 932, 'w430'], [320, 640, 'w320']] : [[390, 844, 'w390'], [820, 1100, 'w820'], [1100, 800, 'w1100'], [1440, 900, 'w1440'], [1920, 1080, 'w1920']]) {
      await page.setViewportSize({ width: vw, height: vh }); await page.waitForTimeout(1200);
      rec.states[`${name}-${other}`] = { m: await measure(page), inner: await inner(page), files: await shots(page, key(name, other)) };
    }
    rec.log = log.filter(l => l.t !== 'response' || l.status >= 400);
    rec.hosts = [...new Set(log.filter(l => l.t === 'response').map(l => { try { return new URL(l.url).host; } catch (e) { return l.url; } }))];
    await ctx.close();
    console.log(plan, device, theme, 'mounted in', rec.msToMount, 'ms; server', JSON.stringify(rec.server));
  }
  fs.writeFileSync(`checkout-${tag}${only ? '-' + only.join('_') : ''}.json`, JSON.stringify(out, null, 1));
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
