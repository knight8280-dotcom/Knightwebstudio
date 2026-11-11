const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8720/consulting/';
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(500);
    const r = await p.evaluate(() => {
      const out = {};
      const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(h => !h.closest('[hidden]'));
      out.h1 = hs.filter(h => h.tagName === 'H1').length;
      out.headings = hs.map(h => h.tagName[1] + ' ' + h.textContent.trim().slice(0, 44));
      out.skips = []; let prev = 0; for (const h of hs) { const l = +h.tagName[1]; if (prev && l > prev + 1) out.skips.push(`${prev} -> ${l}: ${h.textContent.trim().slice(0, 40)}`); prev = l; }
      out.landmarks = [...document.querySelectorAll('header, nav, main, footer, aside, section[aria-label], section[aria-labelledby], [role]')].filter(e => !e.closest('main') || e.matches('main, nav, aside')).map(e => e.tagName.toLowerCase() + (e.getAttribute('role') ? '[role=' + e.getAttribute('role') + ']' : '') + (e.getAttribute('aria-label') ? ' "' + e.getAttribute('aria-label') + '"' : '') + (e.getAttribute('aria-labelledby') ? ' labelledby=' + e.getAttribute('aria-labelledby') : '') + (e.className ? ' .' + e.className.toString().split(' ')[0] : '')).slice(0, 30);
      // labelledby resolves
      out.badLabelledby = [...document.querySelectorAll('[aria-labelledby], [aria-describedby], [aria-controls]')].flatMap(e => ['aria-labelledby', 'aria-describedby', 'aria-controls'].flatMap(a => (e.getAttribute(a) || '').split(/\s+/).filter(Boolean).filter(id => !document.getElementById(id)).map(id => a + '=' + id)));
      out.dupIds = (() => { const m = {}; document.querySelectorAll('[id]').forEach(e => m[e.id] = (m[e.id] || 0) + 1); return Object.entries(m).filter(([k, v]) => v > 1); })();
      // table
      const t = document.querySelector('.ledger'); out.table = { role: t.getAttribute('role'), display: getComputedStyle(t).display, caption: t.caption && t.caption.textContent, rows: [...t.querySelectorAll('tr')].map(tr => (tr.getAttribute('role') || '-') + ':' + getComputedStyle(tr).display + ' [' + [...tr.children].map(c => c.tagName.toLowerCase() + '/' + (c.getAttribute('role') || '-') + (c.getAttribute('scope') ? '/' + c.getAttribute('scope') : '') + (c.colSpan > 1 ? '/colspan' + c.colSpan : '') + (c.getAttribute('aria-hidden') ? '/HIDDEN' : '')).join(', ') + ']'), groups: [...t.querySelectorAll('thead,tbody,tfoot')].map(g => g.tagName.toLowerCase() + '/' + g.getAttribute('role') + '/' + getComputedStyle(g).display), theadVisible: (() => { const th = t.querySelector('thead'); const cs = getComputedStyle(th); return cs.position + ' ' + cs.clip + ' ' + Math.round(th.getBoundingClientRect().width) + 'x' + Math.round(th.getBoundingClientRect().height); })() };
      // lists whose display is not list-item / role
      out.lists = [...document.querySelectorAll('main ul, main ol')].map(l => l.tagName.toLowerCase() + '.' + (l.className || '').toString().split(' ')[0] + ' ' + (l.getAttribute('role') || '') + (l.getAttribute('aria-hidden') ? ' aria-hidden' : '') + ' ls=' + getComputedStyle(l).listStyleType + ' kids=' + [...new Set([...l.children].map(c => c.tagName))].join('/'));
      // form fields
      out.fields = [...document.querySelectorAll('main input, main select, main textarea')].map(i => ({ id: i.id, label: !!(i.labels && i.labels.length), name: i.name || '', aria: i.getAttribute('aria-label') || '', auto: i.autocomplete, describedby: i.getAttribute('aria-describedby') }));
      out.fieldsets = [...document.querySelectorAll('main fieldset')].map(f => (f.querySelector('legend') || {}).textContent);
      out.live = [...document.querySelectorAll('main [aria-live], main [role=status], main [role=alert]')].map(e => e.className + ' ' + (e.getAttribute('aria-live') || e.getAttribute('role')) + ' atomic=' + e.getAttribute('aria-atomic'));
      // mocks
      out.mocks = [...document.querySelectorAll('main .phone, main .cal, main .leads, main .notice, main .payplan, main .appt, main .receipt, main .bigfig, main .sheet')].map(e => e.className.toString().split(' ').slice(0, 2).join('.') + ' role=' + e.getAttribute('role') + ' hidden=' + e.getAttribute('aria-hidden') + ' label=' + (e.getAttribute('aria-label') || '').slice(0, 60));
      out.imgRoleChildrenNotHidden = [...document.querySelectorAll('main [role=img]')].flatMap(e => [...e.children].filter(c => c.getAttribute('aria-hidden') !== 'true').map(c => e.className.toString().split(' ')[0] + ' > ' + c.tagName.toLowerCase() + '.' + c.className.toString().split(' ')[0] + ' "' + c.textContent.trim().slice(0, 30) + '"'));
      out.images = [...document.querySelectorAll('img')].map(i => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt'), w: i.getAttribute('width'), h: i.getAttribute('height'), loading: i.getAttribute('loading'), inMain: !!i.closest('main') }));
      out.svgs = [...document.querySelectorAll('main svg')].filter(s => s.getAttribute('aria-hidden') !== 'true' && !s.closest('[aria-hidden=true]') && !s.getAttribute('role')).length;
      out.newTab = [...document.querySelectorAll('a[target=_blank]')].filter(a => !/noopener/.test(a.rel)).length;
      out.emI = document.querySelectorAll('main em, main i:not(.busy):not(.new)').length;
      out.tabindex = [...document.querySelectorAll('[tabindex]')].map(e => e.tagName + ' ' + e.getAttribute('tabindex'));
      out.lang = document.documentElement.lang; out.title = document.title;
      out.summary = [...document.querySelectorAll('main details')].map(d => d.firstElementChild.tagName + ' open=' + d.open);
      return out;
    });
    console.log(`\n===== ${w}`); console.log(JSON.stringify(r, null, 1));
    if (w === 390) { for (const sel of ['.sheet', '.auto >> nth=0', '.auto >> nth=1', '.auto >> nth=2', '.auto >> nth=3', '#bundle', '#growth-calc .receipt', '.path > li >> nth=1', '.price-strip', '.toc']) { try { console.log('\n--- aria snapshot ' + sel + '\n' + await p.locator(sel).ariaSnapshot()); } catch (e) { console.log('snapshot failed', sel, String(e).slice(0, 100)); } } }
    await ctx.close();
  }
  await b.close();
})();
