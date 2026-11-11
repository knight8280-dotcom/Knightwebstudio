// Contact form behaviour with the real hCaptcha and Plausible loaded. The form endpoint (api.web3forms.com) is
// intercepted in EVERY context here, so no enquiry can leave this machine. Test data is obviously fake.
const { launch, watch } = require('./lib');
const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8720';
const tag = process.argv[3] || 'new';
const out = { tag };
const FAKE = { name: 'TEST Do Not Reply', email: 'test@example.invalid', company: 'TEST ONLY (site review)', message: 'TEST ONLY. Automated pre-launch review of the form. Please ignore.' };
async function ctxFor(b, w, h, theme, mode /* 'abort' | 'ok' | 'reject' */, posts, extra) {
  const mob = w < 700;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, deviceScaleFactor: 1, colorScheme: theme });
  await ctx.addInitScript(t => { try { if (!sessionStorage.getItem('i')) { localStorage.setItem('theme', t); sessionStorage.setItem('i', '1'); } } catch (e) {} }, theme);
  await ctx.route(/api\.web3forms\.com/, async r => {
    const req = r.request(); const body = req.postData() || '';
    const fields = [...body.matchAll(/name="([^"]+)"\r\n\r\n([\s\S]*?)\r\n--/g)].map(m => [m[1], m[2].slice(0, 80)]);
    posts.push({ url: req.url(), method: req.method(), accept: req.headers()['accept'], fields });
    if (mode === 'ok') return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ success: true, message: 'mocked by the reviewer' }) });
    if (mode === 'reject') return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ success: false, message: 'Mocked rejection' }) });
    return r.abort();
  });
  if (extra) await extra(ctx);
  return ctx;
}
const state = page => page.evaluate(() => { const g = id => document.getElementById(id); const f = g('contact-form');
  const vis = e => !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0;
  return { errors: ['name', 'email', 'message'].map(n => [n, g(n + '-error').textContent, g(n).getAttribute('aria-invalid'), g(n).classList.contains('invalid')]),
    status: { text: g('form-status').textContent, cls: g('form-status').className, vis: vis(g('form-status')) }, captchaErr: g('captcha-error').textContent, focus: document.activeElement && document.activeElement.id,
    btn: { text: g('submit-btn').textContent, disabled: g('submit-btn').disabled }, values: { name: f.elements.name.value, email: f.elements.email.value, company: f.elements.company.value, package: f.elements.package.value, message: f.elements.message.value, services: [...f.querySelectorAll('input[name=services]:checked')].map(c => c.value) },
    draft: localStorage.getItem('kws-enquiry-draft'), widget: !!document.querySelector('#hcaptcha-slot iframe'), overflowX: document.documentElement.scrollWidth - innerWidth }; });
