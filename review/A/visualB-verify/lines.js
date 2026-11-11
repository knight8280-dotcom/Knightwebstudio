// Independent line-box reader: for a selector, returns the visible text of each rendered line.
// usage: node lines.js <path> <selector> <widths csv|a..b:step> [theme] [index]
const { chromium } = require('playwright');
const base = process.env.BASE || 'http://localhost:8720';

function parseWidths(s) {
  const out = [];
  for (const part of s.split(',')) {
    const m = part.match(/^(\d+)\.\.(\d+)(?::(\d+))?$/);
    if (m) { for (let w = +m[1]; w <= +m[2]; w += +(m[3] || 10)) out.push(w); }
    else out.push(+part);
  }
  return out;
}

const linesFn = (sel, idx) => {
  const els = [...document.querySelectorAll(sel)];
  const el = els[idx || 0];
  if (!el) return null;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const chars = [];
  let n;
  while ((n = walker.nextNode())) {
    const t = n.nodeValue;
    for (let i = 0; i < t.length; i++) {
      const r = document.createRange();
      r.setStart(n, i); r.setEnd(n, i + 1);
      const rects = r.getClientRects();
      if (!rects.length) continue;
      const rc = rects[0];
      if (rc.width === 0 && /\s/.test(t[i])) continue;
      chars.push({ c: t[i], top: Math.round(rc.top + rc.height / 2), left: rc.left, right: rc.right });
    }
  }
  const lines = [];
  for (const ch of chars) {
    let L = lines.find(l => Math.abs(l.top - ch.top) < 6);
    if (!L) { L = { top: ch.top, s: '', left: ch.left, right: ch.right }; lines.push(L); }
    L.s += ch.c; L.left = Math.min(L.left, ch.left); L.right = Math.max(L.right, ch.right);
  }
  const cs = getComputedStyle(el);
  const box = el.getBoundingClientRect();
  return {
    lines: lines.map(l => l.s.replace(/\s+/g, ' ').trim()),
    widths: lines.map(l => Math.round(l.right - l.left)),
    fs: cs.fontSize, w: Math.round(box.width), tw: cs.textWrap || cs.textWrapMode,
    count: els.length,
  };
};

(async () => {
  const [p, sel, ws, theme = 'light', idx = '0'] = process.argv.slice(2);
  const widths = parseWidths(ws);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: widths[0], height: 900 }, colorScheme: theme });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const page = await ctx.newPage();
  await page.goto(base + p, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  let prev = null, start = null;
  const flush = (end) => { if (prev !== null) console.log(`${start}..${end}: ${prev}`); };
  let last = null;
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(60);
    const r = await page.evaluate(([s, i]) => (window.__lines || (window.__lines = null), null), [sel, +idx]);
    const res = await page.evaluate(`(${linesFn.toString()})(${JSON.stringify(sel)}, ${+idx})`);
    const key = res ? res.lines.join(' / ') : 'MISSING';
    if (key !== prev) { flush(last); prev = key; start = w; if (res) console.log(`   @${w} fs=${res.fs} boxw=${res.w} linew=${res.widths.join(',')} tw=${res.tw} (n=${res.count})`); }
    last = w;
  }
  flush(last);
  await browser.close();
})();
