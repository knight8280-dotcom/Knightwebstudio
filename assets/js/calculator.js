/* Consulting page: revenue & time estimate.
   Everything is calculated in the browser from the visitor's own numbers.
   Nothing is stored or sent. The page ships with the default results
   already written into the HTML, so it reads correctly without JS. */
(function () {
  'use strict';
  var form = document.getElementById('growth-calc');
  if (!form) return;

  var WEEKS_PER_MONTH = 52 / 12;
  var TEXT_BACK_SETUP = 750;

  function num(id) {
    var el = document.getElementById(id);
    var v = parseFloat(el && el.value);
    return isFinite(v) && v > 0 ? v : 0;
  }
  function pct(id) { return Math.min(num(id), 100) / 100; }
  function money(v) { return '$' + Math.round(v).toLocaleString('en-US'); }
  // Only a changed figure is written, so the live estimate line is read out only when it changes
  function set(id, text) { var el = document.getElementById(id); if (el && el.textContent !== text) el.textContent = text; }

  function update() {
    var job = num('c-job');
    var rate = num('c-rate');

    var callJobs = num('c-calls') * WEEKS_PER_MONTH * pct('c-callwin');
    var quoteJobs = num('c-quotes') * pct('c-quotewin');
    var callRev = callJobs * job;
    var quoteRev = quoteJobs * job;
    var monthly = callRev + quoteRev;

    var hoursMonth = num('c-hours') * pct('c-auto') * WEEKS_PER_MONTH;
    var hoursYear = hoursMonth * 12;

    set('r-month', money(monthly));
    set('r-year', money(monthly * 12));
    set('r-jobs', (Math.round((callJobs + quoteJobs) * 10) / 10).toString());
    set('r-calls', money(callRev) + '/mo');
    set('r-quotes', money(quoteRev) + '/mo');
    set('r-hours', Math.round(hoursMonth) + ' hours/mo');
    set('r-timeval', money(hoursYear * rate) + '/yr');

    var payback = document.getElementById('r-payback');
    if (payback) {
      if (callRev > 0) {
        var weeks = TEXT_BACK_SETUP / callRev * WEEKS_PER_MONTH;
        var label = weeks < 1.5 ? 'about a week'
          : weeks < 8 ? 'about ' + Math.round(weeks) + ' weeks'
          : 'about ' + Math.round(weeks / WEEKS_PER_MONTH) + ' months';
        payback.textContent = 'At these numbers, the $750 missed-call setup would pay for itself in ' + label + '.';
      } else {
        payback.textContent = 'Add the calls you miss in a week to see how quickly the missed-call setup would pay for itself.';
      }
    }
  }

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  update();
})();