const waitWidget = page => page.waitForFunction(() => { const f = document.querySelector('#hcaptcha-slot iframe'); return f && f.getBoundingClientRect().height > 20; }, null, { timeout: 30000 }).catch(() => null);
async function fill(page) {
  await page.fill('#name', FAKE.name); await page.fill('#email', FAKE.email); await page.fill('#company', FAKE.company);
  await page.selectOption('#package', 'audit'); await page.locator('label.chip', { hasText: 'Automation' }).click(); await page.locator('label.chip', { hasText: 'Google reviews' }).click();
  await page.fill('#message', FAKE.message);
}
(async () => {
  const b = await launch();
  // ---------- A. validation, B. captcha gate (real widget), at a phone and a desktop width ----------
  for (const [w, h, theme] of [[360, 740, 'dark'], [1280, 800, 'light']]) {
    const posts = []; const ctx = await ctxFor(b, w, h, theme, 'abort', posts); const page = await ctx.newPage(); const log = []; watch(page, log);
    const k = `validation-${w}-${theme}`; const r = out[k] = {};
    await page.goto(base + '/contact/', { waitUntil: 'load' });
    await page.locator('#submit-btn').scrollIntoViewIfNeeded(); await waitWidget(page);
    await page.locator('#submit-btn').click(); await page.waitForTimeout(500);
    r.emptySubmit = await state(page);
    await page.screenshot({ path: `shots/contact/${tag}__${k}__1-empty-top.png` });
    await page.locator('#submit-btn').scrollIntoViewIfNeeded(); await page.waitForTimeout(300); await page.screenshot({ path: `shots/contact/${tag}__${k}__2-empty-foot.png` });
    await page.fill('#name', FAKE.name); await page.fill('#email', 'not-an-email'); await page.fill('#message', 'short'); await page.locator('#company').focus(); await page.waitForTimeout(300);
    r.badValues = await state(page);
    await page.locator('#email').scrollIntoViewIfNeeded(); await page.screenshot({ path: `shots/contact/${tag}__${k}__3-bad.png` });
    await fill(page); await page.locator('#company').focus(); await page.waitForTimeout(300);
    r.fixed = await state(page);
    // B. everything valid, real widget present and unsolved: the script must stop before any POST
    await page.locator('#submit-btn').click(); await page.waitForTimeout(800);
    r.captchaGate = await state(page); r.postsAfterGate = posts.length;
    await page.screenshot({ path: `shots/contact/${tag}__${k}__4-captcha-gate.png` });
    r.log = log.filter(l => (l.t !== 'response' || l.status >= 400) && !/Origin trial|GL Driver|Ignoring Event|localhost detected|logo\.png/.test((l.text || '') + (l.url || '')));
    await ctx.close(); console.log('done', k);
  }
  // ---------- C. mailto fallback: only the form endpoint blocked; the captcha field is given a dummy value so the script reaches the POST ----------
  for (const [w, h, theme] of [[390, 844, 'light'], [1280, 800, 'dark']]) {
    const posts = []; const ctx = await ctxFor(b, w, h, theme, 'abort', posts); const page = await ctx.newPage(); const log = []; watch(page, log);
    const k = `mailto-${w}-${theme}`; const r = out[k] = {}; const navs = [];
    const cdp = await ctx.newCDPSession(page); await cdp.send('Page.enable'); cdp.on('Page.frameRequestedNavigation', e => navs.push(e.url)); cdp.on('Page.frameScheduledNavigation', e => navs.push(e.url));
    await page.goto(base + '/contact/', { waitUntil: 'load' });
    await page.locator('#submit-btn').scrollIntoViewIfNeeded(); await waitWidget(page); await fill(page); await page.waitForTimeout(600);
    r.captchaFieldPresent = await page.evaluate(() => { const t = document.querySelector('#hcaptcha-slot textarea[name="h-captcha-response"]'); if (t) t.value = 'DUMMY-NOT-A-TOKEN'; return !!t; });
    await page.evaluate(() => { const o = window.plausible; window.__ev = []; window.plausible = function () { window.__ev.push([].slice.call(arguments)); return o && o.apply(this, arguments); }; });
    await page.locator('#submit-btn').click(); await page.waitForTimeout(1800);
    r.after = await state(page); r.posts = posts; r.navs = navs; r.events = await page.evaluate(() => window.__ev);
    await page.locator('#form-status').scrollIntoViewIfNeeded().catch(() => {}); await page.waitForTimeout(300);
    await page.screenshot({ path: `shots/contact/${tag}__${k}.png` });
    r.statusBox = await page.evaluate(() => { const s = document.getElementById('form-status'), f = document.getElementById('contact-form'); const a = s.getBoundingClientRect(), c = f.getBoundingClientRect(); return { l: a.left, r: a.right, w: a.width, h: a.height, formL: c.left, formR: c.right, color: getComputedStyle(s).color, bg: getComputedStyle(s).backgroundColor, fs: getComputedStyle(s).fontSize }; });
    await ctx.close(); console.log('done', k);
  }
  // ---------- C2. server answers 200 with success:false (mock) ----------
  { const posts = []; const ctx = await ctxFor(b, 390, 844, 'dark', 'reject', posts); const page = await ctx.newPage(); const navs = [];
    const cdp = await ctx.newCDPSession(page); await cdp.send('Page.enable'); cdp.on('Page.frameRequestedNavigation', e => navs.push(e.url));
    await page.goto(base + '/contact/', { waitUntil: 'load' }); await page.locator('#submit-btn').scrollIntoViewIfNeeded(); await waitWidget(page); await fill(page);
    await page.evaluate(() => { const t = document.querySelector('#hcaptcha-slot textarea[name="h-captcha-response"]'); if (t) t.value = 'DUMMY-NOT-A-TOKEN'; });
    await page.locator('#submit-btn').click(); await page.waitForTimeout(1500);
    out['reject-390-dark'] = { after: await state(page), navs }; await page.screenshot({ path: `shots/contact/${tag}__reject-390-dark.png` }); await ctx.close(); console.log('done reject'); }
  // ---------- E. success path (mocked endpoint): message, reset, draft cleared, "Enquiry" goal ----------
  for (const [w, h, theme] of [[390, 844, 'dark'], [1280, 800, 'light']]) {
    const posts = []; const ctx = await ctxFor(b, w, h, theme, 'ok', posts); const page = await ctx.newPage(); const k = `sent-${w}-${theme}`; const r = out[k] = {};
    await page.goto(base + '/contact/?package=bundle', { waitUntil: 'load' }); await page.locator('#submit-btn').scrollIntoViewIfNeeded(); await waitWidget(page);
    r.preselect = (await state(page)).values.package;
    await fill(page); await page.waitForTimeout(600); r.draftBefore = (await state(page)).draft;
    await page.evaluate(() => { const t = document.querySelector('#hcaptcha-slot textarea[name="h-captcha-response"]'); if (t) t.value = 'DUMMY-NOT-A-TOKEN'; const o = window.plausible; window.__ev = []; window.plausible = function () { window.__ev.push([].slice.call(arguments)); return o && o.apply(this, arguments); }; });
    await page.locator('#submit-btn').click(); await page.waitForTimeout(1500);
    r.after = await state(page); r.posts = posts; r.events = await page.evaluate(() => window.__ev);
    await page.locator('#form-status').scrollIntoViewIfNeeded().catch(() => {}); await page.waitForTimeout(300); await page.screenshot({ path: `shots/contact/${tag}__${k}.png` });
    await ctx.close(); console.log('done', k);
  }
  // ---------- D. draft saving and ?package= ----------
  { const posts = []; const ctx = await ctxFor(b, 390, 844, 'light', 'abort', posts); const page = await ctx.newPage(); const r = out.draft = {};
    await page.goto(base + '/contact/', { waitUntil: 'load' }); await fill(page); await page.waitForTimeout(700);
    r.saved = (await state(page)).draft;
    await page.reload({ waitUntil: 'load' }); r.afterReload = (await state(page)).values;
    const p2 = await ctx.newPage(); await p2.goto(base + '/contact/', { waitUntil: 'load' }); r.otherTab = (await state(p2)).values; await p2.close();
    // every value linked anywhere on the site, plus every option the select offers, plus junk
    const values = ['advisor', 'audit', 'bundle', 'check', 'partner', 'onepage', 'business', 'care', 'commerce', 'starter', 'brand', 'gbp', 'strategy', 'textback', 'booking', 'followup', 'automation', 'nonsense', 'Business', '"><x'];
    r.withDraft = {}; for (const v of values) { await page.goto(base + '/contact/?package=' + encodeURIComponent(v), { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(150); r.withDraft[v] = await page.evaluate(() => { const s = document.getElementById('package'); return s.value + ' | ' + s.selectedOptions[0].text; }); }
    await page.evaluate(() => localStorage.removeItem('kws-enquiry-draft'));
    r.noDraft = {}; for (const v of values) { await page.goto(base + '/contact/?package=' + encodeURIComponent(v), { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(150); r.noDraft[v] = await page.evaluate(() => { const s = document.getElementById('package'); return s.value + ' | ' + s.selectedOptions[0].text; }); }
    r.posts = posts.length; await ctx.close(); console.log('done draft'); }
  fs.writeFileSync(`contact2-${tag}.json`, JSON.stringify(out, null, 1));
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
