// Shared launcher: real network through the session proxy, nothing blocked.
const path = require('path');
let playwright;
try { playwright = require('playwright'); } catch (e) {
  playwright = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
}
const { chromium } = playwright;
const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy;
async function launch() {
  return chromium.launch({ proxy: PROXY ? { server: PROXY, bypass: 'localhost,127.0.0.1' } : undefined });
}
function watch(page, log) {
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') log.push({ t: 'console.' + m.type(), text: m.text().slice(0, 400) }); });
  page.on('pageerror', e => log.push({ t: 'pageerror', text: String(e).slice(0, 400) }));
  page.on('requestfailed', r => log.push({ t: 'requestfailed', url: r.url().slice(0, 200), err: r.failure() && r.failure().errorText }));
  page.on('response', r => { const u = r.url(); if (!/^http:\/\/localhost/.test(u)) log.push({ t: 'response', status: r.status(), url: u.slice(0, 200), type: r.request().resourceType() }); else if (r.status() >= 400) log.push({ t: 'local-error', status: r.status(), url: u }); });
}
module.exports = { launch, watch, chromium };
