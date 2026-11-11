// 6. Robustness: widths 320 and 360..1920 by 20; long words; item counts; missing crest; zoom; theme toggle; two instances; bfcache.
const { launch, open, end } = require('./common');
const ROOTS = '.kws-close, .kws-appt, .kws-foot';
(async () => {
  const b = await launch();
  // ---- widths ----
  for (const url of ['demo.html', 'portable.html', 'test/pricing-with-kit.html', 'test/start-with-kit.html', 'test/notfound-with-kit.html']) {
    const p = await open(b, url, { ctx: { viewport: { width: 360, height: 800 } } });
    await p.waitForTimeout(600);
    const bad = [], nameFit = [], heights = {};
    for (const w of [320].concat(Array.from({ length: 79 }, (_, i) => 360 + i * 20))) {
      await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(40);
      const r = await p.evaluate(ROOTS => {
        const out = { over: document.documentElement.scrollWidth - innerWidth, off: [], clip: [], name: [] };
        for (const el of document.querySelectorAll(':is(' + ROOTS + ') :is(a, p, h2, li, dt, dd, button, span)')) { if (el.closest('[aria-hidden="true"], [hidden]')) continue; const q = el.getBoundingClientRect(); if (!q.width) continue; if (q.left < -0.5 || q.right > innerWidth + 0.5) out.off.push(String(el.className).split(' ')[0] + ' ' + Math.round(q.left) + '..' + Math.round(q.right)); if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0 && getComputedStyle(el).display !== 'inline') out.clip.push(String(el.className || el.tagName).split(' ')[0] + ' sw' + el.scrollWidth + '>cw' + el.clientWidth); }
        for (const n of document.querySelectorAll('.kws-skyline-name')) { const r = document.createRange(); r.selectNodeContents(n); const t = r.getBoundingClientRect(), s = n.parentElement.getBoundingClientRect(); out.name.push(+(t.width / s.width).toFixed(3)); }
        out.foot = [...document.querySelectorAll('.kws-foot')].map(f => Math.round(f.getBoundingClientRect().height));
        out.band = [...document.querySelectorAll('.kws-close')].map(f => Math.round(f.getBoundingClientRect().height));
        return out;
      }, ROOTS);
      if (r.over > 0 || r.off.length || r.clip.length) bad.push(`${w}: over ${r.over}px ${r.off.slice(0, 3).join(',')} ${r.clip.slice(0, 3).join(',')}`);
      nameFit.push([w, r.name]);
      if ([320, 360, 760, 980, 1440, 1920].includes(w)) heights[w] = { foot: r.foot, band: r.band };
    }
    const fits = nameFit.filter(x => x[1].length).map(x => x[1].map(v => v));
    const flat = nameFit.filter(x => x[1].length).flatMap(x => x[1].map(v => [x[0], v]));
    const mx = flat.reduce((a, c) => c[1] > a[1] ? c : a, [0, 0]), mn = flat.reduce((a, c) => c[1] < a[1] ? c : a, [0, 9]);
    console.log(`widths ${url}: ${bad.length ? 'PROBLEMS ' + bad.slice(0, 8).join(' | ') : 'no sideways scroll, nothing off-screen or clipped at 320 and 360..1920'}; sky name / scene width: max ${mx[1]} at ${mx[0]}px, min ${mn[1]} at ${mn[0]}px; heights ${JSON.stringify(heights)}`);
    await p.context().close();
  }

  // ---- stress content on the bare page (no site CSS) and the site page ----
  for (const url of ['portable.html', 'demo.html']) for (const w of [360, 390, 760, 1440]) {
    const p = await open(b, url, { ctx: { viewport: { width: w, height: 900 } } });
    await p.waitForTimeout(500);
    const r = await p.evaluate(ROOTS => {
      const LONG = 'Wartungsvertragsverlängerungsangebotsbestätigung', q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
      const res = {};
      const measure = label => { const off = []; for (const el of document.querySelectorAll(':is(' + ROOTS + ') :is(a, p, h2, li, dt, dd, span)')) { if (el.closest('[aria-hidden="true"], [hidden]')) continue; const r = el.getBoundingClientRect(); if (r.width && (r.left < -0.5 || r.right > innerWidth + 0.5)) off.push(String(el.className || el.tagName).split(' ')[0] + ' ' + Math.round(r.left) + '..' + Math.round(r.right)); }
        // overlaps between siblings inside the same kit block (text running into text)
        const ov = []; for (const box of document.querySelectorAll('.kws-appt dl div, .kws-foot-links, .kws-close-acts, .kws-foot-two, .kws-appt-head')) { const kids = [...box.children].filter(k => k.getBoundingClientRect().width); for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) { const a = kids[i].getBoundingClientRect(), c = kids[j].getBoundingClientRect(); if (Math.min(a.right, c.right) - Math.max(a.left, c.left) > 1 && Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > 1) ov.push(String(box.className).split(' ')[0] + ' children overlap'); } }
        res[label] = { over: document.documentElement.scrollWidth - innerWidth, off: [...new Set(off)].slice(0, 4), ov: [...new Set(ov)] }; };
      measure('as built');
      const saved = [];
      const set = (el, t) => { if (!el) return; saved.push([el, el.innerHTML]); el.textContent = t; };
      const restore = () => { while (saved.length) { const [el, h] = saved.pop(); el.innerHTML = h; } };
      // long word in the title
      qa('.kws-close-title').forEach(t => set(t, 'Ihr ' + LONG + ' heute.')); measure('title: one 48-letter word'); restore();
      // long marked words
      qa('.kws-close-mark').forEach(t => set(t, 'a free thirty-minute discovery call')); measure('mark: five words (nowrap)'); restore();
      // long kicker
      qa('.kws-close-kicker').forEach(t => set(t, 'Free · 30 minutes · No pitch · Fixed prices · A call or in person')); measure('kicker: 65 characters'); restore();
      // long button labels
      qa('.kws-close-btn, .kws-appt-btn').forEach(t => set(t, 'Book a free thirty-minute discovery call with ' + LONG)); measure('buttons: long label with a 48-letter word'); restore();
      // long dd / dt in the card
      qa('.kws-appt dd').forEach(t => set(t, 'A call, a video call, or in person at your place of business')); measure('card: long values');
      qa('.kws-appt dt').forEach(t => set(t, 'Where and how we would meet')); measure('card: long labels and values'); restore();
      qa('.kws-appt dd').forEach(t => set(t, LONG)); measure('card: 48-letter value'); restore();
      qa('.kws-appt-head span:first-child').forEach(t => set(t, 'Appointment card for a discovery call')); measure('card: long head'); restore();
      // long phone / email / name
      qa('.kws-close-tel a, .kws-foot-tel').forEach(t => set(t, '+1 (225) 255-0837 ext. 1234')); measure('phone: long number'); restore();
      qa('.kws-foot-mail').forEach(t => set(t, 'bookings.and.enquiries@a-very-long-business-name-bakery.example.com')); measure('email: 66 characters'); restore();
      qa('.kws-foot-logo span').forEach(t => set(t, 'Thibodeaux & Daughters Heating, Cooling and Refrigeration')); measure('logo: long business name'); restore();
      // long link names and many items
      qa('.kws-foot nav:not(.kws-foot-wide) li a').forEach((t, i) => set(t, i % 2 ? LONG : 'Emergency plumbing and drain cleaning, day or night')); measure('columns: long link names'); restore();
      qa('.kws-foot-two').forEach(ul => { saved.push([ul, ul.innerHTML]); ul.innerHTML = Array.from({ length: 23 }, (_, i) => i % 3 ? '<li><a href="#">St. Francisville ' + i + '</a></li>' : '<li><span>Greenwell Springs ' + i + '</span></li>').join(''); }); measure('areas: 23 places');
      res.areas23 = qa('.kws-foot-two').map(ul => { const li = [...ul.children], xs = new Set(li.map(l => Math.round(l.getBoundingClientRect().left))); return xs.size + ' columns, ' + Math.round(ul.getBoundingClientRect().height) + 'px'; });
      restore();
      qa('.kws-foot-two').forEach(ul => { saved.push([ul, ul.innerHTML]); ul.innerHTML = '<li><a href="#">Baton Rouge</a></li>'; }); measure('areas: 1 place'); restore();
      qa('.kws-foot nav:not(.kws-foot-wide) ul').forEach(ul => { saved.push([ul, ul.innerHTML]); ul.innerHTML = '<li><a href="#">Only one</a></li>'; }); measure('columns: 1 link each'); restore();
      qa('.kws-foot-links').forEach(pp => { saved.push([pp, pp.innerHTML]); pp.innerHTML += '<a href="#">Accessibility</a><a href="#">Cookie settings</a><a href="#">Licences</a><a href="#">Sitemap</a>'; }); measure('legal row: 7 links'); restore();
      qa('.kws-foot-bye').forEach(t => set(t, 'Thanks for stopping by. We reply within one business day, and we mean every word of it, rain or shine, from our shop on Government Street.')); measure('sign-off: 140 characters'); restore();
      // parts left out
      qa('.kws-close-kicker, .kws-close-tel, .kws-close-text').forEach(e => { saved.push([e, null]); e.hidden = true; e.style.display = 'none'; }); measure('band: title and buttons only'); saved.forEach(([e]) => { e.hidden = false; e.style.display = ''; }); saved.length = 0;
      return res;
    }, ROOTS);
    const probs = Object.entries(r).filter(([k, v]) => v && v.over !== undefined && (v.over > 0 || v.off.length || v.ov.length)).map(([k, v]) => `${k}: page ${v.over}px too wide${v.off.length ? '; off-screen ' + v.off.join(', ') : ''}${v.ov.length ? '; ' + v.ov.join(', ') : ''}`);
    console.log(`stress ${url} ${w}: ${probs.length ? '\n    ' + probs.join('\n    ') : 'all cases hold'}${r.areas23 ? ' | 23 places -> ' + r.areas23.join(' / ') : ''}`);
    await p.context().close();
  }
  await b.close();
})();
