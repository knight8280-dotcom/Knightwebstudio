// lists selectors in home.css that match nothing on the built page (at any width they are static, so one load is enough)
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const css = fs.readFileSync('/home/user/Knightwebstudio/assets/css/pages/home.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const sels = new Set();
  css.replace(/([^{}@]+)\{[^{}]*\}/g, (m, s) => { s.split(',').forEach(x => { x = x.trim(); if (x && !/^(from|to|\d+%)$/.test(x)) sels.add(x); }); return ''; });
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('http://localhost:8720/', { waitUntil: 'load' });
  const res = await p.evaluate(list => list.map(s => { try { return [s, document.querySelectorAll(s.replace(/::(before|after)/g, '')).length]; } catch (e) { return [s, 'ERR ' + e.message]; } }), [...sels]);
  for (const [s, n] of res) if (!n || typeof n === 'string') console.log(n, '|', s);
  console.log(res.length, 'selectors checked');
  await b.close();
})();
