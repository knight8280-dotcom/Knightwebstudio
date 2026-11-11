// Width ratio of the site's fonts to the Android system faces, to set size-adjust on the fallback @font-face rules.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const b64 = f => fs.readFileSync(f).toString('base64');
const here = __dirname, fonts = '/home/user/Knightwebstudio/assets/fonts';
(async () => {
  const br = await chromium.launch(); const p = await br.newPage();
  const face = (name, file, extra = '') => `@font-face { font-family: "${name}"; src: url(data:font/woff2;base64,${b64(file)}) format("woff2"); ${extra} }`;
  await p.setContent(`<style>
    ${face('Fraunces', fonts + '/fraunces-soft.woff2', 'font-weight: 100 900;')}
    ${face('Figtree', fonts + '/figtree.woff2', 'font-weight: 300 900;')}
    ${face('NotoSerif', here + '/noto-serif.woff2')}
    ${face('RobotoT', here + '/roboto.woff2')}
    span { font-size: 100px; white-space: nowrap; position: absolute; }
  </style><body></body>`);
  const body = 'We build fast, modern websites, then set up the systems behind them: Google reviews, missed-call text-back, online booking and automatic follow-up. One local partner for getting found, getting chosen and getting your evenings back. Every price here is fixed, for websites, consulting and automation alike.';
  const heads = 'More customers, fewer missed calls, hours back every week Fixed prices, published up front Four packages. Pick the one that fits. Systems that win customers and save time $1,000 $2,000 $4,000 $8,000 Care plans Questions we get asked';
  const w = (text, css) => p.evaluate(async ([text, css]) => { const s = document.createElement('span'); s.style.cssText = css; s.textContent = text; document.body.append(s); await document.fonts.load(s.style.font || '100px ' + s.style.fontFamily, text); await document.fonts.ready; const r = s.getBoundingClientRect().width; s.remove(); return r; }, [text, css]);
  const fr = await w(heads, 'font-family: Fraunces; font-weight: 600; font-variation-settings: "SOFT" 100; letter-spacing: -.018em');
  const ns = await w(heads, 'font-family: NotoSerif; font-weight: 400; font-synthesis: none; letter-spacing: -.018em');
  const fg = await w(body, 'font-family: Figtree; font-weight: 400');
  const rb = await w(body, 'font-family: RobotoT; font-weight: 400');
  console.log('Fraunces 600 / Noto Serif 400:', (fr / ns).toFixed(4), ' Figtree 400 / Roboto 400:', (fg / rb).toFixed(4));
  await br.close();
})();
