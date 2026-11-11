const { chromium } = require('/opt/node-tools/node_modules/playwright');
const BASE = 'http://localhost:8720';
const PAGES = ['/','/services/','/consulting/','/work/','/process/','/pricing/','/faq/','/contact/','/about/','/start/','/web-design-baton-rouge/','/web-design-denham-springs/','/web-design-gonzales/','/web-design-prairieville/','/privacy/','/terms/','/checkout/','/checkout/success/','/404.html'];
const slug = p => p === '/' ? 'home' : p.replace(/^\/|\/$/g, '').replace(/[\/.]/g, '_');
const BLOCK = /plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com|web3forms\.com/;
async function ctxFor(b, { w = 1280, h = 800, theme = 'light', reduced = false, mobile = false, forced = false, extra = {} } = {}) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: reduced ? 'reduce' : 'no-preference', isMobile: mobile, hasTouch: mobile, forcedColors: forced ? 'active' : 'none' }, extra));
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(BLOCK, r => r.abort());
  return ctx;
}
module.exports = { chromium, BASE, PAGES, slug, BLOCK, ctxFor };
