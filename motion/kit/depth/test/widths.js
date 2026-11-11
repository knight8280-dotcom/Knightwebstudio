// No sideways scroll from 360 to 1920px in 20px steps. Like the site's tools/widths.js, but it knows that the drum's side
// cards are meant to run off the edge: an element past the right edge passes only if an ancestor that clips (overflow
// hidden or clip) sits inside the window. Also fails on any box that scrolls sideways.   node test/widths.js [url,url]
const { chromium } = require('playwright');
const urls = (process.argv[2] || 'http://localhost:8730/kit/depth/demo.html,http://localhost:8730/kit/depth/test/bare.html').split(',');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const url of urls) for (const js of [true, false]) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 900 }, javaScriptEnabled: js });
    const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(300);
    const fails = []; let clipped = 0;
    for (let w = 360; w <= 1920; w += 20) {
      await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(80);
      const r = await p.evaluate(() => {
        const out = [], clips = e => { for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o === 'hidden' || o === 'clip') { const r = a.getBoundingClientRect(); if (r.right <= innerWidth + .5 && r.left >= -.5) return true; } } return false; };
        let n = 0;
        for (const el of document.querySelectorAll('main *, header *')) {
          const cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.display === 'none') continue;
          const rc = el.getBoundingClientRect(); if (!rc.width || !rc.height || el.closest('.sr-only,.kws-cyl-sr')) continue;
          if (/(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1) out.push(el.className + ' scrolls sideways');
          if (rc.right > innerWidth + .5 || rc.left < -.5) { if (clips(el)) n++; else out.push(`${el.tagName.toLowerCase()}.${el.className} sticks out ${Math.round(Math.max(rc.right - innerWidth, -rc.left))}px unclipped`); }
        }
        return { over: document.documentElement.scrollWidth - innerWidth, out: [...new Set(out)].slice(0, 3), n };
      });
      clipped = Math.max(clipped, r.n);
      if (r.over > 0 || r.out.length) fails.push(`${w}px: page +${r.over} ${r.out.join('; ')}`);
    }
    console.log(`${fails.length ? 'FAIL' : 'PASS'}  ${url.split('/').slice(-1)[0]} (script ${js ? 'on' : 'off'}): ${fails.length ? '\n  ' + fails.slice(0, 8).join('\n  ') : `no sideways scroll and nothing unclipped past the edge, 360 to 1920 in 20px steps (up to ${clipped} parts of the drum and ring run past the edge inside their own clip)`}`);
    bad += fails.length; await ctx.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
