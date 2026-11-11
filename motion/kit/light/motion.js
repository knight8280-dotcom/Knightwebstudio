/* KnightWebstudio motion kit: the pause button for everything that moves by itself (WCAG 2.2.2).
   Load on every page, with defer, beside motion.css. No dependencies. Notes: NOTES.md.

     <button class="kws-motion" data-kws="motion" type="button" hidden>
       <svg class="kws-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>
       <svg class="kws-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
       <span class="kws-motion-label"></span>      (optional: leave it out for a round icon button)
     </button>

   Pressing it sets data-motion="off" on <html> (or takes it away) and keeps the choice in
   localStorage under "kws-motion". With no saved choice, motion is off when the device asks for
   reduced motion. Every moving thing in the kit obeys html[data-motion="off"].
   Words, in any language: data-pause, data-play (the button), data-paused, data-playing (what a
   screen reader is told). Defaults: Pause motion, Play motion, Motion paused, Motion playing.
   From script: KWS.motion.off() is true while paused; KWS.motion.set(true) pauses;
   KWS.motion.mount(button) returns a function that takes the button away again;
   document hears "kws:motion" with event.detail.off. */
(function () {
  'use strict';
  var KWS = window.KWS = window.KWS || {}, doc = document, html = doc.documentElement, KEY = 'kws-motion';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)'), btns = [], ends = new WeakMap(), status = null;

  function off() { return html.getAttribute('data-motion') === 'off'; }
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function word(b, name, fallback) { return b.getAttribute('data-' + name) || fallback; }

  /* The button says what pressing it will do. With a label inside, the label is its name */
  function label(b) {
    var text = off() ? word(b, 'play', 'Play motion') : word(b, 'pause', 'Pause motion'), span = b.querySelector('.kws-motion-label');
    if (span) { span.textContent = text; b.removeAttribute('aria-label'); b.removeAttribute('title'); }
    else { b.setAttribute('aria-label', text); b.title = text; }
  }
  function apply(v, keep) {
    var was = off();
    v = !!v;
    if (v) html.setAttribute('data-motion', 'off'); else html.removeAttribute('data-motion');
    if (keep) try { localStorage.setItem(KEY, v ? 'off' : 'on'); } catch (e) {}
    btns = btns.filter(function (b) { return b.isConnected; });   // forget buttons that have left the page
    btns.forEach(label);
    if (was !== v) doc.dispatchEvent(new CustomEvent('kws:motion', { detail: { off: v } }));
  }
  /* The saved choice, else what the device asks for. Run at load, when another tab changes the
     choice, when a page comes back from the back-forward cache, and when the device setting changes */
  function sync() {
    var s = saved();
    apply(s ? s === 'off' : reduce.matches);
  }
  function say(b) {
    if (!status) {
      status = doc.createElement('span');
      status.className = 'kws-sr';
      status.setAttribute('role', 'status');
      doc.body.appendChild(status);
    }
    status.textContent = off() ? word(b, 'paused', 'Motion paused') : word(b, 'playing', 'Motion playing');
  }
  function mount(b) {
    if (!b) return function () {};
    if (ends.has(b)) return ends.get(b);   // mounted twice: one listener, one remover
    function click() { apply(!off(), true); say(b); }
    function end() {
      if (ends.get(b) !== end) return;
      ends.delete(b);
      b.removeEventListener('click', click);
      b.hidden = true;
      btns = btns.filter(function (x) { return x !== b; });
    }
    b.addEventListener('click', click);
    b.hidden = false;
    btns.push(b);
    label(b);
    ends.set(b, end);
    return end;
  }

  // A page may ship with data-motion="off" already set: that counts until a choice is saved
  apply(saved() ? saved() === 'off' : off() || reduce.matches);
  window.addEventListener('storage', function (e) { if (e.key === KEY || e.key === null) sync(); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) sync(); });
  reduce.addEventListener('change', sync);

  KWS.motion = { off: off, set: function (v) { apply(v, true); }, mount: mount };

  function start() { [].forEach.call(doc.querySelectorAll('[data-kws="motion"]'), mount); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})();
