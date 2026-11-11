// Tab through every page; per stop record geometry, cover by sticky chrome, outline, and a focused/unfocused clip pair.
// node keys.js [--widths 390,1280] [--themes light,dark] [--pages /,/pricing/] [--noshots]
const { chromium, BASE, PAGES, slug, ctxFor } = require('./lib');
const fs = require('fs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const widths = arg('widths', '390,1280').split(',').map(Number);
const themes = arg('themes', 'light,dark').split(',');
const pages = arg('pages', PAGES.join(',')).split(',');
const noshots = process.argv.includes('--noshots');
const probe = () => {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return null;
  const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
  let covered = 0, total = 0; const by = {};
  for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) {
    total++; const x = r.left + r.width * (i + 0.5) / 7, y = r.top + r.height * (j + 0.5) / 3;
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) { covered++; by.offscreen = (by.offscreen || 0) + 1; continue; }
    const t = document.elementFromPoint(x, y);
    if (!t) { covered++; by.none = (by.none || 0) + 1; continue; }
    if (el.contains(t) || t.contains(el)) continue;
    const lab = el.id && t.closest('label[for="' + el.id + '"]'); if (lab) continue;
    const fx = t.closest('.site-header, .mobile-cta, .topbar, .skip-link');
    covered++; const k = fx ? fx.className.split(' ')[0] : (t.tagName.toLowerCase() + '.' + String(t.className).split(' ')[0]); by[k] = (by[k] || 0) + 1;
  }
  let op = 1, vis = true; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const c = getComputedStyle(e); op *= +c.opacity; if (c.visibility === 'hidden' || c.display === 'none') vis = false; }
  const path = []; for (let e = el; e && e !== document.body && path.length < 4; e = e.parentElement) path.unshift(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : ''));
  const all = [...document.querySelectorAll('*')];
  return { sel: path.join(' > '), tag: el.tagName, text: (el.getAttribute('aria-label') || el.textContent || el.value || el.name || '').trim().replace(/\s+/g, ' ').slice(0, 60), href: el.getAttribute('href'),
    rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], docY: Math.round(r.top + scrollY), docX: Math.round(r.left + scrollX), scrollY: Math.round(scrollY), vh: innerHeight,
    covered, total, by, opacity: +op.toFixed(2), vis, fv: el.matches(':focus-visible'),
    outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor + ' off ' + cs.outlineOffset, shadow: cs.boxShadow.slice(0, 120), domIndex: all.indexOf(el) };
};
(async () => {
  const b = await chromium.launch();
  for (const w of widths) for (const theme of themes) for (const path of pages) {
    const ctx = await ctxFor(b, { w, h: w <= 500 ? 844 : 800, theme, reduced: true, mobile: w <= 500 });
    const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(500);
    await p.evaluate(() => { window.__mute = false; for (const t of ['blur', 'focusout', 'focus', 'focusin']) window.addEventListener(t, e => { if (window.__mute) e.stopImmediatePropagation(); }, true); });
    const stops = []; const seen = new Set();
    for (let i = 0; i < 220; i++) {
      await p.keyboard.press('Tab'); await p.waitForTimeout(60);
      const s = await p.evaluate(probe);
      if (!s) break; const key = s.domIndex; if (seen.has(key)) break; seen.add(key);
      s.i = i; stops.push(s);
      if (!noshots) {
        const pad = 10; const clip = { x: Math.max(0, s.rect[0] - pad), y: Math.max(0, s.rect[1] - pad), width: 0, height: 0 };
        clip.width = Math.min(w, s.rect[0] + s.rect[2] + pad) - clip.x; clip.height = Math.min(w <= 500 ? 844 : 800, s.rect[1] + s.rect[3] + pad) - clip.y;
        if (clip.width > 4 && clip.height > 4) {
          const base = `shots/focus/${slug(path)}_${w}_${theme}_${String(i).padStart(3, '0')}`;
          await p.screenshot({ path: base + '_f.png', clip });
          await p.evaluate(() => { window.__mute = true; window.__el = document.activeElement; window.__el.blur(); });
          await p.screenshot({ path: base + '_u.png', clip });
          s.refocus = await p.evaluate(() => { window.__el.focus({ preventScroll: true }); window.__mute = false; return document.activeElement === window.__el && window.__el.matches(':focus-visible'); });
          s.clip = [clip.x, clip.y, clip.width, clip.height];
        }
      }
    }
    fs.writeFileSync(`out/keys_${slug(path)}_${w}_${theme}.json`, JSON.stringify(stops, null, 1));
    console.log(path, w, theme, 'stops', stops.length);
    await ctx.close();
  }
  await b.close();
})();
