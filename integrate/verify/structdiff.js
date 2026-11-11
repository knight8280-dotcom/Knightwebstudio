// Element-by-element comparison of two copies of the site: boxes and computed styles, lazy pictures loaded first.
const { chromium } = require('playwright');
const fs = require('fs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const A = 'http://localhost:8722', B = 'http://localhost:8720';
const ALL = '/,/services/,/consulting/,/work/,/process/,/pricing/,/faq/,/contact/,/about/,/start/,/web-design-baton-rouge/,/web-design-denham-springs/,/web-design-gonzales/,/web-design-prairieville/,/privacy/,/terms/,/checkout/,/checkout/success/,/404.html';
const paths = arg('paths', ALL).split(',');
const widths = arg('widths', '390,820,1440').split(',').map(Number);
const themes = arg('themes', 'light,dark').split(',');
const out = arg('out', __dirname + '/struct.json');
const collect = () => {
  const PROPS = ['color','backgroundColor','backgroundImage','fontSize','fontWeight','fontFamily','lineHeight','letterSpacing','wordSpacing','display','visibility','opacity','borderTopColor','borderTopWidth','borderTopStyle','borderBottomWidth','borderBottomColor','borderLeftWidth','borderLeftColor','borderRadius','boxShadow','textTransform','textDecorationLine','textAlign','maxWidth','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginBottom','marginLeft','position','transform','rotate','translate','rowGap','columnGap','gridTemplateColumns','flexDirection','flexWrap','alignItems','justifyContent','whiteSpace','textWrap','overflowWrap','order','float','fill','stroke','zIndex','columnCount','animationName','gridColumnStart','gridRowStart','justifySelf','alignSelf','outlineStyle','minHeight'];
  const PP = ['content','display','position','width','height','backgroundColor','backgroundImage','borderTopColor','borderTopWidth','opacity','transform','top','left','right','bottom','zIndex','color','animationName'];
  const res = [];
  const pathOf = el => { const parts = []; let e = el; while (e && e !== document.body) { let i = 1, s = e; while ((s = s.previousElementSibling)) if (s.tagName === e.tagName) i++; parts.unshift(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + ':' + i); e = e.parentElement; } return parts.join('>'); };
  const walk = el => {
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') return;   // art internals: one box per svg
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').replace(/\s+/g, ' ').trim().slice(0, 80);
    const st = {}; for (const p of PROPS) st[p] = cs[p];
    const ps = {};
    for (const pe of ['::before', '::after']) { const c = getComputedStyle(el, pe); if (c.content && c.content !== 'none' && c.content !== 'normal') { ps[pe] = {}; for (const p of PP) ps[pe][p] = c[p]; } }
    let sec = el.closest('section, header.site-header, footer, .topbar, .mobile-cta'); const sr = sec ? sec.getBoundingClientRect() : { top: 0, left: 0 };
    res.push({ path: pathOf(el), tag: el.tagName.toLowerCase(), cls: (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).sort().join('.'), pcls: el.parentElement ? (el.parentElement.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).sort().join('.') : '', text: own,
      x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, ry: Math.round(r.top - sr.top), st, ps, hid: cs.display === 'none' });
    if (cs.display === 'none') return;
    for (const c of el.children) walk(c);
  };
  for (const c of document.body.children) if (!['SCRIPT','NOSCRIPT','STYLE'].includes(c.tagName)) walk(c);
  return { els: res, H: document.documentElement.scrollHeight, W: document.documentElement.scrollWidth };
};
(async () => {
  const browser = await chromium.launch();
  const report = {};
  for (const theme of themes) for (const w of widths) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 700 ? 844 : 900 }, deviceScaleFactor: 1, colorScheme: theme, reducedMotion: 'reduce' });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    for (const p of paths) {
      const key = `${p}|${w}|${theme}`; const got = {};
      for (const [name, base] of [['a', A], ['b', B]]) {
        const page = await ctx.newPage();
        await page.goto(base + p, { waitUntil: 'load', timeout: 30000 });
        await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => { i.loading = 'eager'; return i.decode().catch(() => {}); })); });
        await page.waitForTimeout(350);
        got[name] = await page.evaluate(collect);
        await page.close();
      }
      report[key] = got;
    }
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(out, JSON.stringify(report));
  console.log('collected', Object.keys(report).length);
})();
