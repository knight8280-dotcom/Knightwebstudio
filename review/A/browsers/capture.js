// Full-page capture + DOM metrics in a chosen engine.
// ENGINE=webkit node capture.js --out DIR [--pages /,/pricing/] [--modes mobile-light,...]
const pw = require(process.env.PWCORE || '/opt/node-tools/node_modules/playwright');
const downlevel = require('./downlevel.js');
const fs = require('fs'); const path = require('path');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const engine = process.env.ENGINE || 'chromium'; const label = process.env.LABEL || engine;
const base = arg('base', 'http://localhost:8720');
const ALL = '/,/services/,/consulting/,/work/,/process/,/pricing/,/faq/,/contact/,/about/,/start/,/web-design-baton-rouge/,/web-design-denham-springs/,/web-design-gonzales/,/web-design-prairieville/,/privacy/,/terms/,/checkout/,/checkout/success/,/404.html';
const pages = arg('pages', ALL).split(',');
const modes = arg('modes', 'mobile-light,mobile-dark,desktop-light,desktop-dark').split(',');
const out = arg('out'); fs.mkdirSync(out, { recursive: true });
const slug = p => (p.replace(/^\/|\/$/g, '').replace(/[\/?=&#.]/g, '_') || 'home');
(async () => {
  const b = await pw[engine].launch();
  const report = {};
  for (const mode of modes) {
    const [dev, theme] = mode.split('-');
    const vp = dev === 'mobile' ? { width: 390, height: 844 } : { width: 1280, height: 800 };
    const opts = { viewport: vp, deviceScaleFactor: 1, colorScheme: theme, hasTouch: dev === 'mobile' };
    if (dev === 'mobile' && engine !== 'firefox') opts.isMobile = true;
    const ctx = await b.newContext(opts);
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    if (process.env.DOWNLEVEL) await ctx.route(/\/assets\/css\/styles\.css/, r => r.fulfill({ status: 200, contentType: 'text/css', body: downlevel(fs.readFileSync('/home/user/Knightwebstudio/assets/css/styles.css', 'utf8'), process.env.DOWNLEVEL) }));
    for (const p of pages) {
      const page = await ctx.newPage(); const errors = [], failed = [];
      page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
      page.on('pageerror', e => errors.push('pageerror: ' + String(e)));
      page.on('requestfailed', r => { const u = r.url(); if (!/plausible|hcaptcha|calendly|stripe|onrender/.test(u)) failed.push(u); });
      page.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });
      const key = `${slug(p)}__${mode}`;
      try { await page.goto(base + p, { waitUntil: 'load', timeout: 30000 }); } catch (e) { report[key] = { error: String(e) }; await page.close(); continue; }
      await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(500);
      // The two oldest Linux WebKit builds do not map font-weight to the wght axis (Apple's ports always have): write it explicitly
      if (process.env.FIXWGHT) await page.evaluate(() => { const jobs = [];
        for (const el of document.querySelectorAll('body, body *')) { if (el.ownerSVGElement && el.tagName !== 'text') continue; const cs = getComputedStyle(el); jobs.push([el, '"wght" ' + cs.fontWeight + (/SOFT.? 100/.test(cs.fontVariationSettings) ? ', "SOFT" 100' : '')]); }
        for (const [el, v] of jobs) el.style.setProperty('font-variation-settings', v, 'important'); });
      if (process.env.FIXWGHT) await page.waitForTimeout(300);
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < h; y += Math.round(vp.height * 0.8)) { await page.evaluate(yy => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, yy); }, y); await page.waitForTimeout(150); }
      await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(900);
      const data = await page.evaluate(() => {
        const sel = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).filter(c => !/^(visible|scrolled|show|open|play|nav-anim)$/.test(c)).join('.') : '');
        const els = []; let i = 0;
        for (const el of document.querySelectorAll('body *')) {
          if (el.ownerSVGElement || /^(script|style|br|wbr|option|noscript)$/i.test(el.tagName)) continue;
          const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
          els.push({ i: i++, s: sel(el), p: el.parentElement ? sel(el.parentElement) : '', x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, d: cs.display, v: cs.visibility, o: cs.opacity, pos: cs.position,
            c: cs.color, bg: cs.backgroundColor, ff: cs.fontFamily.split(',')[0].replace(/["']/g, ''), fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, bc: cs.borderTopColor, t: (el.childElementCount === 0 ? el.textContent.trim().slice(0, 40) : '') });
        }
        const fonts = [...document.fonts].map(f => f.family + ' ' + f.weight + ' ' + f.style + ' ' + f.status);
        const probe = (fam) => { const s = document.createElement('span'); s.textContent = 'Hamburgefonstiv 0123456789 $1,500'; s.style.cssText = 'position:absolute;left:-9999px;top:0;font-size:40px;white-space:nowrap;font-family:' + fam; document.body.appendChild(s); const w = s.getBoundingClientRect().width; s.remove(); return Math.round(w * 10) / 10; };
        return { els, fonts, probe: { fraunces: probe('"Fraunces", serif'), frauncesAlt: probe('"Fraunces Soft", serif'), figtree: probe('"Figtree", sans-serif'), serif: probe('serif'), sans: probe('sans-serif'), bodyFam: getComputedStyle(document.body).fontFamily, h1Fam: (document.querySelector('h1') ? getComputedStyle(document.querySelector('h1')).fontFamily : '') },
          height: document.documentElement.scrollHeight, overflowX: document.documentElement.scrollWidth - innerWidth, theme: document.documentElement.getAttribute('data-theme'), bodyBg: getComputedStyle(document.body).backgroundColor, unrevealed: [...document.querySelectorAll('.reveal:not(.visible)')].length };
      });
      await page.screenshot({ path: path.join(out, key + '.png'), fullPage: true });
      fs.writeFileSync(path.join(out, key + '.json'), JSON.stringify(data));
      report[key] = { height: data.height, overflowX: data.overflowX, theme: data.theme, bodyBg: data.bodyBg, unrevealed: data.unrevealed, fonts: data.fonts, probe: data.probe, errors, failed: [...new Set(failed)] };
      console.log(label, key, data.height, data.overflowX, errors.length ? errors.join(' | ').slice(0, 300) : '');
      await page.close();
    }
    await ctx.close();
  }
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1));
  await b.close();
})();
