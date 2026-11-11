const { chromium, BASE, PAGES, ctxFor } = require('./lib');
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1280]) for (const path of PAGES) {
    const ctx = await ctxFor(b, { w, h: 800, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(250);
    const r = await p.evaluate(() => { const out = [];
      const ids = {}; document.querySelectorAll('[id]').forEach(e => { ids[e.id] = (ids[e.id] || 0) + 1; }); const dup = Object.entries(ids).filter(([k, v]) => v > 1).map(([k, v]) => k + 'x' + v); if (dup.length) out.push('DUP IDS ' + dup.join(','));
      for (const attr of ['aria-labelledby', 'aria-describedby', 'aria-controls', 'for', 'aria-owns', 'headers']) document.querySelectorAll('[' + attr + ']').forEach(e => { for (const id of e.getAttribute(attr).split(/\s+/)) if (id && !document.getElementById(id)) out.push(`BROKEN ${attr}="${id}" on ${e.tagName}.${e.className}`); });
      document.querySelectorAll('a[href^="#"]').forEach(a => { const id = a.getAttribute('href').slice(1); if (id && !document.getElementById(id)) out.push('BROKEN in-page link #' + id); });
      document.querySelectorAll('[aria-hidden="true"]').forEach(h => { h.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex]').forEach(f => { if (f.tabIndex >= 0 && f.checkVisibility({ checkVisibilityCSS: true })) out.push('FOCUSABLE IN aria-hidden: ' + f.tagName + ' ' + f.textContent.trim().slice(0, 30) + ' in .' + h.className); }); });
      document.querySelectorAll('img').forEach(i => { if (!i.hasAttribute('alt')) out.push('IMG no alt ' + i.src); else if (i.alt === '' && !i.closest('[aria-hidden="true"]')) out.push('IMG empty alt ' + i.getAttribute('src')); if (!i.getAttribute('width') || !i.getAttribute('height')) out.push('IMG no size ' + i.getAttribute('src')); });
      document.querySelectorAll('svg').forEach(s => { if (s.closest('[aria-hidden="true"]')) return; const role = s.getAttribute('role'); if (role === 'img' && (s.getAttribute('aria-label') || s.getAttribute('aria-labelledby') || s.querySelector('title'))) return; if (s.closest('[role="img"]')) return; out.push('SVG exposed without name: ' + (s.getAttribute('class') || '') + ' in ' + s.parentElement.tagName + '.' + s.parentElement.className); });
      document.querySelectorAll('[role="img"]').forEach(e => { if (!e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby')) out.push('role=img without label .' + e.className); });
      document.querySelectorAll('a[target="_blank"]').forEach(a => { if (!/noopener/.test(a.rel)) out.push('target=_blank without noopener ' + a.href); });
      document.querySelectorAll('[tabindex]').forEach(e => { if (e.tabIndex > 0) out.push('positive tabindex ' + e.tagName); });
      document.querySelectorAll('nav').forEach(n => { if (!n.getAttribute('aria-label') && !n.getAttribute('aria-labelledby')) out.push('nav without label'); });
      const navLabels = [...document.querySelectorAll('nav')].map(n => n.getAttribute('aria-label') || (document.getElementById(n.getAttribute('aria-labelledby')) || {}).textContent); const dl = navLabels.filter((x, i) => navLabels.indexOf(x) !== i); if (dl.length) out.push('duplicate nav labels ' + dl.join(','));
      if (document.querySelectorAll('main').length !== 1) out.push('main count ' + document.querySelectorAll('main').length);
      if (!document.querySelector('header.site-header')) out.push('no header'); if (!document.querySelector('footer')) out.push('no footer');
      const cur = [...document.querySelectorAll('#nav [aria-current]')].map(a => a.getAttribute('href')); out.push('aria-current in menu: ' + (cur.join(',') || 'none'));
      document.querySelectorAll('button:not([type])').forEach(e => out.push('button without type ' + e.id));
      document.querySelectorAll('ul:not([role]), ol:not([role])').forEach(l => { if (getComputedStyle(l).listStyleType === 'none') out.push('list-style none without role=list: ' + l.className + ' in ' + l.parentElement.className); });
      document.querySelectorAll('[role="list"]').forEach(l => { [...l.children].forEach(c => { if (c.tagName !== 'LI' && c.getAttribute('role') !== 'listitem') out.push('role=list child not li: ' + c.tagName + '.' + c.className); }); });
      return out; });
    if (w === 390 || r.length > 1) console.log(`${path} @${w}: ` + r.join(' | '));
    await ctx.close();
  }
  await b.close();
})();
