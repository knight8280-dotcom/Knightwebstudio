  // Set the theme before first paint, so nobody sees a flash of the wrong
  // one. Light is the default: a saved choice wins, otherwise a device set
  // to dark gets the night theme. main.js still owns the toggle itself.
  (function () {
    var d = document.documentElement; d.classList.add('js');
    // The header crest builds itself on the first page of a visit only
    try { if (!sessionStorage.getItem('kws-crest')) { d.classList.add('crest-intro'); sessionStorage.setItem('kws-crest', '1'); } } catch (e) {}
    try {
      var t = localStorage.getItem('theme');
      if (t !== 'dark' && t !== 'light') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      d.setAttribute('data-theme', t);
    } catch (e) { /* private mode: the stylesheet follows the device instead */ }
    // A visitor who paused the motion gets a still page from the first frame, also where shader.js is not loaded
    try { if (localStorage.getItem('kws-motion') === 'off') d.setAttribute('data-motion', 'off'); } catch (e) {}
    // Scroll reveals hide blocks until main.js shows them. A deferred script has
    // run, or failed, by DOMContentLoaded: if main.js has not started by then
    // (or the page has none), the page is a no-script page. If it is still on
    // its way after four seconds, show every block and leave the header alone.
    document.addEventListener('DOMContentLoaded', function () { if (!window.kwsReady) d.classList.remove('js'); });
    setTimeout(function () { if (!window.kwsReady) d.classList.add('show-all'); }, 4000);
    // The motion kit: hold each carousel's place until motion.js upgrades it, and give the plain lists back if it
    // never comes (a page without motion.js drops the classes at load and after four seconds)
    d.classList.add('kws-js', 'kws-hold');
    addEventListener('load', function () { if (!(window.KWS && KWS.folders)) d.classList.remove('kws-js'); });
    setTimeout(function () { if (!(window.KWS && KWS.folders)) d.classList.remove('kws-js'); d.classList.remove('kws-hold'); }, 4000);
  })();
