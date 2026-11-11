const { webkit } = require(process.env.PWCORE || '/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await webkit.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  let posted = null; await ctx.route('https://api.web3forms.com/submit', r => { posted = r.request().postData() || '(body)'; r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ success: true }) }); });
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/contact/'); await p.waitForTimeout(800);
  await p.click('#submit-btn'); await p.waitForTimeout(500);
  console.log('ring on first bad field:', JSON.stringify(await p.evaluate(() => { const cs = getComputedStyle(document.activeElement); return [document.activeElement.id, cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.borderTopColor]; })));
  await p.fill('#name', 'Test Person'); await p.fill('#email', 'bad'); await p.evaluate(() => document.getElementById('email').blur()); await p.waitForTimeout(100);
  console.log('email error:', await p.textContent('#email-error'));
  await p.fill('#email', 'test@example.com'); await p.fill('#message', 'A test enquiry with enough detail.'); await p.waitForTimeout(600);
  console.log('draft:', await p.evaluate(() => localStorage.getItem('kws-enquiry-draft')));
  await p.click('#submit-btn'); await p.waitForTimeout(1200);
  console.log('after send:', JSON.stringify(await p.evaluate(() => ({ status: document.getElementById('form-status').textContent, cls: document.getElementById('form-status').className, name: document.getElementById('name').value, draft: localStorage.getItem('kws-enquiry-draft') }))), 'posted:', posted ? 'yes' : 'no');
  await b.close();
})();
