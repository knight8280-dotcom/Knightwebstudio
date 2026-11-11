const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/work/', '/process/']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(500);
    const r = await p.evaluate(() => {
      const out = {};
      out.headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')].filter(h => !h.closest('[hidden]')).map(h => h.tagName + (h.closest('[aria-hidden=true]') ? '(hidden)' : '') + ': ' + h.textContent.trim().replace(/\s+/g, ' ').slice(0, 40));
      out.landmarks = [...document.querySelectorAll('header,nav,main,footer,aside,section[aria-label],section[aria-labelledby],[role]')].filter(e => !e.closest('svg')).map(e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.getAttribute('role') ? '[role=' + e.getAttribute('role') + ']' : '') + (e.getAttribute('aria-label') ? '[' + e.getAttribute('aria-label') + ']' : ''));
      out.lists = [...document.querySelectorAll('main ul, main ol, main dl')].map(l => l.tagName + '.' + l.className + ' children:' + [...l.children].map(c => c.tagName).join(',') + ' ls:' + getComputedStyle(l).listStyleType + ' disp:' + getComputedStyle(l).display + (l.getAttribute('aria-label') ? ' label:' + l.getAttribute('aria-label') : '') + (l.getAttribute('role') ? ' role:' + l.getAttribute('role') : ''));
      out.imgs = [...document.querySelectorAll('main img')].map(i => ({ src: i.getAttribute('src'), w: i.getAttribute('width'), h: i.getAttribute('height'), alt: i.alt, loading: i.loading, top: Math.round(i.getBoundingClientRect().top + scrollY), rendered: Math.round(i.getBoundingClientRect().width) + 'x' + Math.round(i.getBoundingClientRect().height), natural: i.naturalWidth + 'x' + i.naturalHeight }));
      out.ariaHidden = [...document.querySelectorAll('main [aria-hidden=true]')].filter(e => !e.closest('svg') && e.tagName !== 'svg').map(e => e.tagName + '.' + e.className + ': ' + e.textContent.trim().replace(/\s+/g, ' ').slice(0, 40) + (e.querySelector('a,button,input,[tabindex]') ? ' !!FOCUSABLE INSIDE' : ''));
      out.targets = [...document.querySelectorAll('main a, main button, main summary')].map(el => { const rc = el.getBoundingClientRect(); const cs = getComputedStyle(el); return `${Math.round(rc.width)}x${Math.round(rc.height)} ${cs.display} "${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 34)}"`; });
      const sizes = new Map(); const w = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
      while (w.nextNode()) { const n = w.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (el.closest('svg,.sr-only,[hidden]')) continue; if (!el.offsetParent) continue; const cs = getComputedStyle(el); const k = parseFloat(cs.fontSize) + 'px ' + (cs.textTransform === 'uppercase' ? 'CAPS ' : '') + el.tagName.toLowerCase() + '.' + (el.className || '') + ' <' + (el.parentElement.className || el.parentElement.tagName) + '>'; if (!sizes.has(k)) sizes.set(k, n.textContent.trim().slice(0, 30)); }
      out.sizes = [...sizes.entries()].sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])).map(x => x.join(' | '));
      out.lang = document.documentElement.lang; out.title = document.title;
      out.anim = [...document.querySelectorAll('*')].filter(e => { const cs = getComputedStyle(e); return cs.animationName !== 'none' && cs.animationIterationCount === 'infinite'; }).map(e => e.tagName + '.' + e.className);
      out.skip = !!document.querySelector('a.skip-link[href="#main"]') && !!document.getElementById('main');
      return out;
    });
    console.log('=====', path); for (const [k, v] of Object.entries(r)) console.log(k + ':', Array.isArray(v) ? '\n   ' + v.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join('\n   ') : v);
    await ctx.close();
  }
  await b.close();
})();
