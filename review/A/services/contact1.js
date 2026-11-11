// Real hCaptcha on /contact/: does it render, fit, match the theme, and shift the page? Nothing is submitted.
const { launch, watch } = require('./lib');
const fs = require('fs');
const base = process.argv[2] || 'http://localhost:8720';
const tag = process.argv[3] || 'new';
const out = {};
const MODES = [['w360', 360, 740, true], ['w390', 390, 844, true], ['w320', 320, 640, true], ['w1280', 1280, 800, false], ['w820', 820, 1100, false]];
(async () => {
  const b = await launch();
  for (const [mname, w, h, mob] of MODES) for (const theme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, deviceScaleFactor: mob ? 2 : 1, colorScheme: theme });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {}
      window.__cls = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__cls.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), recent: e.hadRecentInput, src: (e.sources || []).map(s => s.node && (s.node.id || s.node.className || s.node.nodeName)).slice(0, 4) }); }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {} }, theme);
    const page = await ctx.newPage(); const log = []; watch(page, log);
    const id = `${mname}-${theme}`; const rec = out[id] = {};
    await page.goto(base + '/contact/', { waitUntil: 'load', timeout: 60000 });
    const snap = () => page.evaluate(() => { const R = e => { if (!e) return null; const x = e.getBoundingClientRect(); return { l: +x.left.toFixed(1), t: +(x.top + scrollY).toFixed(1), w: +x.width.toFixed(1), h: +x.height.toFixed(1), r: +x.right.toFixed(1) }; };
      const slot = document.getElementById('hcaptcha-slot'), form = document.getElementById('contact-form'), fr = slot.querySelector('iframe'); const cs = getComputedStyle(form);
      return { scrollY, slot: R(slot), slotTheme: slot.getAttribute('data-theme'), slotTransform: getComputedStyle(slot).transform, iframe: R(fr), iframeTitle: fr && fr.title, iframeSrc: fr && fr.src.slice(0, 160), textarea: !!slot.querySelector('textarea[name="h-captcha-response"]'),
        form: R(form), formInnerRight: +(form.getBoundingClientRect().right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth)).toFixed(1), submit: R(document.getElementById('submit-btn')), pageH: document.documentElement.scrollHeight, overflowX: document.documentElement.scrollWidth - innerWidth, hcScripts: [...document.scripts].filter(s => /hcaptcha/.test(s.src)).map(s => s.src) }; });
    rec.atLoad = await snap();
    // go to the form the way a visitor does: scroll the slot into view
    await page.evaluate(() => document.getElementById('message').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(300);
    rec.beforeWidget = await snap();
    const t0 = Date.now();
    try { await page.waitForFunction(() => { const f = document.querySelector('#hcaptcha-slot iframe'); return f && f.getBoundingClientRect().height > 20; }, null, { timeout: 30000 }); rec.widgetMs = Date.now() - t0; } catch (e) { rec.widgetTimeout = true; }
    await page.waitForTimeout(3500);
    rec.afterWidget = await snap();
    rec.cls = await page.evaluate(() => window.__cls);
    // what the widget itself shows (read-only look inside hCaptcha's frame)
    const fr = page.frames().find(f => /hcaptcha\.com\/captcha|newassets\.hcaptcha\.com\/captcha.*checkbox/.test(f.url()) && /checkbox/.test(f.url()));
    if (fr) { try { rec.widget = await fr.evaluate(() => ({ text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 300), bg: getComputedStyle(document.querySelector('#anchor') || document.body).backgroundColor, warn: (document.querySelector('.warning,#warning,[class*=warn]') || {}).innerText || null, w: innerWidth, h: innerHeight })); } catch (e) { rec.widget = { err: String(e).slice(0, 200) }; } }
    await page.evaluate(() => document.getElementById('hcaptcha-slot').scrollIntoView({ block: 'center' })); await page.waitForTimeout(400);
    await page.screenshot({ path: `shots/contact/${tag}__captcha__${id}.png` });
    rec.log = log.filter(l => l.t !== 'response' || l.status >= 400).filter(l => !/Origin trial|GL Driver|Ignoring Event/.test(l.text || ''));
    rec.hosts = [...new Set(log.filter(l => l.t === 'response').map(l => { try { return new URL(l.url).host; } catch (e) { return l.url; } }))];
    await ctx.close();
    console.log(id, 'widget', rec.widgetTimeout ? 'TIMEOUT' : rec.widgetMs + 'ms');
  }
  fs.writeFileSync(`contact1-${tag}.json`, JSON.stringify(out, null, 1));
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
