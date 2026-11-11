// Independent measurements for the "dale" findings.
const { chromium } = require('playwright');
const path = require('path');
const OUT = __dirname;
const NEW = 'http://localhost:8720', OLD = 'http://localhost:8700';

async function ctxFor(browser, w, h, mobile) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: 'light',
    isMobile: mobile, hasTouch: mobile,
  });
  await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  return ctx;
}

// find the top-most visible element whose own text (trimmed) contains needle
async function findY(page, needles) {
  return page.evaluate(ns => {
    const res = {};
    const H = document.documentElement.scrollHeight;
    res.__height = H;
    for (const n of ns) {
      const hits = [];
      const w = document.createTreeWalker(document.querySelector('main') || document.body, NodeFilter.SHOW_ELEMENT);
      let el;
      while ((el = w.nextNode())) {
        const t = (el.innerText || '').replace(/\s+/g, ' ').trim();
        if (!t || !t.toLowerCase().includes(n.toLowerCase())) continue;
        // want the deepest element containing it
        let deeper = false;
        for (const c of el.children) {
          const ct = (c.innerText || '').replace(/\s+/g, ' ').trim();
          if (ct.toLowerCase().includes(n.toLowerCase())) { deeper = true; break; }
        }
        if (deeper) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const cs = getComputedStyle(el);
        hits.push({ y: Math.round(r.top + scrollY), tag: el.tagName.toLowerCase(), cls: el.className && el.className.baseVal === undefined ? el.className : '', fs: cs.fontSize, href: el.closest('a') ? el.closest('a').getAttribute('href') : null, text: t.slice(0, 110) });
      }
      res[n] = hits;
    }
    return res;
  }, needles);
}

(async () => {
  const browser = await chromium.launch();
  const jobs = JSON.parse(process.argv[2]);
  for (const j of jobs) {
    const ctx = await ctxFor(browser, j.w, j.h, j.w < 800);
    const page = await ctx.newPage();
    await page.goto((j.old ? OLD : NEW) + j.path, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    const r = await findY(page, j.needles);
    console.log(`\n=== ${j.old ? 'OLD' : 'NEW'} ${j.path} @ ${j.w}x${j.h}  height=${r.__height} (${(r.__height / j.h).toFixed(1)} screens)`);
    for (const n of j.needles) {
      const hs = r[n];
      if (!hs.length) { console.log(`  "${n}": NOT FOUND`); continue; }
      for (const h of hs.slice(0, j.all ? 20 : 3)) console.log(`  "${n}": y=${h.y} (${(100 * h.y / r.__height).toFixed(0)}%, screen ${(h.y / j.h + 1).toFixed(1)}) <${h.tag}.${String(h.cls).split(' ')[0]}> fs=${h.fs} href=${h.href} :: ${h.text}`);
    }
    if (j.shot) await page.screenshot({ path: path.join(OUT, j.shot) });
    await ctx.close();
  }
  await browser.close();
})();
