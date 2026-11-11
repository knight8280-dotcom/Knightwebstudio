/* ==========================================================================
   KnightWebstudio — site behaviour
   No dependencies. Every block is independent, so removing one is safe.
   ========================================================================== */
(function () {
  'use strict';

  // The head snippet shows every scroll-reveal block if this script has not
  // started within a few seconds; say that it has, and take the page back.
  window.kwsReady = true;
  document.documentElement.classList.add('js');

  /* ---------- Site settings — EDIT ME ----------
     Both are off while empty, so nothing half-configured ever ships.

     bookingUrl      Your public scheduling link (Cal.com, Calendly…). When
                     set, every "Book a discovery call" button opens it, and
                     the contact page shows a "Book a 30-minute call" option
                     beside the form. Empty: those buttons go to /contact/.
     analyticsScript The script URL from Plausible's install snippet (Site
                     settings → Site installation; it looks like
                     https://plausible.io/js/pa-XXXX.js). When set, loads
                     Plausible's cookieless tracking and records an "Enquiry"
                     goal on each sent form and a "Book call" goal on each
                     booking click. Create both as custom-event goals in the
                     Plausible dashboard. Keep the analytics paragraph on
                     /privacy/ in step with this setting. */
  var SITE_CONFIG = {
    bookingUrl: 'https://calendly.com/knightwebstudio1/30min',
    analyticsScript: 'https://plausible.io/js/pa-M8H39gIN2J-TgmR4OOcVA.js'
  };

  function track(goal) {
    if (typeof window.plausible === 'function') window.plausible(goal);
  }

  if (SITE_CONFIG.analyticsScript) {
    // Plausible's own install snippet, unchanged: a queue stub so events
    // fired before the script arrives are kept, then init().
    window.plausible = window.plausible || function () {
      (window.plausible.q = window.plausible.q || []).push(arguments);
    };
    window.plausible.init = window.plausible.init || function (i) {
      window.plausible.o = i || {};
    };
    window.plausible.init();
    var pa = document.createElement('script');
    pa.async = true;
    pa.src = SITE_CONFIG.analyticsScript;
    document.head.appendChild(pa);
  }

  if (SITE_CONFIG.bookingUrl) {
    document.querySelectorAll('[data-booking]').forEach(function (a) {
      a.href = SITE_CONFIG.bookingUrl;
      a.target = '_blank';
      a.rel = 'noopener';
      a.addEventListener('click', function () { track('Book call'); });
    });
    document.querySelectorAll('.booking-only').forEach(function (el) { el.hidden = false; });
  }

  /* ---------- Wake the checkout server ----------
     The payment server is on Render's free plan, which sleeps after 15 idle
     minutes and takes up to a minute to wake. Pages with "Pay deposit" /
     "Start plan" buttons ping it once on load, so it is usually awake by
     the time a visitor clicks through to /checkout/. */
  if (document.querySelector('a[href^="/checkout/?plan="]') && window.fetch) {
    fetch('https://knightwebstudio-checkout.onrender.com/healthz', { mode: 'no-cors', cache: 'no-store' })
      .catch(function () { /* best effort only */ });
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Crest animation ----------
     The header crest builds itself on a visit's first page (the inline head
     script sets .crest-intro). After that, hovering the brand replays it. */
  function playCrest(svg) {
    if (!svg || reduceMotion) return;
    document.documentElement.classList.remove('crest-intro');
    svg.classList.remove('play');
    void svg.getBoundingClientRect();   // restart the animation
    svg.classList.add('play');
  }
  document.querySelectorAll('.brand').forEach(function (link) {
    var svg = link.querySelector('.crest');
    if (svg) link.addEventListener('mouseenter', function () { playCrest(svg); });
  });

  /* ---------- Theme toggle (remembers the choice) ---------- */
  var root = document.documentElement;
  var themeToggle = document.getElementById('theme-toggle');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeToggle) {
      themeToggle.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      );
    }
    // Browser chrome matches the paper (day) or the street after dark (night)
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#131722' : '#F6F0E4');
  }

  // The site is light first. A saved choice wins; otherwise a device set to
  // dark gets the night theme. The inline head script has already set
  // data-theme before first paint; this keeps the button label and the
  // browser chrome colour in step with it.
  var storedTheme = null;
  try { storedTheme = localStorage.getItem('theme'); } catch (e) { /* private mode */ }

  if (storedTheme === 'dark' || storedTheme === 'light') {
    applyTheme(storedTheme);
  } else {
    applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
    });
  }

  // A page restored from the back/forward cache keeps the theme it had when
  // the visitor left; bring it in step with a choice made since.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    var t = null;
    try { t = localStorage.getItem('theme'); } catch (err) { /* private mode */ }
    if (t === 'dark' || t === 'light') applyTheme(t);
  });

  /* ---------- Phone menu ----------
     Below 1100px the menu is a full sheet. While it is open the page behind
     it cannot scroll and is inert, so Tab stays inside the header. The sheet
     starts at the header's bottom edge (--nav-top), so its list scrolls under
     nothing, and focus moves to the first link. */
  var navToggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('nav');
  var behindNav = Array.prototype.slice.call(document.querySelectorAll('.skip-link, .topbar, main, .site-footer, .mobile-cta'));

  function setNavOpen(open) {
    if (!nav || !navToggle) return;
    var bar = navToggle.closest('.site-header');
    var list = nav.querySelector('.nav-inner');
    var atTop = window.scrollY < 4;
    // The sheet fades only once it has been opened: crossing the breakpoint must not flash it
    if (open) nav.classList.add('nav-anim');
    if (open && bar) nav.style.setProperty('--nav-top', Math.round(bar.getBoundingClientRect().bottom) + 'px');
    nav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    // At the top of the page the strip with the phone number stays in view above the sheet, and stays usable
    behindNav.forEach(function (el) { el.inert = open && !(atTop && el.classList.contains('topbar')); });
    if (open) {
      if (list) list.scrollTop = 0;
      var first = nav.querySelector('a');
      if (first) first.focus({ preventScroll: true });
    }
  }
  function closeNav() { setNavOpen(false); }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      setNavOpen(!nav.classList.contains('open'));
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        closeNav();
        navToggle.focus({ preventScroll: true });
      }
    });

    // Leaving the breakpoint with the sheet open would strand the scroll lock
    var desktop = window.matchMedia('(min-width: 1100px)');
    var onDesktop = function (e) { if (e.matches) { closeNav(); nav.classList.remove('nav-anim'); } };
    if (desktop.addEventListener) desktop.addEventListener('change', onDesktop);
    else if (desktop.addListener) desktop.addListener(onDesktop);
  }

  /* ---------- Header scroll state + reading line ---------- */
  var header = document.getElementById('site-header');
  var progress = document.getElementById('scroll-progress');
  var ticking = false;

  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 8);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ')';
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  var revealables = document.querySelectorAll('.reveal');
  // A block shows as soon as any of it is above the foot of the screen. The
  // foot is a share of the window, never a share of the block, so a block
  // taller than a short (zoomed) window still shows. Where the sticky phone
  // bar (69px) covers the foot, the foot is 12%: about 100px on a phone.
  var revealFoot = document.getElementById('mobile-cta') && window.matchMedia('(max-width: 1099.98px)').matches ? 12 : 3;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        // A short stagger so a row of cards cascades, capped at 120ms so the
        // last card is never still faded when the reader reaches it.
        setTimeout(function () { entry.target.classList.add('visible'); }, Math.min(i, 3) * 40);
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -' + revealFoot + '% 0px' });

    revealables.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Mobile sticky CTA ----------
     Appears once the hero is behind you, and gets out of the way over the
     contact section, the closing band (.kws-close, or .cta-band on an older
     page; both have their own booking button) and the footer, so it never
     covers what it points at. */
  var mobileCta = document.getElementById('mobile-cta');
  if (mobileCta) {
    mobileCta.hidden = false;
    // Sub-pages have no #contact section, only the footer — observe whichever
    // exists, and track each target separately so one leaving the viewport
    // doesn't cancel the other still being in it.
    var avoid = [document.getElementById('contact'), document.querySelector('.cta-band, .kws-close'), document.querySelector('.site-footer')]
      .filter(Boolean);
    var inView = [];
    var nearForm = false;

    if ('IntersectionObserver' in window && avoid.length) {
      var ctaObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { inView[avoid.indexOf(e.target)] = e.isIntersecting; });
        nearForm = inView.some(Boolean);
        updateCta();
      }, { threshold: 0 });
      avoid.forEach(function (el) { ctaObs.observe(el); });
    }

    var ctaShown = false;
    function updateCta() {
      var past = window.scrollY > window.innerHeight * 0.6;
      var show = past && !nearForm && !(nav && nav.classList.contains('open'));
      if (show !== ctaShown) { ctaShown = show; mobileCta.classList.toggle('show', show); }
    }
    window.addEventListener('scroll', function () {
      window.requestAnimationFrame(updateCta);
    }, { passive: true });
    updateCta();
  }

  /* ---------- hCaptcha ----------
     Deferred rather than loaded with the page, so no third-party iframe sits
     in the contact section during first paint. Uses hCaptcha's auto-render:
     the script renders every .h-captcha element it finds when it parses, which
     is one moving part instead of an explicit-render callback that silently
     leaves no widget if anything in the chain fails.
     recaptchacompat=off is required: without it hCaptcha also adds a
     g-recaptcha-response field, and Web3Forms (free plan) rejects the
     submission as a reCAPTCHA one, which sent visitors to the mailto
     fallback. */
  var captchaSlot = document.getElementById('hcaptcha-slot');
  var captchaRequested = false;

  function loadCaptcha() {
    if (captchaRequested || !captchaSlot) return;
    captchaRequested = true;
    // The widget is drawn for the theme in use when it loads
    captchaSlot.setAttribute('data-theme', root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    var sc = document.createElement('script');
    sc.src = 'https://js.hcaptcha.com/1/api.js?recaptchacompat=off';
    sc.async = true; sc.defer = true;
    document.head.appendChild(sc);
  }

  if (captchaSlot) {
    if ('IntersectionObserver' in window) {
      // No margin: the script is asked for when the slot itself comes into
      // view, so a tall window does not fetch it with the page.
      var capObs = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) {
          loadCaptcha();
          capObs.disconnect();
        }
      }, { rootMargin: '0px' });
      capObs.observe(captchaSlot);
    } else {
      loadCaptcha();
    }
    var cf0 = document.getElementById('contact-form');
    if (cf0) cf0.addEventListener('focusin', loadCaptcha, { once: true });
    // Backstop: whatever the visitor does, the widget is ready long before
    // they can fill the form. Late enough to stay out of first paint.
    setTimeout(loadCaptcha, 4000);
  }

  /* ---------- Contact form: validation + async submit ---------- */
  var form = document.getElementById('contact-form');

  if (form) {
    var statusEl = document.getElementById('form-status');
    var submitBtn = document.getElementById('submit-btn');
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var emptyMessage = {
      name: 'Add your name.',
      email: 'Add your email address so we can reply.',
      message: 'Tell us a little about what you need.'
    };
    var fieldsFlagged = false;   // "Please fix the highlighted fields." is showing

    function setError(field, message) {
      var errEl = document.getElementById(field.id + '-error');
      if (errEl) errEl.textContent = message;
      field.classList.toggle('invalid', Boolean(message));
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    function validateField(field) {
      var value = field.value.trim();

      if (!value) {
        setError(field, emptyMessage[field.id] || 'This field is required.');
        return false;
      }
      if (field.type === 'email' && !emailPattern.test(value)) {
        setError(field, 'Please enter a valid email address.');
        return false;
      }
      if (field.id === 'message' && value.length < 10) {
        setError(field, 'Please add a little more detail (10 characters or more).');
        return false;
      }
      setError(field, '');
      return true;
    }

    /* Draft persistence — a half-written enquiry survives a tab switch, a
       phone call or an accidental back button. Cleared on a successful send.
       Kept to this device: nothing is transmitted anywhere. */
    var DRAFT_KEY = 'kws-enquiry-draft';
    var draftFields = ['name', 'email', 'company', 'package', 'message'];

    function saveDraft() {
      try {
        var d = {};
        draftFields.forEach(function (n) { if (form.elements[n]) d[n] = form.elements[n].value; });
        d.services = Array.prototype.slice.call(form.querySelectorAll('input[name="services"]:checked'))
          .map(function (c) { return c.value; });
        var empty = draftFields.every(function (n) { return !d[n]; }) && !d.services.length;
        if (empty) localStorage.removeItem(DRAFT_KEY);
        else localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
      } catch (e) { /* private mode, quota — a draft is never worth an error */ }
    }
    function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} }
    function restoreDraft() {
      try {
        var raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return;
        var d = JSON.parse(raw);
        draftFields.forEach(function (n) {
          if (form.elements[n] && typeof d[n] === 'string') form.elements[n].value = d[n];
        });
        (d.services || []).forEach(function (v) {
          var c = form.querySelector('input[name="services"][value="' + CSS.escape(v) + '"]');
          if (c) c.checked = true;
        });
      } catch (e) { /* ignore malformed or unavailable storage */ }
    }
    restoreDraft();

    // /contact/?package=business (the pricing page's buttons) picks the package
    try {
      var chosen = new URLSearchParams(location.search).get('package');
      var pkg = form.elements['package'];
      if (chosen && pkg && pkg.querySelector('option[value="' + CSS.escape(chosen) + '"]')) pkg.value = chosen;
    } catch (e) { /* old browser: the visitor picks it themselves */ }

    var draftTimer = null;
    form.addEventListener('input', function () {
      clearTimeout(draftTimer);
      draftTimer = setTimeout(saveDraft, 400);
    });
    form.addEventListener('change', saveDraft);

    var required = Array.prototype.slice.call(form.querySelectorAll('[required]'));

    function setStatus(message, kind) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.className = 'form-status' + (kind ? ' ' + kind : '');
    }

    // Once every flagged field is right, the line under the button goes too
    function clearFlag() {
      if (fieldsFlagged && !form.querySelector('.invalid')) { setStatus(''); fieldsFlagged = false; }
    }
    required.forEach(function (field) {
      field.addEventListener('blur', function () { validateField(field); clearFlag(); });
      field.addEventListener('input', function () {
        if (field.classList.contains('invalid')) { validateField(field); clearFlag(); }
      });
    });

    // Used when the POST fails, so a broken endpoint never costs an enquiry.
    // `form.elements` — `form.name` would resolve to the form's own name attribute.
    function mailtoFallback() {
      var f = form.elements;
      var needs = Array.prototype.slice.call(form.querySelectorAll('input[name="services"]:checked')).map(function (c) { return c.value; }).join(', ');
      var subject = encodeURIComponent('Website enquiry from ' + f.name.value.trim());
      var body = encodeURIComponent(
        'Name: ' + f.name.value.trim() + '\n' +
        'Email: ' + f.email.value.trim() + '\n' +
        'Business: ' + f.company.value.trim() + '\n' +
        'Package: ' + (f['package'].selectedOptions[0] || {}).text + '\n' +
        (needs ? 'Needs: ' + needs + '\n' : '') + '\n' +
        f.message.value.trim()
      );
      return 'mailto:knightwebstudio1@gmail.com?subject=' + subject + '&body=' + body;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstInvalid = null;
      required.forEach(function (field) {
        if (!validateField(field) && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        setStatus('Please fix the highlighted fields.', 'error');
        fieldsFlagged = true;
        return;
      }
      fieldsFlagged = false;

      // hCaptcha injects h-captcha-response into the form once solved.
      var captchaEl = document.getElementById('captcha-error');
      var captchaField = form.elements['h-captcha-response'];
      var widgetPresent = !!(captchaSlot && captchaSlot.querySelector('iframe, textarea'));

      if (widgetPresent && (!captchaField || !captchaField.value)) {
        if (captchaEl) captchaEl.textContent = 'Please tick the verification box above.';
        setStatus('');
        if (captchaSlot) captchaSlot.scrollIntoView({ block: 'center' });
        return;
      }
      if (captchaEl) captchaEl.textContent = '';

      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.textContent = 'Sending…';
      setStatus('');

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (response) {
          // Web3Forms reports rejections (bad key, spam heuristics) inside a
          // 200 body, so response.ok alone is not proof the mail was sent.
          return response.json()
            .catch(function () { return { success: response.ok }; })
            .then(function (data) {
              if (!response.ok || data.success === false) {
                throw new Error(data.message || 'Request failed with status ' + response.status);
              }
              form.reset();
              clearDraft();
              track('Enquiry');
              setStatus('Thanks — your enquiry is in. We’ll reply within one business day.', 'ok');
            });
        })
        .catch(function (err) {
          // Never lose an enquiry: hand the visitor a pre-filled email instead.
          var why = (err && err.message) ? ' (' + err.message + ')' : '';
          setStatus('Couldn’t send that' + why + '. Opening your email app so nothing is lost…', 'error');
          window.location.href = mailtoFallback();
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.removeAttribute('aria-busy');
          submitBtn.textContent = 'Send enquiry';
          // Tokens are single-use — without this a second send always fails.
          if (window.hcaptcha) { try { window.hcaptcha.reset(); } catch (e) { /* not rendered */ } }
        });
    });
  }

  /* ---------- Links into a closed row ----------
     /services/#seo points inside a <details>. Current browsers open it on
     their own; this does it for the ones that do not. */
  function openTarget() {
    var target = null;
    try { target = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { /* malformed hash */ }
    var row = target && target.closest('details');
    if (row && !row.open) { row.open = true; target.scrollIntoView(); }
  }
  openTarget();
  window.addEventListener('hashchange', openTarget);

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
