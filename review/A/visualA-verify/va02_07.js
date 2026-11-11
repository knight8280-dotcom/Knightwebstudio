// VA-02 .. VA-07 : own measurements + screenshots
const { open, done, close, shotEl } = require('./lib');
const path = require('path');
const OUT = __dirname;
const R = v => Math.round(v * 10) / 10;
(async () => {
  // ---- VA-02 consulting head / toc
  for (const w of [980, 1100, 1280, 1440, 1920]) {
    const page = await open('/consulting/', w);
    const r = await page.evaluate(() => {
      const c = document.querySelector('.page-head .container'); const cs = getComputedStyle(c);
      const inner = c.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const cl = c.getBoundingClientRect().left + parseFloat(cs.paddingLeft);
      const q = s => document.querySelector(s).getBoundingClientRect();
      const h1 = q('.page-head h1'), lede = q('.page-head .lede'), strip = q('.page-head .price-strip'), toc = q('.toc');
      return { inner, h1Right: h1.right - cl, ledeRight: lede.right - cl, stripRight: strip.right - cl, stripBottom: strip.bottom, tocW: toc.width, tocTop: toc.top, tocRightEmpty: inner - toc.width, headRightEmpty: inner - Math.max(lede.right, strip.right) + cl, vh: innerHeight };
    });
    console.log('VA-02 consulting', w, JSON.stringify(r, (k, v) => typeof v === 'number' ? R(v) : v));
    if ([1280, 1440, 1920].includes(w)) { await page.screenshot({ path: path.join(OUT, `va02_consulting_${w}_first.png`) }); await page.evaluate(() => scrollTo(0, innerHeight * 0.8)); await page.waitForTimeout(300); await page.screenshot({ path: path.join(OUT, `va02_consulting_${w}_second.png`) }); }
    await done(page);
  }
  // other four pages' first screen at 1280 for comparison
  for (const p of ['/', '/start/', '/pricing/', '/services/']) {
    const page = await open(p, 1280);
    await page.screenshot({ path: path.join(OUT, `va02_cmp_${p.replace(/\//g, '') || 'home'}_1280_first.png`) });
    await done(page);
  }

  // ---- VA-03 pricing care head
  for (const w of [960, 980, 1100, 1280, 1440, 1920]) {
    const page = await open('/pricing/', w);
    const r = await page.evaluate(() => {
      const out = {};
      document.querySelectorAll('.section-head-split').forEach(h => {
        const sec = h.closest('section'); const key = h.id || (sec && sec.id) || 'x';
        const ey = h.querySelector('.eyebrow'), h2 = h.querySelector('h2'), sub = h.querySelector('.section-sub') || h.lastElementChild;
        const cs = getComputedStyle(h);
        out[key + ':' + h2.textContent.trim().slice(0, 28)] = { align: cs.alignItems, cols: cs.gridTemplateColumns, eyebrowTop: ey && ey.getBoundingClientRect().top + scrollY, h2Top: h2.getBoundingClientRect().top + scrollY, h2Bottom: h2.getBoundingClientRect().bottom + scrollY, subTop: sub.getBoundingClientRect().top + scrollY, subBottom: sub.getBoundingClientRect().bottom + scrollY, subH: sub.getBoundingClientRect().height };
      });
      return out;
    });
    for (const k in r) { const v = r[k]; console.log('VA-03 pricing', w, k, JSON.stringify(v, (kk, x) => typeof x === 'number' ? R(x) : x), 'subAboveEyebrow=', v.eyebrowTop != null ? R(v.eyebrowTop - v.subTop) : 'n/a'); }
    if ([1280, 1440].includes(w)) {
      const heads = await page.$$('.section-head-split');
      let i = 0;
      for (const h of heads) { await h.scrollIntoViewIfNeeded(); await page.evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - 200), h); await page.waitForTimeout(350); await page.screenshot({ path: path.join(OUT, `va03_pricing_${w}_head${i++}.png`) }); }
    }
    await done(page);
  }
  // other pages: how are section-head-split aligned
  for (const p of ['/', '/start/', '/consulting/', '/services/']) {
    const page = await open(p, 1440);
    const r = await page.evaluate(() => [...document.querySelectorAll('.section-head-split')].map(h => { const ey = h.querySelector('.eyebrow'), h2 = h.querySelector('h2'), sub = h.lastElementChild; const first = h.firstElementChild; return { h2: h2.textContent.trim().slice(0, 30), align: getComputedStyle(h).alignItems, firstTop: Math.round(first.getBoundingClientRect().top + scrollY), subTop: Math.round(sub.getBoundingClientRect().top + scrollY), firstBottom: Math.round(first.getBoundingClientRect().bottom + scrollY), subBottom: Math.round(sub.getBoundingClientRect().bottom + scrollY) }; }));
    console.log('VA-03 others', p, JSON.stringify(r));
    await done(page);
  }

  // ---- VA-04 / VA-05 / VA-06 services
  for (const w of [390, 760, 820, 980, 1000, 1280, 1440, 1920]) {
    const page = await open('/services/', w);
    const r = await page.evaluate(() => {
      const Y = e => e.getBoundingClientRect();
      const out = {};
      for (const id of ['website-design', 'care', 'automation']) {
        const root = document.getElementById(id);
        const h3 = root.querySelector('h3.h2'), tag = root.querySelector('.tag'), ey = root.querySelector('.eyebrow');
        const sec = root.closest('section');
        out[id] = { h3: [Y(h3).left, Y(h3).top + scrollY, Y(h3).bottom + scrollY].map(Math.round), tag: [Y(tag).left, Y(tag).top + scrollY, Y(tag).bottom + scrollY].map(Math.round), tagBeside: Y(tag).top < Y(h3).bottom - 4, eyebrowTopFromSectionTop: Math.round(Y(ey).top - Y(sec).top), secPadTop: getComputedStyle(sec).paddingTop };
      }
      const menu = document.querySelector('.menu'); const build = document.getElementById('build');
      out.menuBottomToBuildEyebrow = Math.round(Y(build.querySelector('.eyebrow')).top - Y(menu).bottom);
      out.buildMarginTop = getComputedStyle(build).marginTop;
      const lead = build.querySelector('.svc-lead'), acc = build.querySelector('.faq');
      out.build = { cols: getComputedStyle(build).gridTemplateColumns, leadH: Math.round(Y(lead).height), accH: Math.round(Y(acc).height), leadTop: Math.round(Y(lead).top + scrollY), accTop: Math.round(Y(acc).top + scrollY), accPos: getComputedStyle(acc).position, leadPos: getComputedStyle(lead).position, accParentPos: getComputedStyle(acc).alignSelf };
      out.open = [...document.querySelectorAll('main details')].map(d => d.querySelector('.pl-name').textContent + ':' + d.open);
      out.buttons = [...document.querySelectorAll('main a.btn, main button.btn')].map(b => ({ t: b.textContent.trim().slice(0, 34), x: Math.round(Y(b).left), w: Math.round(Y(b).width), h: Math.round(Y(b).height), parent: b.parentElement.className, parentW: Math.round(Y(b.parentElement).width) }));
      return out;
    });
    console.log('VA-04/05/06 services', w, JSON.stringify(r));
    if ([1440, 1280, 820].includes(w)) {
      await page.evaluate(() => scrollTo(0, document.querySelector('.menu').getBoundingClientRect().bottom + scrollY - 260)); await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(OUT, `va04_services_${w}_board_to_build.png`) });
      await page.evaluate(() => scrollTo(0, document.querySelector('#keep').getBoundingClientRect().top + scrollY - 200)); await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(OUT, `va04_services_${w}_keep_win.png`) });
    }
    if (w === 390) {
      await page.evaluate(() => scrollTo(0, document.querySelector('#website-design').getBoundingClientRect().top + scrollY - 140)); await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(OUT, `va06_services_390_lead.png`) });
    }
    await done(page);
  }

  // ---- VA-07 consulting cal-log
  for (const w of [390, 1440]) {
    const page = await open('/consulting/', w, { dsf: 3 });
    const r = await page.evaluate(() => [...document.querySelectorAll('.cal-log li')].map(li => {
      const icon = li.firstElementChild; const tn = [...li.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
      const rg = document.createRange(); rg.selectNodeContents(tn); const tb = rg.getBoundingClientRect();
      return { text: tn.textContent.trim(), iconTag: icon.tagName, iconW: +icon.getBoundingClientRect().width.toFixed(1), iconLeft: +icon.getBoundingClientRect().left.toFixed(1), textX: +tb.left.toFixed(1) };
    }));
    console.log('VA-07 consulting', w, JSON.stringify(r));
    await shotEl(page, '.cal-log', path.join(OUT, `va07_consulting_${w}_callog.png`), 30);
    await done(page);
  }
  await close();
})();
