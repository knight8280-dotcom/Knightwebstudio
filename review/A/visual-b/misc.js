const { chromium } = require('playwright');
const BASE = 'http://localhost:8720', OUT = __dirname + '/misc/';
(async () => {
  const browser = await chromium.launch();
  for (const [name, w, h, theme, mob] of [['m-light', 390, 844, 'light', 1], ['m-dark', 390, 844, 'dark', 1], ['s-light', 360, 740, 'light', 1], ['t-light', 820, 1100, 'light', 0]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, isMobile: !!mob, hasTouch: !!mob });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    await ctx.route(/hcaptcha\.com/, r => r.fulfill({ contentType: 'application/javascript', body: `(function(){var s=document.getElementById('hcaptcha-slot');if(s)s.innerHTML='<iframe style="width:303px;height:78px;border:0;background:#fafafa;outline:1px solid #999" srcdoc="x"></iframe>';})();` }));
    // phone menu open
    let page = await ctx.newPage(); await page.goto(BASE + '/work/'); await page.waitForTimeout(400);
    await page.click('#nav-toggle'); await page.waitForTimeout(600);
    await page.screenshot({ path: OUT + name + '__menu-open.png' });
    console.log(name, 'menu', JSON.stringify(await page.evaluate(() => { const n = document.getElementById('nav'); const r = n.getBoundingClientRect(); const links = [...n.querySelectorAll('a')].filter(a => a.getBoundingClientRect().height > 0); const last = links[links.length - 1].getBoundingClientRect(); return { nav: [Math.round(r.top), Math.round(r.bottom), Math.round(r.height)], vh: innerHeight, links: links.length, lastBottom: Math.round(last.bottom), scrollable: n.scrollHeight > n.clientHeight + 1, bodyOverflow: getComputedStyle(document.body).overflow, cta: (() => { const c = document.getElementById('mobile-cta'); if (!c) return null; const cr = c.getBoundingClientRect(); return [Math.round(cr.top), getComputedStyle(c).visibility, getComputedStyle(c).opacity]; })() }; })));
    await page.close();
    // captcha at real size
    page = await ctx.newPage(); await page.goto(BASE + '/contact/'); await page.waitForTimeout(300);
    await page.evaluate(() => { const s = document.getElementById('hcaptcha-slot'); window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 300); }); await page.waitForTimeout(4600);
    await page.screenshot({ path: OUT + name + '__captcha.png' });
    console.log(name, 'captcha', JSON.stringify(await page.evaluate(() => { const s = document.getElementById('hcaptcha-slot'); const f = s.querySelector('iframe'); if (!f) return 'no iframe'; const fr = f.getBoundingClientRect(); const card = s.closest('.card, form, .ticket') || s.parentElement; const cr = card.getBoundingClientRect(); const cs = getComputedStyle(card); const btn = document.getElementById('submit-btn').getBoundingClientRect(); return { iframe: [Math.round(fr.left), Math.round(fr.right), Math.round(fr.top), Math.round(fr.bottom)], card: [Math.round(cr.left), Math.round(cr.right)], padR: cs.paddingRight, innerRight: Math.round(cr.right - parseFloat(cs.paddingRight)), btnTop: Math.round(btn.top), gapToBtn: Math.round(btn.top - fr.bottom), docOverflow: document.documentElement.scrollWidth - innerWidth }; })));
    await page.close();
    await ctx.close();
  }
  // keyboard focus rings (desktop light + dark)
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: theme });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|calendly\.com|hcaptcha|js\.stripe\.com|onrender\.com/, r => r.abort());
    const page = await ctx.newPage(); await page.goto(BASE + '/faq/'); await page.waitForTimeout(300);
    const info = [];
    for (let i = 0; i < 22; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(60); info.push(await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return (a.tagName + '.' + (a.className || '').toString().split(' ')[0] + ' "' + a.textContent.trim().slice(0, 22) + '" outline=' + cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor + ' off=' + cs.outlineOffset + ' shadow=' + (cs.boxShadow === 'none' ? 'none' : 'yes')); })); if (i === 3 || i === 12 || i === 16 || i === 20) await page.screenshot({ path: OUT + 'focus-' + theme + '-' + i + '.png' }); }
    console.log(theme, 'focus\n  ' + info.join('\n  '));
    await ctx.close();
  }
  await browser.close();
})();
