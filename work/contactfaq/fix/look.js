const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8720';
const OUT = __dirname + '/look/';
(async () => {
  const b = await chromium.launch();
  const mk = async (w, h, theme, path, opts = {}) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme, isMobile: w < 700, hasTouch: w < 700, deviceScaleFactor: opts.dsf || 1, javaScriptEnabled: !opts.nojs, reducedMotion: opts.rm ? 'reduce' : 'no-preference' });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto(base + path, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
    return [ctx, p];
  };
  const widget = p => p.evaluate(() => { const s = document.getElementById('hcaptcha-slot'); if (s.querySelector('iframe')) return; const f = document.createElement('iframe'); f.setAttribute('style', 'width:303px;height:78px;overflow:hidden;border:1px solid #e0e0e0;background:#fafafa;border-radius:4px'); f.srcdoc = '<body style="margin:0;font:14px sans-serif;display:flex;align-items:center;height:76px;padding-left:14px;gap:12px"><span style="width:28px;height:28px;border:1px solid #999;border-radius:4px;display:inline-block"></span>I am human</body>'; s.appendChild(f); });
  // contact, foot of the ticket + side, phones
  for (const [w, theme] of [[360, 'light'], [390, 'light'], [390, 'dark'], [430, 'light']]) {
    const [ctx, p] = await mk(w, 844, theme, '/contact/', { dsf: 2 });
    await widget(p);
    const y = await p.evaluate(() => document.getElementById('message').getBoundingClientRect().top + scrollY - 120);
    await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(1200);
    await p.screenshot({ path: OUT + `c-foot-${w}-${theme}.png` });
    await p.evaluate(y => scrollTo(0, y + 700), y); await p.waitForTimeout(600);
    await p.screenshot({ path: OUT + `c-side-${w}-${theme}.png` });
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
    await p.screenshot({ path: OUT + `c-top-${w}-${theme}.png` });
    await ctx.close();
  }
  // contact mid widths
  for (const [w, h] of [[600, 900], [700, 900], [980, 800], [1024, 768], [1100, 800], [1280, 800], [1440, 900]]) {
    const [ctx, p] = await mk(w, h, 'light', '/contact/?package=followup');
    await widget(p);
    await p.fill('#email', 'dale@boudreauxroofingbr.com');
    await p.screenshot({ path: OUT + `c-full-${w}.png`, fullPage: true });
    await ctx.close();
  }
  // faq tops
  for (const [w, h] of [[360, 740], [390, 844], [600, 900], [700, 900], [760, 900], [820, 1000], [980, 800], [1280, 800]]) {
    const [ctx, p] = await mk(w, h, 'light', '/faq/', { dsf: w < 700 ? 2 : 1 });
    await p.screenshot({ path: OUT + `f-top-${w}.png` });
    await ctx.close();
  }
  await b.close();
})();
