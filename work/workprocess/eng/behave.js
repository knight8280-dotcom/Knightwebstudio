const { chromium } = require('playwright');
const base = 'http://localhost:8720';
let failed = 0;
const ok = (name, cond, extra) => { console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (extra === undefined ? '' : '   ' + JSON.stringify(extra))); if (!cond) failed++; };
(async () => {
  const b = await chromium.launch();
  for (const path of ['/work/', '/process/']) {
    for (const [w, h, mobile] of [[390, 844, true], [1440, 900, false]]) {
      const errors = [], failedReq = [];
      const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, colorScheme: 'light' });
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      const p = await ctx.newPage();
      p.on('pageerror', e => errors.push(String(e)));
      p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load resource/.test(m.text())) errors.push(m.text()); });
      p.on('response', r => { if (r.status() >= 400) failedReq.push(r.status() + ' ' + r.url()); });
      const tag = `${path} @${w}: `;
      await p.goto(base + path, { waitUntil: 'load' }); await p.waitForTimeout(600);
      // booking
      const bk = await p.evaluate(() => [...document.querySelectorAll('[data-booking]')].map(a => [a.textContent.trim().replace(/\s+/g,' '), a.href, a.target, a.rel, !!a.closest('main')]));
      ok(tag + 'booking buttons all point at calendar, new tab, noopener', bk.length >= 3 && bk.every(x => x[1] === 'https://calendly.com/knightwebstudio1/30min' && x[2] === '_blank' && x[3] === 'noopener'), bk.map(x => x[0]));
      // onrender ping should not happen (no checkout links)
      ok(tag + 'no checkout links (no wake ping needed)', await p.evaluate(() => !document.querySelector('a[href^="/checkout/?plan="]')));
      // theme
      ok(tag + 'theme light default', await p.getAttribute('html', 'data-theme') === 'light');
      await p.click('#theme-toggle');
      ok(tag + 'theme toggles dark', await p.getAttribute('html', 'data-theme') === 'dark' && await p.evaluate(() => getComputedStyle(document.body).backgroundColor) === 'rgb(19, 23, 34)' && await p.getAttribute('#theme-toggle','aria-label') === 'Switch to light theme');
      await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(300);
      ok(tag + 'theme persists on reload', await p.getAttribute('html', 'data-theme') === 'dark');
      await p.click('#theme-toggle');
      ok(tag + 'theme back to light', await p.getAttribute('html', 'data-theme') === 'light');
      // aria-current
      const cur = await p.evaluate(() => [...document.querySelectorAll('#nav a[aria-current]')].map(a => a.getAttribute('href') + '=' + a.getAttribute('aria-current')));
      ok(tag + 'aria-current on the right link', cur.length === 1 && cur[0] === path + '=page', cur);
      ok(tag + '#year current', await p.textContent('#year') === String(new Date().getFullYear()));
      if (mobile) {
        ok(tag + 'menu closed first', !(await p.isVisible('#nav')));
        ok(tag + 'phone bar hidden on first screen', await p.evaluate(() => !document.getElementById('mobile-cta').classList.contains('show')));
        await p.click('#nav-toggle'); await p.waitForTimeout(450);
        ok(tag + 'menu opens, aria-expanded true, page inert', await p.isVisible('#nav') && await p.getAttribute('#nav-toggle', 'aria-expanded') === 'true' && await p.evaluate(() => document.querySelector('main').inert === true && document.body.style.overflow === 'hidden'));
        ok(tag + 'focus on first menu link', await p.evaluate(() => document.activeElement === document.querySelector('#nav a')));
        await p.keyboard.press('Escape'); await p.waitForTimeout(400);
        ok(tag + 'Escape closes menu, focus returns', !(await p.isVisible('#nav')) && await p.evaluate(() => document.activeElement.id === 'nav-toggle' && !document.querySelector('main').inert));
        // sticky bar
        const H = await p.evaluate(() => document.documentElement.scrollHeight);
        let shownAt = null, hiddenAt = null; const coverIssues = [];
        for (let y = 0; y <= H - h; y += 100) {
          await p.evaluate(yy => scrollTo(0, yy), y); await p.waitForTimeout(260);
          const st = await p.evaluate(() => {
            const bar = document.getElementById('mobile-cta'); const shown = bar.classList.contains('show') && getComputedStyle(bar).visibility !== 'hidden';
            const br = bar.getBoundingClientRect();
            // what interactive things in main/footer are under the bar
            const covered = [];
            if (shown) for (const el of document.querySelectorAll('main a, main button, footer a')) { const r = el.getBoundingClientRect(); if (r.height && r.bottom > br.top + 2 && r.top < br.bottom - 2 && r.top >= 0) covered.push(el.textContent.trim().replace(/\s+/g,' ').slice(0, 30)); }
            return { shown, top: Math.round(br.top), h: Math.round(br.height), covered };
          });
          if (st.shown && shownAt === null) shownAt = y;
          if (!st.shown && shownAt !== null && hiddenAt === null) hiddenAt = y;
          if (st.shown && hiddenAt !== null) { hiddenAt = null; }
        }
        ok(tag + `phone bar shows (first at y=${shownAt}) and hides over footer (at y=${hiddenAt}, page ${H})`, shownAt !== null && hiddenAt !== null);
        // at very bottom
        await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(600);
        ok(tag + 'phone bar hidden at very bottom', await p.evaluate(() => !document.getElementById('mobile-cta').classList.contains('show')));
        // does bar cover the CTA buttons when the CTA band buttons are at viewport bottom?
        const cov = await p.evaluate(async () => {
          const out = [];
          const bar = document.getElementById('mobile-cta');
          for (const el of document.querySelectorAll('.cta-band .btn, .case-facts a, .lede a, .page-head .btn')) {
            const r0 = el.getBoundingClientRect(); const y = r0.bottom + scrollY - innerHeight + 4; // element's bottom at viewport bottom
            scrollTo(0, Math.max(0, y)); await new Promise(r => setTimeout(r, 450));
            const r = el.getBoundingClientRect(); const br = bar.getBoundingClientRect(); const shown = bar.classList.contains('show');
            const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            out.push({ el: el.textContent.trim().slice(0, 26), barShown: shown, covered: shown && r.bottom > br.top, hitIsEl: hit === el || el.contains(hit), footerInView: document.querySelector('.site-footer').getBoundingClientRect().top < innerHeight });
          }
          return out;
        });
        console.log('    bar-vs-controls:', JSON.stringify(cov));
      } else {
        ok(tag + 'desktop: no phone bar visible', !(await p.isVisible('#mobile-cta')));
        ok(tag + 'desktop: header tel hidden at top, topbar tel shown', !(await p.isVisible('.header-tel')) && await p.isVisible('.topbar-tel'));
        await p.evaluate(() => scrollTo(0, 900)); await p.waitForTimeout(700);
        ok(tag + 'desktop: header scrolled + tel visible', await p.evaluate(() => document.getElementById('site-header').classList.contains('scrolled')) && await p.isVisible('.header-tel'));
      }
      // reveal: scroll to bottom slowly; everything visible
      await p.evaluate(() => scrollTo(0, 0));
      const H2 = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y <= H2; y += Math.round(h * .8)) { await p.evaluate(yy => scrollTo(0, yy), y); await p.waitForTimeout(250); }
      await p.waitForTimeout(700);
      const rv = await p.evaluate(() => [...document.querySelectorAll('.reveal')].map(e => [e.className, getComputedStyle(e).opacity, getComputedStyle(e).transform]));
      ok(tag + 'all reveal blocks end visible', rv.every(x => x[1] === '1' && (x[2] === 'none' || x[2] === 'matrix(1, 0, 0, 1, 0, 0)')), rv);
      ok(tag + 'no console errors / failed requests', errors.length === 0 && failedReq.length === 0, { errors, failedReq });
      await ctx.close();
    }
  }
  await b.close(); console.log(failed ? failed + ' FAILED' : 'ALL PASS');
})();
