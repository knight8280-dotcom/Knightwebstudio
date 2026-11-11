const { chromium, firefox } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8730/kit/flat/demo.html';
const state = (p, sel) => p.evaluate(s => { const el = document.querySelector(s); const lis = [...el.querySelectorAll('li')];
  const part = el.querySelector('.kws-arc-tile') ? '.kws-arc-tile' : '.kws-spot-frame';
  return { on: lis.findIndex(li => li.classList.contains('is-on')), nOn: lis.filter(li => li.classList.contains('is-on')).length, moving: el.classList.contains('is-moving'), said: (el.querySelector('[aria-live]') || {}).textContent,
    tf: lis.map(li => li.querySelector(part).style.transform.replace(/\s+/g, '')), y: Math.round(scrollY) }; }, sel);
const settle = async (p, sel, ms = 3000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (!(await p.evaluate(s => document.querySelector(s).classList.contains('is-moving'), sel))) return true; await p.waitForTimeout(30); } return false; };
const scrollToSel = (p, sel, off = 160) => p.evaluate(([s, o]) => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - o); }, [sel, off]);
module.exports = { chromium, firefox, URL, state, settle, scrollToSel };
