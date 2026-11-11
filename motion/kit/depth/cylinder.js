/* KWS motion kit: cylinder slider. Cards stand on a wide, shallow drum; the one in the middle faces you, flat and sharp.
   Starts itself on [data-kws="cylinder"], or: const off = KWS.cylinder.mount(el, { start: 0, loop: true, noun: 'step' }); off();
   Drag, swipe, arrows, dots and keys turn it; never by itself. Markup and notes: NOTES.md */
(function () {
'use strict';
const D = document, H = D.documentElement, { abs, min, max, round, sign } = Math, live = new WeakMap(), ROLE = 'aria-roledescription',
	calm = matchMedia('(prefers-reduced-motion: reduce)'),
	still = () => calm.matches || H.dataset.motion === 'off',
	set = (e, k, v) => e.setAttribute(k, v),
	make = (tag, cls, label) => {
		const e = D.createElement(tag);
		e.className = 'kws-cyl-' + cls;
		if (label) { e.type = 'button'; set(e, 'aria-label', label); }
		return e;
	};

function mount(el, opt) {
	if (live.has(el)) return live.get(el);
	const track = el.querySelector('.kws-cyl-track'), cards = track ? [...track.children] : [], n = cards.length;
	if (n < 2) return () => {};
	const O = { ...el.dataset, ...opt }, noun = O.noun || 'slide', loop = n > 2 && O.loop + '' !== 'false', cl = el.classList,
		names = cards.map((c, i) => {
			const h = c.querySelector('h2,h3,h4');
			return `${noun[0].toUpperCase() + noun.slice(1)} ${i + 1} of ${n}${h ? ': ' + h.textContent.trim() : ''}`;
		}),
		prev = make('button', 'nav', 'Previous ' + noun), next = make('button', 'nav', 'Next ' + noun),
		dots = names.map(name => make('button', 'dot', name)), ctl = make('div', 'ctl'), tell = make('p', 'sr'),
		far = loop ? min(2.5, n / 2) : 2.5, ac = new AbortController(),
		// a drum with two ends carries blank cards beyond them: neither side is ever bare
		ends = loop ? [] : [-2, -1, n, n + 1], all = cards.concat(ends.map(() => track.appendChild(make('li', 'card')))),
		on = (t, type, fn, how) => t.addEventListener(type, fn, { signal: ac.signal, passive: !how, capture: how > 1 }), // how: 1 not passive, 2 capture too
		mod = i => (i % n + n) % n,
		wrap = d => loop ? mod(d + n / 2) - n / 2 : d,
		at = e => cards.findIndex(c => c.contains(e.target));
	let pos = min(n - 1, max(0, +O.start || 0)), goal = pos, vel = 0, frame = 0, last = 0, cur = -1,
		drag = null, moved = false, side = -1, P = 0, R = 0, turn = 17, flat = false;

	const render = () => {
		all.forEach((c, i) => {
			// in view a card is at full strength (its words keep their contrast); it fades only as it leaves
			const d = wrap((i < n ? i : ends[i - n]) - pos), a = abs(d), s = c.style, o = max(0, min(1, (far - a) / .4));
			s.opacity = o; s.pointerEvents = o ? '' : 'none';
			s.transform = a < .001 ? 'none' : flat ? `translateX(${d * P}px)`
				: `perspective(${R * 1.4}px) translateZ(${-R}px) rotateY(${d * turn}deg) translateZ(${R}px)`;
		});
		const i = mod(round(pos));
		if (i === cur) return;
		cur = i;
		dots.forEach((b, j) => { cards[j].classList.toggle('is-on', j === i); j === i ? set(b, 'aria-current', 'true') : b.removeAttribute('aria-current'); });
		if (!loop) { set(prev, 'aria-disabled', i < 1); set(next, 'aria-disabled', i > n - 2); }
	};
	// a soft spring; a drag under way holds it, a press alone does not
	const tick = now => {
		frame = 0;
		const dt = last ? min(.05, (now - last) / 1e3) : .016, held = drag && drag.on; last = now;
		if (!held) {
			vel += ((goal - pos) * 160 - vel * 25) * dt; pos += vel * dt;
			if (abs(goal - pos) < .002 && abs(vel) < .03) { pos = goal; vel = 0; }
		}
		render();
		if (held) return;
		if (pos !== goal) frame = requestAnimationFrame(tick);
		else { pos = goal = mod(goal); cl.remove('is-moving'); }
	};
	const kick = () => { if (!frame) { last = 0; cl.add('is-moving'); frame = requestAnimationFrame(tick); } };
	const go = (t, say) => {
		t = loop ? t : min(n - 1, max(0, t));
		if (say && mod(t) !== mod(goal)) tell.textContent = names[mod(t)];
		goal = t;
		if (still()) { pos = goal = mod(t); vel = 0; render(); } else kick();
	};
	const to = (i, say) => go(goal + wrap(i - goal), say);
	const measure = () => {
		const tight = innerWidth < 600; // a phone: a tighter drum, closer cards
		P = cards[0].offsetWidth * (tight ? 1.02 : 1.06) || P;
		turn = tight ? 21 : 17;
		R = round(P / Math.sin(turn * Math.PI / 180));
		flat = innerWidth < 380 || H.dataset.kws3d === 'off' || !CSS.supports('transform', 'perspective(1px)');
		render();
	};

	set(el, ROLE, 'carousel');
	set(tell, 'aria-live', 'polite');
	all.forEach((c, i) => i < n ? (set(c, ROLE, 'slide'), set(c, 'aria-label', `${i + 1} of ${n}`)) : set(c, 'aria-hidden', 'true'));
	ctl.append(prev, ...dots, next);
	el.append(ctl, tell);
	cl.add('is-live');
	const ro = new ResizeObserver(measure);
	ro.observe(el); measure();

	[prev, next].forEach((b, i) => on(b, 'click', () => go(goal + i * 2 - 1, 1)));
	dots.forEach((b, i) => on(b, 'click', () => to(i, 1)));
	on(el, 'keydown', e => {
		const t = { ArrowLeft: goal - 1, ArrowRight: goal + 1, Home: 0, End: n - 1 }[e.key], was = goal, inside = at(e) > -1;
		if (t == null || e.altKey || e.ctrlKey || e.metaKey || e.target.matches('input,textarea,select')) return;
		e.preventDefault();
		if (e.key[5]) go(t, !inside); else to(t, !inside); // an arrow steps; Home and End go the short way
		// focus follows the drum, to the dot of the card that has come round
		if (inside && goal !== was) dots[mod(goal)].focus({ preventScroll: true });
	}, 1);
	// tabbing into a side card brings it to the middle
	on(track, 'focusin', e => { const i = at(e); track.scrollLeft = 0; if (i > -1 && i !== mod(goal)) to(i); });
	// a click that ends a drag or lands on a side card follows no link; keyboard clicks (detail 0) are neither
	on(track, 'click', e => {
		if (e.detail && (moved || side > -1)) { e.preventDefault(); e.stopPropagation(); if (!moved) to(side, 1); }
		moved = false; side = -1;
	}, 2);

	// only a clearly sideways move is a drag: the page still scrolls
	on(track, 'pointerdown', e => {
		if (e.button || !e.isPrimary) return;
		drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, v: 0, on: 0 };
		moved = false; side = at(e); if (side === mod(goal)) side = -1;
	});
	on(track, 'pointermove', e => {
		if (!drag || e.pointerId !== drag.id) return;
		const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
		if (!drag.on) {
			if (abs(dx) < 6 || abs(dx) < abs(dy)) { if (abs(dy) > 10) drag = null; return; }
			drag.on = 1; moved = true; track.setPointerCapture(e.pointerId); cl.add('is-held');
			drag.p = pos; drag.x = e.clientX;
			return;
		}
		drag.dx = dx;
		if (still()) return;
		let p = drag.p - dx / P;
		if (!loop) p = p < 0 ? p * .35 : p > n - 1 ? n - 1 + (p - n + 1) * .35 : p;
		drag.v = .7 * (p - pos) / max(1, e.timeStamp - drag.t) + .3 * drag.v; drag.t = e.timeStamp;
		pos = p; kick();
	});
	const drop = e => {
		if (!drag || e.pointerId !== drag.id) return;
		const d = drag; drag = null;
		cl.remove('is-held');
		if (!d.on) return;
		if (still()) return abs(d.dx) > 30 && go(goal - sign(d.dx), 1);
		vel = e.timeStamp - d.t > 80 ? 0 : d.v * 1e3; // stopped under the finger: no fling
		go(round(pos + max(-.6, min(.6, vel * .22))), 1);
	};
	on(track, 'pointerup', drop); on(track, 'pointercancel', drop);
	on(track, 'dragstart', e => e.preventDefault(), 1);

	function off() {
		ac.abort(); ro.disconnect(); cancelAnimationFrame(frame);
		ctl.remove(); tell.remove();
		el.removeAttribute(ROLE);
		cl.remove('is-live', 'is-moving', 'is-held');
		all.forEach((c, i) => {
			if (i >= n) return c.remove();
			c.removeAttribute(ROLE); c.removeAttribute('aria-label');
			c.classList.remove('is-on');
			c.style.transform = c.style.opacity = c.style.pointerEvents = '';
			c.getAttribute('style') || c.removeAttribute('style');
		});
		live.delete(el);
	}
	live.set(el, off);
	return off;
}

const boot = () => D.querySelectorAll('[data-kws="cylinder"]').forEach(el => mount(el));
(window.KWS = window.KWS || {}).cylinder = { mount };
D.readyState === 'loading' ? D.addEventListener('DOMContentLoaded', boot) : boot();
})();
