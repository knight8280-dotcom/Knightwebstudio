const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [name, url] of [['NEW', 'http://localhost:8720/services/'], ['OLD', 'http://localhost:8700/services/']]) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage();
    // disable JS-driven href rewriting to see raw hrefs: read from raw HTML via fetch
    await p.goto(url);
    const r = await p.evaluate(async (u) => {
      const html = await (await fetch(u)).text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const main = doc.querySelector('main');
      const links = [...main.querySelectorAll('a, button')].map(a => `${a.tagName.toLowerCase()} href=${a.getAttribute('href')}${a.hasAttribute('data-booking') ? ' [data-booking]' : ''}${a.target ? ' target=' + a.target : ''} | ${a.textContent.trim().replace(/\s+/g, ' ').slice(0, 60)}`);
      const heads = [...doc.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => `${h.tagName} ${h.className ? '.' + h.className : ''} | ${h.textContent.trim().replace(/\s+/g, ' ').slice(0, 60)}`);
      const ids = [...doc.querySelectorAll('[id]')].map(e => e.id);
      const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
      const frag = [...doc.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(h => h.length > 1 && !doc.getElementById(h.slice(1)));
      const landmarks = [...doc.querySelectorAll('main, nav, header, footer, aside, section[aria-label], section[aria-labelledby], [role]')].map(e => `${e.tagName.toLowerCase()}${e.getAttribute('role') ? '[role=' + e.getAttribute('role') + ']' : ''}${e.getAttribute('aria-label') ? ' aria-label="' + e.getAttribute('aria-label') + '"' : ''}${e.getAttribute('aria-labelledby') ? ' labelledby=' + e.getAttribute('aria-labelledby') + '→"' + (doc.getElementById(e.getAttribute('aria-labelledby')) || {}).textContent + '"' : ''} .${e.className}`);
      const imgs = [...doc.querySelectorAll('img')].map(i => i.outerHTML.slice(0, 200));
      const arialbl = [...doc.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls]')].flatMap(e => ['aria-labelledby', 'aria-describedby', 'aria-controls'].filter(a => e.hasAttribute(a)).map(a => [a, e.getAttribute(a), !!doc.getElementById(e.getAttribute(a))])).filter(x => !x[2]);
      const inl = [...main.querySelectorAll('[style]')].map(e => e.getAttribute('style'));
      return { links, heads, dup, frag, landmarks, imgs, arialbl, inl: [...new Set(inl)], h1: doc.querySelectorAll('h1').length };
    }, url);
    console.log('=====', name);
    console.log('LINKS in main:\n  ' + r.links.join('\n  '));
    console.log('HEADINGS:\n  ' + r.heads.join('\n  '));
    console.log('h1 count', r.h1, 'dup ids', r.dup, 'broken fragments', r.frag, 'broken aria refs', r.arialbl);
    console.log('LANDMARKS:\n  ' + r.landmarks.join('\n  '));
    console.log('IMGS', r.imgs.length, r.imgs);
    console.log('inline styles in main', r.inl);
    await ctx.close();
  }
  await b.close();
})();
