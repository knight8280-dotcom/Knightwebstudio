// With Georgia/Arial stand-ins installed (as on iOS, macOS, Windows): how far does the first screen move when the web fonts swap in?
// Pass A: web fonts never arrive (the fallback layout a visitor sees first). Pass B: web fonts loaded.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const BASE = (process.argv.find(a => a.startsWith('--base=')) || '--base=http://localhost:8720').slice(7);
const ADJ = (process.argv.find(a => a.startsWith('--adjust=')) || '').slice(9);
const TAG = (process.argv.find(a => a.startsWith('--tag=')) || '--tag=new').slice(6);
const PAGES = ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/web-design-denham-springs/', '/web-design-gonzales/', '/web-design-prairieville/', '/privacy/', '/terms/', '/checkout/', '/checkout/success/', '/404.html'];
const WIDTHS = [[360, 740], [375, 667], [390, 844], [393, 852], [412, 915], [430, 932], [768, 1024], [1280, 800], [1440, 900], [1920, 1080]];
(async () => {
  const browser = await chromium.launch({ env: { ...process.env, FONTCONFIG_FILE: __dirname + '/simfonts/fonts.conf' } });
  const measure = async (ctx, p, vh) => {
    const page = await ctx.newPage();
    await page.goto(BASE + p, { waitUntil: 'load' });
    await page.waitForTimeout(900);
    const r = await page.evaluate((vh) => {
      const h1 = document.querySelector('h1');
      const top = el => { let y = 0; for (let e = el; e; e = e.offsetParent) y += e.offsetTop; return y; };
      const items = [];
      document.querySelectorAll('main h1, main h2, main p, main .btn-row, main .price-strip, main figure, main section, main li, main .card, .cta-band, footer').forEach((el, i) => { const y = top(el); if (el.offsetParent !== null) items.push([i, y, el.offsetHeight, (el.tagName + '.' + (typeof el.className === 'string' ? el.className.split(' ')[0] : '')).toLowerCase(), el.textContent.trim().replace(/\s+/g, ' ').slice(0, 30)]); });
      return { h1h: h1 ? h1.offsetHeight : 0, h1lh: h1 ? parseFloat(getComputedStyle(h1).lineHeight) : 0, h1font: h1 ? getComputedStyle(h1).fontSize : '', docH: document.documentElement.scrollHeight, items, fontsOk: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).join(',') };
    }, vh);
    await page.close();
    return r;
  };
  const rows = [];
  for (const [vw, vh] of WIDTHS) {
    const mk = async block => { const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, isMobile: vw < 500, hasTouch: vw < 500 }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort()); if (block) await ctx.route(/\.woff2/, r => r.abort());
      if (ADJ) await ctx.route('**/assets/css/styles.css', r => { let css = fs.readFileSync('/home/user/Knightwebstudio/assets/css/styles.css', 'utf8'); const from = 'src: local("Georgia"), local("Noto Serif"); size-adjust: 101%; ascent-override: 97%; descent-override: 25%;'; if (!css.includes(from)) throw new Error('rule not found'); css = css.replace(from, 'src: local("Georgia"); size-adjust: ' + ADJ + '%; ascent-override: 89%; descent-override: 23%;'); r.fulfill({ status: 200, contentType: 'text/css', body: css }); });
      return ctx; };
    const A = await mk(true), B = await mk(false);
    for (const p of PAGES) {
      const a = await measure(A, p, vh), b = await measure(B, p, vh);
      // biggest move among things that START in the first screen (fallback layout)
      const bm = new Map(b.items.map(i => [i[0], i]));
      let worst = null;
      for (const it of a.items) { const o = bm.get(it[0]); if (!o) continue; if (it[1] < vh) { const d = o[1] - it[1]; if (!worst || Math.abs(d) > Math.abs(worst.d)) worst = { d, what: it[3] + ' "' + it[4] + '"', from: it[1], to: o[1] }; } }
      const row = { p, vw, h1A: a.h1h, h1B: b.h1h, h1lines: [Math.round(a.h1h / a.h1lh), Math.round(b.h1h / b.h1lh)], docA: a.docH, docB: b.docH, worst };
      rows.push(row);
      if (a.h1h !== b.h1h || (worst && Math.abs(worst.d) >= 8)) console.log(`${(p + '@' + vw).padEnd(36)} h1 ${a.h1h}→${b.h1h}px (${row.h1lines[0]}→${row.h1lines[1]} lines)  doc ${a.docH}→${b.docH}  first-screen max move ${worst ? worst.d + 'px ' + worst.what : '-'}`);
    }
    await A.close(); await B.close();
  }
  fs.writeFileSync(__dirname + `/fontswap-${TAG}.json`, JSON.stringify(rows, null, 1));
  const bad = rows.filter(r => r.worst && Math.abs(r.worst.d) >= 8);
  console.log(`\n${TAG}: ${bad.length} of ${rows.length} page×width cases move the first screen by 8px or more; ${rows.filter(r => r.h1A !== r.h1B).length} change the h1's height`);
  await browser.close();
})();
