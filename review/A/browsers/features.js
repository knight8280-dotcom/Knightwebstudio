// Prints what a WebKit build supports. PWCORE=path to playwright(-core) module
const pwPath = process.env.PWCORE || '/opt/node-tools/node_modules/playwright';
const { webkit } = require(pwPath);
(async () => {
  const b = await webkit.launch(); const p = await b.newPage();
  await p.goto('http://localhost:8720/404.html');
  const r = await p.evaluate(() => {
    const S = (a, b) => { try { return b === undefined ? CSS.supports(a) : CSS.supports(a, b); } catch (e) { return 'err'; } };
    const out = {
      ua: navigator.userAgent.match(/Version\/[\d.]+/)[0],
      'container-type': S('container-type', 'inline-size'), 'cqi unit': S('width', '1cqi'), subgrid: S('grid-template-rows', 'subgrid'),
      ':has()': S('selector(:has(a))'), 'text-wrap: balance': S('text-wrap', 'balance'), 'text-wrap: pretty': S('text-wrap', 'pretty'),
      'translate prop': S('translate', '0 -50%'), 'rotate prop': S('rotate', '2deg'), 'color-mix': S('color', 'color-mix(in srgb, red, blue)'),
      'overflow: clip': S('overflow-x', 'clip'), 'aspect-ratio': S('aspect-ratio', '16 / 9'), inset: S('inset', 'auto 0 0'), dvh: S('height', '100dvh'),
      ':focus-visible': S('selector(:focus-visible)'), 'overscroll-behavior': S('overscroll-behavior', 'contain'), 'scroll-margin-top': S('scroll-margin-top', '1px'),
      'mask-size': S('mask-size', '100% 100%'), '-webkit-mask-size': S('-webkit-mask-size', '100% 100%'), 'accent-color': S('accent-color', 'red'),
      'text-decoration: underline <color>': S('text-decoration', 'underline red'), 'text-decoration-thickness': S('text-decoration-thickness', '.08em'),
      'font-synthesis: none': S('font-synthesis', 'none'), 'appearance': S('appearance', 'none'), 'display: flow-root': S('display', 'flow-root'), 'display: contents': S('display', 'contents'),
      'gap (flex)': S('gap', '1px'), 'env()': S('padding-bottom', 'env(safe-area-inset-bottom, 0px)'), 'min() in width': S('width', 'min(100% - 2 * 20px, 1240px)'), 'clamp': S('font-size', 'clamp(1rem, 2vw, 2rem)'),
      'transform-box': S('transform-box', 'fill-box'), 'forced-color-adjust': S('forced-color-adjust', 'none'), 'columns': S('columns', '2'), 'width: fit-content': S('width', 'fit-content'),
      'isolation': S('isolation', 'isolate'), 'place-items': S('place-items', 'center'), 'margin-inline': S('margin-inline', 'auto'), 'padding-block 2 values': S('padding-block', '1px 2px'),
      'scroll-padding': S('scroll-padding', '10px 0 5px'), 'scroll-behavior': S('scroll-behavior', 'smooth'), 'font-variation-settings': S('font-variation-settings', '"SOFT" 100'),
      'size-adjust (@font-face, cannot test via supports)': 'n/a', inertProp: 'inert' in HTMLElement.prototype, structuredClone: typeof structuredClone, IntersectionObserver: typeof IntersectionObserver,
      'CSS.escape': typeof CSS.escape, 'Promise.finally': typeof Promise.prototype.finally, URLSearchParams: typeof URLSearchParams, 'matchMedia.addEventListener': typeof matchMedia('(min-width:1px)').addEventListener,
      'details toggle': 'open' in document.createElement('details'), 'selectedOptions': 'selectedOptions' in document.createElement('select'), 'focus preventScroll (cannot detect)': 'n/a',
      '@container parses': (() => { const s = document.createElement('style'); s.textContent = '@container (max-width: 10px) { a { color: red } }'; document.head.appendChild(s); const n = s.sheet.cssRules.length; s.remove(); return n === 1; })(),
      '@supports selector()': S('selector(a)'),
      'nesting parses': (() => { const s = document.createElement('style'); s.textContent = 'a { & b { color: red } }'; document.head.appendChild(s); const n = s.sheet.cssRules[0] && s.sheet.cssRules[0].cssRules ? s.sheet.cssRules[0].cssRules.length : 0; s.remove(); return n === 1; })(),
      '@layer parses': (() => { const s = document.createElement('style'); s.textContent = '@layer x { a { color: red } }'; document.head.appendChild(s); const n = s.sheet.cssRules.length; s.remove(); return n === 1; })(),
    };
    return out;
  });
  console.log(JSON.stringify(r, null, 1)); await b.close();
})();
