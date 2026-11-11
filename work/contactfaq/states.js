// node states.js [width] [theme] : drives the contact form through every state main.js produces and screenshots each
const { chromium } = require('playwright');
(async () => {
  const [w = '390', theme = 'light', base = 'http://localhost:8720'] = process.argv.slice(2);
  const b = await chromium.launch();
  const mk = async (mode) => {
    const ctx = await b.newContext({ viewport: { width: +w, height: 900 }, colorScheme: theme, isMobile: +w < 700, hasTouch: +w < 700, deviceScaleFactor: 2 });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    await ctx.route(/api\.web3forms\.com/, async r => {
      if (mode === 'ok') { await new Promise(s => setTimeout(s, 1200)); return r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }); }
      return r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":false,"message":"Invalid access key"}' });
    });
    const p = await ctx.newPage();
    await p.goto(base + '/contact/', { waitUntil: 'load' });
    await p.waitForTimeout(500);
    return [ctx, p];
  };
  const shot = (p, name) => p.locator('#contact-form').screenshot({ path: `shots/state-${name}-${w}-${theme}.png` });
  // 1 errors
  let [ctx, p] = await mk('ok');
  await p.fill('#email', 'sam@');
  await p.click('#submit-btn');
  await p.waitForTimeout(300);
  await shot(p, 'errors');
  // 2 filled + focus
  await p.fill('#name', 'Sam Example'); await p.fill('#email', 'sam@example.com'); await p.fill('#company', 'Your Business');
  await p.selectOption('#package', 'starter');
  await p.check('input[value="New website"]', { force: true }); await p.check('input[value="Google reviews"]', { force: true });
  await p.fill('#message', 'We fix roofs around Baton Rouge and need a simple site that gets us calls.');
  await p.focus('#message');
  await p.waitForTimeout(200);
  await shot(p, 'filled');
  // 3 sending
  await p.evaluate(() => { window.location.assign = () => {}; });
  await p.click('#submit-btn');
  await p.waitForTimeout(300);
  await shot(p, 'sending');
  await p.waitForTimeout(1500);
  await shot(p, 'ok');
  await ctx.close();
  // 4 fallback
  [ctx, p] = await mk('fail');
  await p.fill('#name', 'Sam Example'); await p.fill('#email', 'sam@example.com');
  await p.fill('#message', 'We fix roofs around Baton Rouge and need a simple site that gets us calls.');
  await p.route('mailto:**', r => r.abort());
  await p.click('#submit-btn').catch(() => {});
  await p.waitForTimeout(600);
  await shot(p, 'fallback').catch(e => console.log('fallback shot failed', e.message));
  await ctx.close();
  // 5 captcha present (simulated 303x78 box) at this width
  [ctx, p] = await mk('ok');
  await p.evaluate(() => { const s = document.getElementById('hcaptcha-slot'); s.innerHTML = '<iframe style="width:303px;height:78px;border:1px solid #999;background:#fafafa;display:block" title="sim"></iframe>'; });
  await p.fill('#name', 'Sam Example'); await p.fill('#email', 'sam@example.com');
  await p.fill('#message', 'We fix roofs around Baton Rouge and need a simple site that gets us calls.');
  await p.click('#submit-btn');
  await p.waitForTimeout(400);
  await shot(p, 'captcha');
  const o = await p.evaluate(() => { const f = document.querySelector('#hcaptcha-slot iframe').getBoundingClientRect(), t = document.getElementById('contact-form').getBoundingClientRect(); return { iframeRight: f.right, formRight: t.right, scrollW: document.documentElement.scrollWidth, innerW: innerWidth }; });
  console.log('captcha fit', JSON.stringify(o));
  await ctx.close();
  await b.close();
})();
