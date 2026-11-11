const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', hasTouch: w < 500 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto('http://localhost:8720/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
    const r = await p.evaluate(() => {
      const o = {};
      o.h1 = document.querySelectorAll('h1').length;
      o.outline = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(e => !e.closest('[hidden]')).map(e => e.tagName + (e.closest('[aria-hidden="true"]') ? '(hidden)' : '') + ' ' + e.textContent.trim().replace(/\s+/g, ' ').slice(0, 50));
      o.skips = []; let prev = 0; for (const e of document.querySelectorAll('h1,h2,h3,h4,h5,h6')) { const l = +e.tagName[1]; if (prev && l > prev + 1) o.skips.push(`${prev}->${l} at "${e.textContent.trim().slice(0, 30)}"`); prev = l; }
      o.landmarks = [...document.querySelectorAll('header,nav,main,footer,aside,section[aria-label],section[aria-labelledby],[role]')].map(e => e.tagName.toLowerCase() + (e.getAttribute('role') ? `[role=${e.getAttribute('role')}]` : '') + (e.getAttribute('aria-label') ? `"${e.getAttribute('aria-label').slice(0, 60)}"` : '')).filter((v, i, a) => a.indexOf(v) === i);
      o.imgs = [...document.images].map(i => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt'), w: i.getAttribute('width'), h: i.getAttribute('height'), loading: i.getAttribute('loading'), top: Math.round(i.getBoundingClientRect().top + scrollY), nat: i.naturalWidth + 'x' + i.naturalHeight, disp: Math.round(i.getBoundingClientRect().width) + 'x' + Math.round(i.getBoundingClientRect().height), fit: getComputedStyle(i).objectFit }));
      const ids = {}; document.querySelectorAll('[id]').forEach(e => ids[e.id] = (ids[e.id] || 0) + 1); o.dupIds = Object.entries(ids).filter(([k, v]) => v > 1);
      o.hiddenFocusable = [...document.querySelectorAll('[aria-hidden="true"] a, [aria-hidden="true"] button, [aria-hidden="true"] [tabindex]')].map(e => e.outerHTML.slice(0, 100));
      o.svgNoHide = [...document.querySelectorAll('main svg')].filter(s => s.getAttribute('aria-hidden') !== 'true' && !s.getAttribute('role') && !s.closest('[aria-hidden="true"]')).map(s => (s.getAttribute('class') || '') + ' in ' + (s.parentElement.className || s.parentElement.tagName));
      o.svgRoles = [...document.querySelectorAll('main svg[role], main svg[aria-label], main svg title')].map(s => s.tagName + ' role=' + s.getAttribute('role') + ' label=' + (s.getAttribute('aria-label') || '') + ' ' + (s.tagName === 'title' ? s.textContent : ''));
      o.roleImg = [...document.querySelectorAll('[role=img]')].map(e => ({ cls: e.className.toString(), label: e.getAttribute('aria-label'), exposedKids: [...e.querySelectorAll('*')].filter(k => k.children.length === 0 && k.textContent.trim() && !k.closest('[aria-hidden="true"]')).map(k => k.textContent.trim().slice(0, 30)) }));
      o.lists = [...document.querySelectorAll('main ul, main ol')].map(l => ({ cls: l.className.toString() || l.tagName, ls: getComputedStyle(l).listStyleType, role: l.getAttribute('role'), hidden: !!l.closest('[aria-hidden="true"]'), kidsNotLi: [...l.children].filter(c => c.tagName !== 'LI').length }));
      o.dl = [...document.querySelectorAll('main dl')].map(d => ({ cls: d.className.toString(), bad: [...d.children].filter(c => !['DIV', 'DT', 'DD'].includes(c.tagName)).length, hidden: !!d.closest('[aria-hidden="true"]') }));
      o.links = [...document.querySelectorAll('main a')].map(a => ({ href: a.getAttribute('href'), name: (a.getAttribute('aria-label') || a.textContent).trim().replace(/\s+/g, ' ').slice(0, 60), target: a.target, rel: a.rel }));
      o.blank = [...document.querySelectorAll('a[target=_blank]')].filter(a => !/noopener/.test(a.rel)).length;
      o.figure = [...document.querySelectorAll('main figure')].map(f => ({ cls: f.className.toString(), hasCap: !!f.querySelector('figcaption'), ariaHidden: f.getAttribute('aria-hidden') }));
      o.heroArtAria = (() => { const f = document.querySelector('.hero-art'); return { fig: f.getAttribute('aria-hidden'), role: f.getAttribute('role'), label: f.getAttribute('aria-label'), scene: (() => { const s = f.querySelector('.hero-scene svg'); return s ? { ah: s.getAttribute('aria-hidden'), role: s.getAttribute('role'), label: s.getAttribute('aria-label'), title: s.querySelector('title') && s.querySelector('title').textContent, labelledby: s.getAttribute('aria-labelledby') } : null; })(), phone: f.querySelector('.hero-phone').getAttribute('aria-hidden') }; })();
      o.blockquote = [...document.querySelectorAll('main blockquote')].map(q => q.className + ': ' + q.textContent.trim().slice(0, 40));
      o.lang = document.documentElement.lang;
      return o;
    });
    console.log(`\n===== ${w}x${h}`); console.log(JSON.stringify(r, null, 1)); console.log('errors', errs);
    await ctx.close();
  }
  await b.close();
})();
