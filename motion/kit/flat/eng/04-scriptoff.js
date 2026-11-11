const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8730/kit/flat/demo.html';
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[360, 780], [390, 844], [820, 1100], [1440, 900]]) for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false, colorScheme: scheme });
    const p = await ctx.newPage(); const errs = []; p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('requestfailed', r => errs.push('REQFAIL ' + r.url()));
    await p.goto(URL, { waitUntil: 'load' });
    await p.screenshot({ path: `scriptoff-${w}-${scheme}.png`, fullPage: true });
    await ctx.close();
    // JS-on probe of the JS-off DOM is impossible; instead use a JS context with kit scripts and the head inline script blocked... simpler: second context, JS on, block all scripts by route, and strip the inline head script by rewriting the HTML
    const ctx2 = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
    await ctx2.route('**/demo.html', async r => { const resp = await r.fetch(); let body = await resp.text(); body = body.replace(/<script[\s\S]*?<\/script>/g, ''); r.fulfill({ response: resp, body }); });
    const p2 = await ctx2.newPage(); await p2.goto(URL, { waitUntil: 'load' });
    const r = await p2.evaluate(() => { const out = {};
      out.sx = document.documentElement.scrollWidth - innerWidth;
      for (const sel of ['.kws-arc', '.kws-spot']) { out[sel] = [...document.querySelectorAll(sel)].map(root => { const lis = [...root.querySelectorAll('li')];
        const vis = lis.map(li => { const r = li.getBoundingClientRect(); const cs = getComputedStyle(li); return r.height > 20 && r.width > 20 && cs.visibility !== 'hidden' && cs.opacity !== '0'; });
        // any text clipped? compare scrollWidth/clientWidth for each text element
        const clipped = [...root.querySelectorAll('h2,h3,p,a,.kws-arc-tile,.kws-spot-bar span')].filter(e => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1).map(e => e.className + ':' + e.textContent.trim().slice(0, 20) + ` ${e.scrollWidth}>${e.clientWidth} ${e.scrollHeight}>${e.clientHeight}`);
        const offR = [...root.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 0.5 || r.left < -0.5; }).length;
        const links = [...root.querySelectorAll('a')].map(a => { const r = a.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
        const cols = new Set(lis.map(li => Math.round(li.getBoundingClientRect().left))).size;
        return { n: lis.length, allVisible: vis.every(Boolean), cols, clipped, offR, buttons: root.querySelectorAll('button').length, minLinkH: Math.min(...links.map(l => l[1])), h: Math.round(root.getBoundingClientRect().height) }; }); }
      return out; });
    console.log(w, scheme, JSON.stringify(r), errs.length ? 'ERRS ' + errs.join(';') : '');
    await ctx2.close();
  }
  await b.close();
})();
