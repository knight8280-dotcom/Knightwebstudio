const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8720';
(async () => {
  const b = await chromium.launch();
  for (const path of ['/contact/', '/faq/']) for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(base + path, { waitUntil: 'load' }); await p.waitForTimeout(300);
    // structure
    const s = await p.evaluate(() => {
      const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => [+h.tagName[1], h.textContent.trim().slice(0, 40), h.className]);
      const skips = []; for (let i = 1; i < hs.length; i++) if (hs[i][0] > hs[i - 1][0] + 1) skips.push(hs[i - 1][1] + ' -> ' + hs[i][1]);
      const lm = [...document.querySelectorAll('header,nav,main,footer,section[aria-label],section[aria-labelledby],form[aria-label],[role]')].map(e => e.tagName.toLowerCase() + (e.getAttribute('role') ? '[role=' + e.getAttribute('role') + ']' : '') + ':' + (e.getAttribute('aria-label') || (e.getAttribute('aria-labelledby') ? document.getElementById(e.getAttribute('aria-labelledby'))?.textContent.trim() : '') || ''));
      const fields = [...document.querySelectorAll('main input:not([type=hidden]), main select, main textarea')].map(f => { const lab = f.labels && f.labels[0]; return [f.id || f.name, f.type, lab ? lab.textContent.trim().replace(/\s+/g, ' ') : 'NO LABEL', f.required, f.getAttribute('autocomplete'), f.getAttribute('inputmode'), f.getAttribute('aria-describedby'), f.getAttribute('autocapitalize')]; });
      const imgs = [...document.querySelectorAll('img')].map(i => [i.getAttribute('src'), i.getAttribute('alt'), i.getAttribute('width'), i.getAttribute('height'), i.getAttribute('loading')]);
      const svgs = [...document.querySelectorAll('main svg')].map(sv => sv.getAttribute('aria-hidden'));
      return { h1: hs.filter(h => h[0] === 1).length, hs, skips, lm, fields, imgs, svgs, lang: document.documentElement.lang, title: document.title };
    });
    if (w === 390) { console.log('=====', path, 'h1 count', s.h1, 'skips', s.skips, 'lang', s.lang); console.log(' headings:', s.hs.map(h => 'h' + h[0] + (h[2] ? '.' + h[2] : '') + ' ' + h[1]).join(' | ')); console.log(' landmarks:', s.lm.join(' | ')); console.log(' fields:'); s.fields.forEach(f => console.log('   ', JSON.stringify(f))); console.log(' imgs:', JSON.stringify(s.imgs), 'main svgs aria-hidden:', s.svgs.join(',')); }
    // tab order
    const stops = [];
    for (let i = 0; i < 80; i++) {
      await p.keyboard.press('Tab'); await p.waitForTimeout(60);
      const f = await p.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return null; const r = a.getBoundingClientRect(); const cs = getComputedStyle(a); 
        let ring = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 ? cs.outlineWidth + ' ' + cs.outlineColor : null;
        if (!ring && a.matches('.chip input')) { const sp = a.nextElementSibling; const c2 = getComputedStyle(sp); ring = c2.outlineStyle !== 'none' ? 'span ' + c2.outlineWidth + ' ' + c2.outlineColor : null; }
        const hdr = document.getElementById('site-header').getBoundingClientRect(); const bar = document.getElementById('mobile-cta'); const barTop = bar && bar.classList.contains('show') ? bar.getBoundingClientRect().top : innerHeight;
        const underHeader = getComputedStyle(document.getElementById('site-header')).position === 'sticky' && !a.closest('.site-header') && !a.closest('.topbar') && r.top < hdr.bottom - 1 && r.bottom > hdr.top; 
        return { el: a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') + (a.name ? '[' + a.name + '=' + a.value + ']' : ''), text: (a.textContent || a.value || '').trim().replace(/\s+/g, ' ').slice(0, 28), top: Math.round(r.top), bottom: Math.round(r.bottom), ring, underHeader, underBar: !a.closest('#mobile-cta') && r.bottom > barTop + 1, off: r.bottom < 0 || r.top > innerHeight, inFooter: !!a.closest('.site-footer'), size: Math.round(r.width) + 'x' + Math.round(r.height) }; });
      if (!f) continue; stops.push(f); if (f.inFooter) break;
    }
    console.log(`--- ${path} ${w}: ${stops.length} stops`);
    console.log('   order:', stops.map(x => x.el + (x.text ? '"' + x.text + '"' : '')).join(' > '));
    const bad = stops.filter(x => !x.ring || x.underHeader || x.underBar || x.off);
    bad.forEach(x => console.log('   PROBLEM', JSON.stringify(x)));
    if (!bad.length) console.log('   every stop has a ring >= 2px and is in view, clear of header and phone bar');
    console.log('   rings:', [...new Set(stops.map(x => x.ring))].join(' ; '));
    // touch targets at 390
    if (w === 390) {
      await p.evaluate(() => { scrollTo(0, 0); document.querySelectorAll('details').forEach(d => d.open = true); });
      const t = await p.evaluate(() => [...document.querySelectorAll('main a, main button, main input:not([type=hidden]), main select, main textarea, main summary, main label.chip, .topbar a, .site-header a, .site-header button, .site-footer a, #mobile-cta a')].filter(e => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width && r.height && !e.closest('.hp') && !e.closest('#nav'); }).map(e => { const r = e.getBoundingClientRect(); const inline = getComputedStyle(e).display === 'inline'; return { el: e.tagName.toLowerCase() + (e.className && e.className.toString() ? '.' + e.className.toString().split(' ')[0] : ''), text: (e.textContent || '').trim().slice(0, 26), w: Math.round(r.width), h: Math.round(r.height), inline, where: e.closest('main') ? 'main' : 'chrome' }; }).filter(x => x.h < 44 || x.w < 44));
      console.log('   targets under 44px at 390:'); t.forEach(x => console.log('     ', JSON.stringify(x))); if (!t.length) console.log('      none');
    }
    await ctx.close();
  }
  await b.close();
})();
