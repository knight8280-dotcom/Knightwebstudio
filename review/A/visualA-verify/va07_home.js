const { open, done, close } = require('./lib');
(async () => {
  for (const w of [390, 1440]) {
    const page = await open('/', w);
    const r = await page.evaluate(() => [...document.querySelectorAll('.cal-log li')].map(li => { const icon = li.firstElementChild; const tn = [...li.childNodes].find(n => n.nodeType === 3 && n.textContent.trim()); if (!tn) return { html: li.innerHTML.slice(0, 80) }; const rg = document.createRange(); rg.selectNodeContents(tn); return { text: tn.textContent.trim(), icon: icon && icon.tagName, iconW: icon && +icon.getBoundingClientRect().width.toFixed(1), textX: +rg.getBoundingClientRect().left.toFixed(1), visible: !!li.offsetParent }; }));
    console.log('home cal-log', w, JSON.stringify(r));
    await done(page);
  }
  await close();
})();
