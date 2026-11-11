const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8720';
let failed = 0;
const ok = (name, cond, extra) => { console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (extra === undefined ? '' : '   ' + JSON.stringify(extra))); if (!cond) failed++; };
const OUT = __dirname + '/states'; require('fs').mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch();
  for (const [w, h, mobile] of [[390, 844, true], [1440, 900, false]]) {
    for (const scheme of ['light', 'dark']) {
      const tag = `${w}-${scheme}`;
      const errors = [];
      const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, colorScheme: scheme });
      await ctx.route(/plausible\.io|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      // stub hCaptcha: inject an iframe 303x78 and a response textarea like the real widget does
      let capMode = 'abort';
      await ctx.route(/hcaptcha\.com/, r => {
        if (capMode === 'abort') return r.abort();
        r.fulfill({ status: 200, contentType: 'application/javascript', body: `
          (function(){ var s=document.getElementById('hcaptcha-slot'); if(!s||s.querySelector('iframe')) return;
            var f=document.createElement('iframe'); f.style.cssText='width:303px;height:78px;border:0;background:#fafafa;'; f.title='Widget containing checkbox for hCaptcha security challenge'; s.appendChild(f);
            var t=document.createElement('textarea'); t.name='h-captcha-response'; t.style.display='none'; s.appendChild(t);
            window.hcaptcha={reset:function(){t.value='';}}; })();` });
      });
      let postMode = 'ok', posted = null, postDelay = 0;
      await ctx.route('https://api.web3forms.com/submit', async r => {
        posted = r.request().postData() || '';
        if (postDelay) await new Promise(z => setTimeout(z, postDelay));
        if (postMode === 'ok') return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ success: true }) });
        if (postMode === 'reject') return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ success: false, message: 'Invalid access key' }) });
        return r.abort();
      });
      const p = await ctx.newPage();
      p.on('pageerror', e => errors.push('pageerror ' + e)); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load resource|ERR_ABORTED|mailto/.test(m.text())) errors.push(m.text()); });
      await p.goto(base + '/contact/'); await p.waitForTimeout(400);
      // booking
      const bk = await p.evaluate(() => [...document.querySelectorAll('[data-booking]')].map(a => [a.textContent.trim(), a.href, a.target, a.rel, a.hidden, !!a.offsetParent]));
      ok(`[${tag}] booking buttons point to calendar, visible`, bk.every(x => x[1] === 'https://calendly.com/knightwebstudio1/30min' && x[2] === '_blank' && x[3] === 'noopener' && !x[4]), bk);
      ok(`[${tag}] no #mobile-cta on contact`, await p.evaluate(() => !document.getElementById('mobile-cta')));
      ok(`[${tag}] hcaptcha slot present, in captcha-wrap, sitekey intact`, await p.evaluate(() => { const s = document.getElementById('hcaptcha-slot'); return !!s && s.classList.contains('h-captcha') && s.dataset.sitekey === '50b2fe65-b00b-4b9e-ad62-3ba471098be2' && !!s.closest('.captcha-wrap'); }));
      // empty submit
      await p.locator('#submit-btn').scrollIntoViewIfNeeded(); await p.click('#submit-btn'); await p.waitForTimeout(400);
      const st = await p.evaluate(() => ({ status: document.getElementById('form-status').textContent, cls: document.getElementById('form-status').className, fields: ['name', 'email', 'message'].map(id => { const f = document.getElementById(id); return [id, f.classList.contains('invalid'), f.getAttribute('aria-invalid'), document.getElementById(id + '-error').textContent, getComputedStyle(f).borderTopColor, getComputedStyle(f).borderTopWidth, getComputedStyle(document.getElementById(id + '-error')).color, getComputedStyle(document.getElementById(id + '-error')).fontSize, getComputedStyle(document.getElementById(id + '-error')).fontWeight]; }), active: document.activeElement.id, activeTop: Math.round(document.activeElement.getBoundingClientRect().top), statusVisible: (() => { const r = document.getElementById('form-status').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })() }));
      ok(`[${tag}] empty submit: three errors, status error, focus to name`, st.cls === 'form-status error' && st.fields.every(f => f[1] && f[2] === 'true' && f[3]) && st.active === 'name', st);
      await p.screenshot({ path: `${OUT}/${tag}-1-empty-submit-viewport.png` });
      await p.locator('#contact-form').screenshot({ path: `${OUT}/${tag}-1-empty-submit-form.png` });
      // bad email, short message
      await p.fill('#name', 'Sam'); await p.fill('#email', 'sam@'); await p.fill('#message', 'short'); await p.locator('#company').focus(); await p.waitForTimeout(100);
      const st2 = await p.evaluate(() => ['name', 'email', 'message'].map(id => [id, document.getElementById(id).classList.contains('invalid'), document.getElementById(id + '-error').textContent]));
      ok(`[${tag}] bad email + short message messages`, !st2[0][1] && st2[1][2].includes('valid email') && st2[2][2].includes('10 characters'), st2);
      const stale = await p.evaluate(() => document.getElementById('form-status').textContent);
      await p.fill('#email', 'sam@example.com'); await p.fill('#message', 'We need a new website for our plumbing business.');
      await p.waitForTimeout(100);
      const stale2 = await p.evaluate(() => ({ t: document.getElementById('form-status').textContent, invalid: document.querySelectorAll('.invalid').length }));
      console.log(`INFO  [${tag}] status after all fields fixed:`, JSON.stringify(stale2));
      // chips + select + draft
      await p.selectOption('#package', 'gbp'); await p.check('input[name="services"][value="Automation"]', { force: true }); await p.fill('#company', 'Test Co');
      await p.waitForTimeout(700);
      const draft = await p.evaluate(() => localStorage.getItem('kws-enquiry-draft'));
      ok(`[${tag}] draft saved`, !!draft && JSON.parse(draft).name === 'Sam' && JSON.parse(draft).services[0] === 'Automation', draft);
      await p.locator('#contact-form').screenshot({ path: `${OUT}/${tag}-2-filled-form.png` });
      await p.reload(); await p.waitForTimeout(400);
      const restored = await p.evaluate(() => ({ n: document.getElementById('name').value, e: document.getElementById('email').value, c: document.getElementById('company').value, p: document.getElementById('package').value, m: document.getElementById('message').value, s: [...document.querySelectorAll('input[name=services]:checked')].map(c => c.value) }));
      ok(`[${tag}] draft restored after reload`, restored.n === 'Sam' && restored.e === 'sam@example.com' && restored.c === 'Test Co' && restored.p === 'gbp' && restored.s.join() === 'Automation', restored);
      // ?package= overrides draft
      await p.goto(base + '/contact/?package=business'); await p.waitForTimeout(300);
      ok(`[${tag}] ?package=business preselects over draft`, await p.inputValue('#package') === 'business');
      // captcha present but unsolved
      capMode = 'stub';
      await p.goto(base + '/contact/'); await p.waitForTimeout(300); await p.locator('#name').focus(); await p.waitForTimeout(600);
      const cap = await p.evaluate(() => { const f = document.querySelector('#hcaptcha-slot iframe'); if (!f) return null; const r = f.getBoundingClientRect(), form = document.getElementById('contact-form').getBoundingClientRect(), cs = getComputedStyle(document.getElementById('contact-form')); return { w: Math.round(r.width), left: Math.round(r.left), right: Math.round(r.right), formInnerRight: Math.round(form.right - parseFloat(cs.paddingRight)), formRight: Math.round(form.right), vw: innerWidth }; });
      ok(`[${tag}] captcha widget (303px stub) fits inside the form`, cap && cap.right <= cap.formInnerRight + 1, cap);
      await p.locator('#submit-btn').scrollIntoViewIfNeeded(); await p.click('#submit-btn'); await p.waitForTimeout(500);
      const capErr = await p.evaluate(() => { const e = document.getElementById('captcha-error'); const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { t: e.textContent, color: cs.color, size: cs.fontSize, vis: r.top >= 0 && r.bottom <= innerHeight, status: document.getElementById('form-status').textContent, statusBox: (() => { const s = document.getElementById('form-status'); const c = getComputedStyle(s); const r2 = s.getBoundingClientRect(); return { h: Math.round(r2.height), bg: c.backgroundColor, display: c.display, pad: c.paddingTop, borderLeft: c.borderLeftWidth }; })() }; });
      ok(`[${tag}] unsolved captcha: message shown, in view`, capErr.t.includes('tick the verification box') && capErr.vis, capErr);
      await p.screenshot({ path: `${OUT}/${tag}-3-captcha-error-viewport.png` });
      // solve captcha, sending state
      await p.evaluate(() => { document.querySelector('[name="h-captcha-response"]').value = 'tok'; });
      postDelay = 1200; postMode = 'ok';
      await p.click('#submit-btn'); await p.waitForTimeout(300);
      const sending = await p.evaluate(() => { const b = document.getElementById('submit-btn'); const cs = getComputedStyle(b); return { t: b.textContent, dis: b.disabled, busy: b.getAttribute('aria-busy'), op: cs.opacity, cursor: cs.cursor, bg: cs.backgroundColor, color: cs.color }; });
      ok(`[${tag}] sending state`, sending.t === 'Sending…' && sending.dis && sending.busy === 'true', sending);
      await p.locator('#submit-btn').screenshot({ path: `${OUT}/${tag}-4-sending-btn.png` });
      await p.waitForTimeout(1500);
      const done = await p.evaluate(() => { const s = document.getElementById('form-status'); const r = s.getBoundingClientRect(); return { t: s.textContent, cls: s.className, vis: r.top >= 0 && r.bottom <= innerHeight, name: document.getElementById('name').value, draft: localStorage.getItem('kws-enquiry-draft'), btn: document.getElementById('submit-btn').textContent, focus: document.activeElement.id || document.activeElement.tagName }; });
      ok(`[${tag}] success: status ok, form reset, draft cleared`, done.cls === 'form-status ok' && done.t.includes('your enquiry is in') && done.name === '' && done.draft === null && done.btn === 'Send enquiry', done);
      ok(`[${tag}] posted body has all field names`, ['access_key', 'subject', 'from_name', 'name="name"', 'name="email"', 'name="company"', 'name="package"', 'name="services"', 'name="message"', 'h-captcha-response'].every(k => posted.includes(k)), posted && posted.length);
      await p.screenshot({ path: `${OUT}/${tag}-5-success-viewport.png` });
      await p.locator('#form-status').screenshot({ path: `${OUT}/${tag}-5-success-status.png` });
      // reject → fallback
      postDelay = 0; postMode = 'reject';
      await p.fill('#name', 'Sam'); await p.fill('#email', 'sam@example.com'); await p.fill('#message', 'We need a new website for our plumbing business.');
      await p.evaluate(() => { document.querySelector('[name="h-captcha-response"]').value = 'tok'; window.__nav = []; });
      await p.locator('#submit-btn').scrollIntoViewIfNeeded();
      const navs = []; p.on('framenavigated', f => navs.push(f.url())); p.on('requestfailed', r => navs.push('failed ' + r.url().slice(0, 60)));
      await p.click('#submit-btn'); await p.waitForTimeout(700);
      const fb = await p.evaluate(() => { const s = document.getElementById('form-status'); const r = s.getBoundingClientRect(); const cs = getComputedStyle(s); return { t: s.textContent, cls: s.className, vis: r.top >= 0 && r.bottom <= innerHeight, h: Math.round(r.height), w: Math.round(r.width), color: cs.color, bg: cs.backgroundColor, btn: document.getElementById('submit-btn').textContent, dis: document.getElementById('submit-btn').disabled, name: document.getElementById('name').value }; });
      ok(`[${tag}] rejected post: fallback message, fields kept, button reset`, fb.cls === 'form-status error' && fb.t.includes('Opening your email app') && fb.name === 'Sam' && !fb.dis && fb.btn === 'Send enquiry', fb);
      await p.screenshot({ path: `${OUT}/${tag}-6-fallback-viewport.png` });
      // network failure → fallback
      postMode = 'fail';
      await p.evaluate(() => { document.querySelector('[name="h-captcha-response"]').value = 'tok'; });
      await p.click('#submit-btn'); await p.waitForTimeout(700);
      const fb2 = await p.evaluate(() => document.getElementById('form-status').textContent);
      ok(`[${tag}] blocked endpoint: fallback message`, fb2.includes('Couldn’t send that') && fb2.includes('email app'), fb2);
      await p.locator('#contact-form').screenshot({ path: `${OUT}/${tag}-7-fallback-form.png` });
      ok(`[${tag}] no console errors`, errors.length === 0, errors);
      await ctx.close();
    }
  }
  // every ?package value used on the site
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort()); const p = await ctx.newPage();
    for (const v of ['onepage', 'starter', 'business', 'commerce', 'brand', 'care', 'check', 'audit', 'strategy', 'gbp', 'textback', 'booking', 'followup', 'automation', 'advisor', 'partner', 'bundle']) {
      await p.goto(base + '/contact/?package=' + v); const got = await p.inputValue('#package'); const txt = await p.evaluate(() => document.getElementById('package').selectedOptions[0].text);
      ok(`?package=${v}`, got === v, txt); }
    await p.goto(base + '/contact/?package=nonsense'); ok('?package=nonsense leaves default', await p.inputValue('#package') === '');
    await ctx.close(); }
  await b.close(); console.log(failed ? `${failed} FAILED` : 'all passed'); 
})();
