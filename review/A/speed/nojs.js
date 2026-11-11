// JavaScript off on all 19 pages at 390 and 1280: what is invisible, faded, clipped, or a dead control?
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'); const path = require('path');
const PAGES = ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/web-design-denham-springs/', '/web-design-gonzales/', '/web-design-prairieville/', '/privacy/', '/terms/', '/checkout/', '/checkout/success/', '/404.html'];
const slug = p => (p.replace(/^\/|\/$/g, '').replace(/[\/?=&#.]/g, '_') || 'home');
const OUT = path.join(__dirname, 'nojs'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const report = {};
  for (const [vw, vh] of [[390, 844], [1280, 800]]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, javaScriptEnabled: false, isMobile: vw < 500, hasTouch: vw < 500 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    for (const p of PAGES) {
      const page = await ctx.newPage();
      await page.goto('http://localhost:8720' + p, { waitUntil: 'load' });
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        const vis = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
        const effOpacity = el => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; };
        const desc = el => (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '')).slice(0, 80);
        const out = { htmlClass: document.documentElement.className, faded: [], hiddenText: [], buttons: [], deadLinks: [], forms: [], clipped: [], noscript: [], offscreen: [] };
        const seen = new Set();
        const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (tw.nextNode()) {
          const t = tw.currentNode; if (!t.nodeValue.trim()) continue;
          const el = t.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
          if (el.closest('script,style,template,svg')) continue;
          if (el.closest('noscript')) continue;
          const cs = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const disp = (() => { for (let e = el; e; e = e.parentElement) { if (getComputedStyle(e).display === 'none') return e; } return null; })();
          if (disp) { if (!disp.hidden && !disp.closest('[hidden]') && !/sr-only|visually-hidden/.test(disp.className)) out.hiddenText.push(desc(disp) + ' :: ' + t.nodeValue.trim().slice(0, 50)); continue; }
          if (cs.visibility === 'hidden') { out.hiddenText.push('VISHIDDEN ' + desc(el) + ' :: ' + t.nodeValue.trim().slice(0, 50)); continue; }
          const o = effOpacity(el);
          if (o < 0.95) out.faded.push(o.toFixed(2) + ' ' + desc(el) + ' :: ' + t.nodeValue.trim().slice(0, 50));
          if (rect.width > 2 && (rect.right < 0 || rect.left > innerWidth + 2) && !/sr-only|skip-link/.test(el.className + (el.parentElement ? el.parentElement.className : ''))) out.offscreen.push(desc(el) + ' :: ' + t.nodeValue.trim().slice(0, 40));
        }
        // transforms left by reveal
        out.transformed = [...document.querySelectorAll('.reveal, .reveal .seq')].filter(e => { const cs = getComputedStyle(e); return cs.opacity !== '1' || (cs.transform !== 'none' && !/tilt|print|stamp/.test(e.className)); }).map(desc).slice(0, 10);
        document.querySelectorAll('button, [role=button], input[type=button], summary').forEach(b => { if (!vis(b)) return; const f = b.closest('form'); out.buttons.push(desc(b) + ' type=' + (b.getAttribute('type') || '') + ' inForm=' + !!f + ' disabled=' + !!b.disabled + ' text=' + (b.textContent.trim().slice(0, 30) || b.getAttribute('aria-label'))); });
        document.querySelectorAll('a').forEach(a => { if (!vis(a)) return; const h = a.getAttribute('href'); if (!h || h === '#' || /^javascript:/.test(h)) out.deadLinks.push(desc(a) + ' href=' + h + ' text=' + a.textContent.trim().slice(0, 30)); });
        out.booking = [...document.querySelectorAll('[data-booking]')].map(a => a.getAttribute('href') + (vis(a) ? '' : ' (not visible)')).filter((v, i, a) => a.indexOf(v) === i);
        out.bookingOnly = [...document.querySelectorAll('.booking-only')].map(e => desc(e) + ' hidden=' + e.hidden + ' vis=' + vis(e));
        document.querySelectorAll('form').forEach(f => out.forms.push({ action: f.getAttribute('action'), method: f.getAttribute('method'), fields: [...f.elements].map(e => (e.name || e.id || e.type) + (vis(e) || e.type === 'hidden' ? '' : '(notvis)')).join(','), submit: [...f.querySelectorAll('[type=submit],button:not([type])')].map(b => b.textContent.trim() + (vis(b) ? '' : '(notvis)')).join('|') }));
        document.querySelectorAll('noscript').forEach(n => out.noscript.push(n.textContent.trim().replace(/\s+/g, ' ').slice(0, 200) + ' [vis=' + vis(n) + ' h=' + Math.round(n.getBoundingClientRect().height) + ']'));
        const nav = document.getElementById('nav');
        out.nav = nav ? { vis: vis(nav), links: [...nav.querySelectorAll('a')].filter(vis).map(a => a.textContent.trim().replace(/\s+/g, ' ') + '→' + a.getAttribute('href')), rect: (() => { const r = nav.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })() } : null;
        out.navLinkHeights = nav ? [...nav.querySelectorAll('a')].filter(vis).map(a => Math.round(a.getBoundingClientRect().height)) : [];
        out.mobileCta = (() => { const m = document.getElementById('mobile-cta'); return m ? { hidden: m.hidden, vis: vis(m) } : null; })();
        out.themeToggle = (() => { const m = document.getElementById('theme-toggle'); return m ? vis(m) : null; })();
        out.navToggle = (() => { const m = document.getElementById('nav-toggle'); return m ? vis(m) : null; })();
        out.calc = ['r-month', 'r-year', 'r-jobs', 'r-calls', 'r-quotes', 'r-hours', 'r-timeval', 'r-payback'].map(id => { const e = document.getElementById(id); return e ? id + '=' + e.textContent.trim() + (vis(e) ? '' : '(notvis)') : null; }).filter(Boolean);
        out.year = (document.getElementById('year') || {}).textContent;
        out.overflowX = document.documentElement.scrollWidth - innerWidth;
        out.height = document.documentElement.scrollHeight;
        out.details = [...document.querySelectorAll('details')].length;
        out.imgs = [...document.images].map(i => i.getAttribute('src').split('/').pop() + ' complete=' + i.complete + ' nat=' + i.naturalWidth);
        out.checkoutStatus = (() => { const e = document.getElementById('checkout-status'); return e ? { hidden: e.hidden, vis: vis(e), text: e.textContent.trim().slice(0, 80) } : null; })();
        return out;
      });
      report[`${slug(p)}@${vw}`] = r;
      await page.screenshot({ path: path.join(OUT, `${slug(p)}@${vw}.png`), fullPage: true });
      await page.close();
    }
    await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
  for (const k in report) { const r = report[k]; console.log(`\n== ${k} class="${r.htmlClass}" h=${r.height} ovf=${r.overflowX} faded=${r.faded.length} hiddenText=${r.hiddenText.length} transformed=${r.transformed.length} offscreen=${r.offscreen.length} deadLinks=${r.deadLinks.length} themeToggleVis=${r.themeToggle} navToggleVis=${r.navToggle} mobileCta=${JSON.stringify(r.mobileCta)}`);
    if (r.faded.length) console.log('  FADED', r.faded.slice(0, 6));
    if (r.hiddenText.length) console.log('  HIDDEN', r.hiddenText.slice(0, 12));
    if (r.transformed.length) console.log('  TRANSFORMED', r.transformed);
    if (r.offscreen.length) console.log('  OFFSCREEN', r.offscreen.slice(0, 6));
    if (r.buttons.length) console.log('  BUTTONS', r.buttons.filter(b => !/^summary/.test(b)));
    if (r.deadLinks.length) console.log('  DEADLINKS', r.deadLinks);
    console.log('  nav', JSON.stringify(r.nav), r.navLinkHeights.join(','));
    console.log('  booking', r.booking, r.bookingOnly);
    if (r.forms.length) console.log('  forms', JSON.stringify(r.forms));
    if (r.noscript.length) console.log('  noscript', r.noscript);
    if (r.calc.length) console.log('  calc', r.calc.join(' '));
    if (r.checkoutStatus) console.log('  checkoutStatus', JSON.stringify(r.checkoutStatus));
    console.log('  year', r.year, 'imgs', r.imgs.join('; '));
  }
  await browser.close();
})();
