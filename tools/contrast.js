#!/usr/bin/env node
/* Measured contrast audit: every visible text node against the colours actually painted behind it.
   node tools/contrast.js --base http://localhost:8720 --paths /,/pricing/ [--widths 1440,390]
   Reports text under WCAG AA (4.5:1, or 3:1 for large text) in the light and dark themes. Exit code 1 if any. */
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const base = arg('base', 'http://localhost:8720').replace(/\/$/, '');
const paths = arg('paths', '/').split(','); const widths = arg('widths', '1440,390').split(',').map(Number);
(async () => {
  const b = await chromium.launch(); let total = 0;
  for (const theme of ['light', 'dark']) for (const path of paths) for (const w of widths) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce', colorScheme: theme });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(base + path); await p.waitForTimeout(500);
    const bad = await p.evaluate(() => {
      const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
      const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
      const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
      const bgOf = el => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a === 1) break; } }
        let base = { r: 255, g: 255, b: 255, a: 1 }; for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base); return base; };
      const out = new Map(); const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) { const n = walker.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement;
        if (!el || el.closest('svg, script, style, .sr-only, [hidden], option')) continue;
        const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
        if (el.closest('.nav') && getComputedStyle(el.closest('.nav')).visibility === 'hidden') continue;
        if (el.closest('.mobile-cta') && getComputedStyle(el.closest('.mobile-cta')).visibility === 'hidden') continue;
        let fg = parse(cs.color); if (!fg) continue; const bg = bgOf(el); fg = over(fg, bg);
        const ratio = (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05);
        const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700; const large = size >= 24 || (size >= 18.66 && bold);
        if (ratio < (large ? 3 : 4.5)) { const k = (el.className || el.tagName) + ' | ' + n.textContent.trim().slice(0, 30); if (!out.has(k)) out.set(k, ratio.toFixed(2) + ' @' + size + 'px'); } }
      return [...out.entries()];
    });
    total += bad.length; console.log(theme, path, w, bad.length ? JSON.stringify(bad, null, 1) : 'all text passes AA');
    await ctx.close();
  }
  await b.close(); process.exit(total ? 1 : 0);
})();
