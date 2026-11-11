/* KnightWebstudio motion kit: the arc focus carousel, the spotlight carousel, the cylinder slider, the carousel ring and
   the folder stack. Hand-written, no dependencies. Load with defer, beside motion.css (shader.js holds the backgrounds
   and the pause control). Markup, options and behaviour: README.md.
   Each starts itself on [data-kws="arc|spotlight|cylinder|ring|folders"] when the page has loaded, and
   KWS.<name>.mount(el, options) returns a function that takes away everything it added. Nothing moves by itself. */
(() => {
'use strict';
const D = document, H = D.documentElement, KWS = window.KWS = window.KWS || {},
	{ abs, min, max, round, sign, sin, cos, exp, PI } = Math, raf = requestAnimationFrame, caf = cancelAnimationFrame,
	calm = matchMedia('(prefers-reduced-motion: reduce)'), RD = 'aria-roledescription', none = () => {}, boots = [];

// == The shared core
// still: the device asks for reduced motion, or the pause control has set html[data-motion="off"]. Read at every move
const still = () => calm.matches || H.dataset.motion === 'off',
	set = (e, k, v) => e.setAttribute(k, v),
	make = (tag, cls, label, html) => {
		const e = D.createElement(tag);
		e.className = cls; if (html) e.innerHTML = html;
		if (label) { e.type = 'button'; set(e, 'aria-label', label); }
		return e;
	},
	// a polite status region, hidden by the script itself so that it stays hidden if the stylesheet does not load
	teller = cls => {
		const e = make('output', cls);
		set(e, 'aria-live', 'polite'); e.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)';
		return e;
	},
	// listeners one AbortController takes away. how: 1 not passive, 2 capture too
	hub = ac => (t, type, fn, how) => t.addEventListener(type, fn, { signal: ac.signal, passive: !how, capture: how > 1 }),
	// take away a style attribute the script wrote (read it first, or Chromium keeps style="")
	bare = e => { e.getAttribute('style'); e.removeAttribute('style'); },
	// KWS[name].mount: one remover per element however often it is mounted; auto-start on [data-kws=name]
	kit = (name, build) => {
		const live = new WeakMap(), mount = (el, opt) => {
			if (!el) return none;
			if (live.has(el)) return live.get(el);
			let stop;
			const end = () => { if (live.get(el) === end) { live.delete(el); stop(); } };
			if (!(stop = build(el, opt || {}, end))) return none;
			live.set(el, end);
			return end;
		};
		KWS[name] = { mount };
		// data-from="760": only from that window width up; below it the plain list stays, and it follows the window
		boots.push(() => D.querySelectorAll(`[data-kws="${name}"]`).forEach(el => {
			const q = el.dataset.from && matchMedia(`(min-width: ${el.dataset.from}px)`);
			if (!q) return mount(el);
			const go = () => q.matches ? mount(el) : (live.get(el) || none)();
			q.addEventListener('change', go); go();
		}));
	};

// == Arc focus carousel (signs on the top of a wheel) and spotlight carousel (framed cards, the middle one lit).
// One engine: a soft spring, drag with a flick, arrows, dots or a count, arrow keys, Home and End; they differ in
// measure and render
const flat = (name, P, part) => kit(name, (el, opt) => {
	const A = P === 'arc', c = s => `kws-${P}-${s}`,
		items = [...el.querySelectorAll('.' + c('item'))], n = items.length, list = n && items[0].parentNode,
		pick = q => items.map(li => li.querySelector(q)), arts = pick('.' + c(part)), caps = pick('.' + c('cap'));
	if (!n || [...arts, ...caps].includes(null)) return;
	const o = { ...el.dataset, ...opt }, noun = o.noun || 'item', of = i => `${i + 1} of ${n}`,
		names = pick('h2,h3,h4').map((h, i) => `${h ? h.textContent.trim() : noun}, ${of(i)}`),
		nav = (label, d) => make('button', c('nav'), label + noun, `<svg viewBox="0 0 24 24"><path d="m${d}"/></svg>`),
		prev = nav('Previous ', '14 6-6 6 6 6'), next = nav('Next ', '10 6 6 6-6 6'), dots = names.map(x => make('button', c('dot'), x)),
		ctl = make('div', c('ctl'), 'Choose a ' + noun), count = make('span', c('n')), tell = teller(c('sr')),
		loop = n > 2 && o.loop + '' !== 'false', ac = new AbortController(), on = hub(ac), cl = el.classList,
		mod = i => (i % n + n) % n, wrap = d => loop ? mod(d + n / 2) - n / 2 : d, to = (i, quiet) => go(target + wrap(i - target), quiet),
		fix = v => v.toFixed(2), ang = [0], size = [1], at = (v, p, k = p | 0) => v[k] + (v[k + 1] - v[k]) * (p - k);
	let pos = min(n - 1, max(0, +o.start || 0)), target = pos, vel = 0, frame = 0, last = 0, cur = -1, seen = 1, drag, moved, say,
		R, step, half, shift, bulge, small;

	// On resize. Arc: lettering stays 12px or more, and a sign hanging below the top one clears the widest caption by
	// 16px. Spotlight: a neighbour stands beside the middle card, or tucks behind it; between those places it swings out
	// (bulge), so two cards changing places part before they cross
	const measure = () => {
		let w;
		if (A) {
			const t = arts[0].offsetWidth, cw = max(...caps.map(x => x.offsetWidth)) / 2 + 16,
				lo = max(.6, 12.1 / parseFloat(getComputedStyle(arts[0]).fontSize));
			w = list.clientWidth / 2; R = t * 2.9; half = 0;
			for (let k = 1, ok = 1; k < 6; k++) {
				const s = size[k] = max(lo, .86 - .1 * k), th = ang[k] = ang[k - 1] + t * ((size[k - 1] + s) / 2 + .16) / R, q = th * .49,
					x = R * sin(th), b = t * s * (cos(q) + sin(q)) / 2;
				if (ok &&= k < 5 && x + b < w + 6 && (R * .78 * (1 - cos(th)) + b < t / 2 + 20 || x - b > cw)) half = k;
			}
			if (loop) half = min(half, n - 1 >> 1);
			step = R * sin(ang[1]); w *= 2;
		} else {
			const f = arts[0].offsetWidth; // the list itself runs on into the page gutter
			w = items[0].offsetWidth; small = w < 560 ? .84 : .76;
			shift = min(f * (1 + small) / 2 + 24, (w - f * small) / 2); bulge = max(0, f * .47 - shift / 2); step = shift + PI * bulge;
		}
		// dots where they fit at 44px with 8px between, else "3 of 9": always one row
		ctl.replaceChildren(prev, ...(w < n * 52 + 110 ? [count] : dots), next);
		render();
	};

	const render = () => {
		arts.forEach((a, i) => {
			const d = wrap(i - pos), ad = abs(d), s = a.style, m = min(ad, 1), p = min(ad, half),
				o = A ? min(1, (half + .25 - ad) * 4) : min(1, 3 - ad * 2);
			s.visibility = o > 0 ? '' : 'hidden';
			if (o > 0) {
				s.opacity = fix(o);
				if (A) {
					const th = at(ang, p);
					s.transform = `translate(${fix(sign(d) * R * sin(th))}px,${fix(R * .78 * (1 - cos(th)))}px) rotate(${fix(sign(d) * th * 28)}deg) scale(${fix(at(size, p))})`;
				} else {
					s.zIndex = ad < .5 ? 2 : ad > 1 ? 0 : 1;
					s.setProperty('--v', fix(m * .45)); // the veil
					s.transform = `translate(${fix(sign(d) * (shift * m + bulge * sin(PI * m)))}px) scale(${fix(1 - (1 - small) * m - (ad - m) * .3)})`;
				}
			}
			caps[i].style.opacity = fix(max(0, 1 - ad * 2));
		});
		const i = mod(round(pos));
		if (i === cur) return;
		cur = i; count.textContent = of(i);
		items.forEach((li, j) => {
			li.classList.toggle('is-on', j === i); dots[j].tabIndex = j === i ? 0 : -1;
			set(dots[j], 'aria-current', j === i);
		});
	};

	const tick = now => {
		const dt = now && last ? min(.034, (now - last) / 1000) : .016;
		last = now; vel += (150 * (target - pos) - 22 * vel) * dt; pos += vel * dt;
		if (still() || !seen || abs(target - pos) < .002 && abs(vel) < .05) { pos = target; vel = frame = 0; } else frame = raf(tick);
		render();
		if (!frame) { cl.remove('is-moving'); if (say) tell.textContent = names[cur]; say = 0; }
	};
	const go = (i, quiet) => {
		say = !quiet; target = loop ? i : mod(i);
		if (still() || !seen) caf(frame), tick();
		else if (!frame) { last = 0; cl.add('is-moving'); frame = raf(tick); }
	};

	// A drag is taken after 12px, and only if at least as sideways as it is steep: steeper swipes scroll the page
	const move = e => {
		const g = drag, x = e.clientX, now = e.timeStamp;
		if (!g || e.pointerId !== g.id) return;
		if (!e.buttons) return up(e); // released where the carousel never heard it
		if (!g.on) {
			const dx = abs(x - g.x), dy = abs(e.clientY - g.y);
			if (dx < 12 && dy < 12) return;
			if (dx < dy) return drag = 0;
			g.on = moved = 1; g.x = x; g.p = pos;
			try { list.setPointerCapture(g.id); } catch {}
			caf(frame); vel = frame = 0; cl.add('is-moving');
		}
		g.v = .6 * (x - g.lx) / (now - g.t || 16) + .4 * g.v; g.lx = x; g.t = now;
		if (still()) return;
		pos = g.p - (x - g.x) / step; if (!loop) pos = min(n - .7, max(-.3, pos));
		render();
	};
	// More than 40px always moves one on; a flick carries on a little (the arc: one sign past those showing)
	const up = e => {
		const g = drag;
		if (!g || e.pointerId !== g.id) return;
		drag = 0; if (!g.on) return;
		setTimeout(() => moved = 0, 60);
		const F = A ? 14 : 6, dx = g.lx - g.x, a = round(g.p), v = e.timeStamp - g.t > 90 ? 0 : max(-F, min(F, -g.v * 1000 / step)), r = round(pos + v * .16);
		let i = still() ? a : A ? max(a - half - 1, min(a + half + 1, r)) : r;
		if (i === a && abs(dx) > 40) i -= sign(dx);
		vel = v; go(loop ? i : min(n - 1, max(0, i)));
	};

	items.forEach((li, i) => { set(li, RD, 'slide'); set(li, 'aria-label', of(i)); });
	set(ctl, 'role', 'group'); n > 1 && el.append(ctl, tell); set(el, RD, 'carousel'); cl.add('is-live');

	on(ctl, 'click', e => {
		const b = e.target.closest('button');
		if (b) b === prev ? go(target - 1) : b === next ? go(target + 1) : to(dots.indexOf(b));
	});
	on(list, 'pointerdown', e => {
		moved = 0;
		if (!e.button && !drag?.on) drag = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, t: e.timeStamp, v: 0 };
	});
	on(list, 'pointermove', move); on(list, 'pointerup', up); on(list, 'pointercancel', up);
	on(list, 'dragstart', e => e.preventDefault(), 1);
	// a click that ends a drag follows nothing; one on a side item brings it round; on the middle one opens its link
	on(el, 'click', e => {
		const i = arts.indexOf(e.target.closest('.' + c(part))), a = i > -1 && caps[i].querySelector('a');
		if (moved) { moved = 0; e.preventDefault(); e.stopPropagation(); }
		else if (i !== cur) i > -1 && to(i);
		else if (a) e.ctrlKey || e.metaKey ? open(a.href, '_blank', 'noopener') : a.click();
	}, 2);
	on(list, 'focusin', e => {
		const i = items.indexOf(e.target.closest('li'));
		if (i > -1 && i !== mod(target)) to(i, 1);
	});
	on(el, 'keydown', e => {
		const d = { ArrowLeft: -1, ArrowRight: 1 }[e.key], t = { Home: 0, End: n - 1 }[e.key];
		if (!d && t == null || e.altKey || e.ctrlKey || e.metaKey) return;
		e.preventDefault(); d ? go(target + d) : to(t); // an arrow steps; Home and End go the short way
		const a = D.activeElement, i = mod(target), f = dots.includes(a) ? dots[i] : list.contains(a) && items[i].querySelector('a,button');
		if (f) f.focus();
	}, 1);
	// spotlight: make the large cards' layers when a pointer or focus arrives, not on the first frame of a move
	if (!A) for (const t of ['pointerenter', 'pointerleave', 'focusin', 'focusout'])
		on(el, t, e => arts.forEach(f => f.style.willChange = /[rn]$/.test(e.type) ? 'transform,opacity' : ''));

	const ro = new ResizeObserver(measure), io = new IntersectionObserver(r => seen = r.pop().isIntersecting);
	(A ? [list, ...caps] : [list]).forEach(x => ro.observe(x)); io.observe(el); measure();

	return () => {
		ac.abort(); caf(frame); ro.disconnect(); io.disconnect(); ctl.remove(); tell.remove();
		cl.remove('is-live', 'is-moving'); el.removeAttribute(RD);
		items.forEach((li, i) => { li.classList.remove('is-on'); li.removeAttribute(RD); li.removeAttribute('aria-label'); bare(arts[i]); bare(caps[i]); });
	};
});
flat('arc', 'arc', 'tile');
flat('spotlight', 'spot', 'frame');

// == Cylinder slider: cards on a wide, shallow drum; the one in the middle faces you, flat and sharp
kit('cylinder', (el, opt) => {
	const track = el.querySelector('.kws-cyl-track'), cards = track ? [...track.children] : [], n = cards.length;
	if (n < 2) return;
	const O = { ...el.dataset, ...opt }, noun = O.noun || 'slide', loop = n > 2 && O.loop + '' !== 'false', cl = el.classList,
		names = cards.map((x, i) => {
			const h = x.querySelector('h2,h3,h4');
			return `${noun[0].toUpperCase() + noun.slice(1)} ${i + 1} of ${n}${h ? ': ' + h.textContent.trim() : ''}`;
		}),
		prev = make('button', 'kws-cyl-nav', 'Previous ' + noun), next = make('button', 'kws-cyl-nav', 'Next ' + noun),
		dots = names.map(x => make('button', 'kws-cyl-dot', x)), ctl = make('div', 'kws-cyl-ctl'), tell = teller('kws-cyl-sr'),
		far = loop ? min(2.5, n / 2) : 2.5, ac = new AbortController(), on = hub(ac),
		// a drum with two ends carries blank cards beyond them: neither side is ever bare
		ends = loop ? [] : [-2, -1, n, n + 1], all = cards.concat(ends.map(() => track.appendChild(make('li', 'kws-cyl-card')))),
		mod = i => (i % n + n) % n,
		wrap = d => loop ? mod(d + n / 2) - n / 2 : d,
		at = e => cards.findIndex(x => x.contains(e.target));
	let pos = min(n - 1, max(0, +O.start || 0)), goal = pos, vel = 0, frame = 0, last = 0, cur = -1,
		drag = null, moved = false, side = -1, P = 0, R = 0, turn = 17, flat = false;

	const render = () => {
		all.forEach((x, i) => {
			// in view a card is at full strength (its words keep their contrast); it fades only as it leaves
			const d = wrap((i < n ? i : ends[i - n]) - pos), a = abs(d), s = x.style, o = max(0, min(1, (far - a) / .4));
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
		if (pos !== goal) frame = raf(tick);
		else { pos = goal = mod(goal); cl.remove('is-moving'); }
	};
	const kick = () => { if (!frame) { last = 0; cl.add('is-moving'); frame = raf(tick); } };
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
		R = round(P / sin(turn * PI / 180));
		flat = innerWidth < 380 || H.dataset.kws3d === 'off' || !CSS.supports('transform', 'perspective(1px)');
		render();
	};

	set(el, RD, 'carousel');
	all.forEach((x, i) => i < n ? (set(x, RD, 'slide'), set(x, 'aria-label', `${i + 1} of ${n}`)) : set(x, 'aria-hidden', 'true'));
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

	// only a clearly sideways move is a drag (6px, more sideways than steep): the page still scrolls
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

	return () => {
		ac.abort(); ro.disconnect(); caf(frame);
		ctl.remove(); tell.remove();
		el.removeAttribute(RD);
		cl.remove('is-live', 'is-moving', 'is-held');
		all.forEach((x, i) => {
			if (i >= n) return x.remove();
			x.removeAttribute(RD); x.removeAttribute('aria-label');
			x.classList.remove('is-on');
			x.style.transform = x.style.opacity = x.style.pointerEvents = '';
			x.getAttribute('style') || x.removeAttribute('style');
		});
	};
});

// == Carousel ring: a rotary card file. Each line of the lists stands as a blank index card on a tilted turntable
// that turns as the page scrolls past, and by drag; the card at the front is lifted out, flat-on, to be read.
// Decoration only (the stage is aria-hidden): the lists are the content. Still when motion is reduced or paused
const RAD = PI / 180, text = e => e ? e.textContent.trim() : '';
kit('ring', (el, opt, end) => {
	let R = 0, S = 0, Y = 0, vh = 0, top = 0, ang = 0, goal = 0, turn = 0, vel = 0,
		frame = 0, last = 0, head = '', seen = false, busy = false, moved = 0, paused = 0, drag = null;
	const stage = el.querySelector('.kws-ring-stage'), groups = [...el.querySelectorAll('.kws-ring-group')],
		// a line: its words, its list's name for the tab, and which of four tab places that list takes
		items = [...el.querySelectorAll('li')].map(li => {
			const g = li.closest('.kws-ring-group');
			return [li.dataset.short || text(li), g ? g.dataset.tab || text(g.querySelector('.kws-ring-name')) : '', max(0, groups.indexOf(g)) % 4];
		}), n = items.length;
	if (!stage || n < 3 || H.dataset.kws3d === 'off' || !CSS.supports('transform', 'perspective(1px)')) {
		if (!stage) return;
		stage.style.display = 'none'; // the lists alone; no space kept
		return () => bare(stage);
	}
	const speed = +({ ...el.dataset, ...opt }).speed || .1, step = 360 / n, hub2 = make('div', 'kws-ring-hub'), ac = new AbortController(), side = [], rank = [],
		on = (t, type, fn) => t.addEventListener(type, fn, { signal: ac.signal, passive: true }),
		cards = items.map(it => { const x = hub2.appendChild(make('div', 'kws-ring-card')); x.style.cssText = '--k:' + it[2]; return x; }),
		readers = [0, 0].map(() => ({ e: hub2.appendChild(make('div', 'kws-ring-read', 0, '<b></b><div></div>')), i: -1, p: 0 }));
	stage.append(hub2);
	el.classList.add('is-live');

	const draw = dt => {
		const f = ((round(-ang / step) % n) + n) % n;
		cards.forEach((x, i) => {
			let a = (i * step + ang) % 360; a += a > 180 ? -360 : a < -180 ? 360 : 0;
			// Each card turns a little towards the reader, most at the sides: faces on the near half, backs on the far.
			// No 3D sorting is asked of the browser: they are stacked here, lowest where edge-on (2: not drawn)
			const fan = 32 * sin(a * RAD), v = cos((a - fan) * RAD) - .31 * cos(fan * RAD), s = v > .07 ? 0 : v < -.07 ? 1 : 2,
				z = round(abs(abs(a) - 105) / step);
			x.style.transform = `${head} rotateY(${a}deg) translateZ(${R}px) rotateY(${-fan}deg)`;
			if (s !== side[i]) { side[i] = s; x.classList.toggle('is-back', s === 1); x.style.visibility = s > 1 ? 'hidden' : ''; }
			if (z !== rank[i]) x.style.zIndex = rank[i] = z;
		});
		// The front card is read on a larger card that lifts out of its place and rests flat, in the middle
		if (readers.every(r => r.i !== f)) {
			const r = readers[readers[0].p > readers[1].p ? 1 : 0];
			r.i = f; r.p = 0; r.e.lastChild.textContent = items[f][0]; r.e.firstChild.textContent = items[f][1];
		}
		busy = false;
		readers.forEach(r => {
			const t = r.i === f ? 1 : 0, s = r.e.style;
			let p = r.p, a = (r.i * step + ang) % 360;
			if (p !== t) { p += (t - p) * (dt ? 1 - exp(-dt / (t ? 130 : 50)) : 1); if (abs(t - p) < .004) p = t; else busy = true; r.p = p; }
			else if (r.w === p) return;
			r.w = p;
			const q = 1 - p; // 1 in its place in the file, 0 out and facing you
			a += a > 180 ? -360 : a < -180 ? 360 : 0;
			s.opacity = min(1, p * 5);
			s.transform = `perspective(${R * 2.8}px) translateZ(${-R * q}px) rotateX(${-32 * q}deg) rotateY(${a * q}deg) translateZ(${R * q}px) rotateY(${-32 * sin(a * RAD) * q}deg) translateY(${R * .5 * p}px) scale(${S + (.5 - S) * p})`;
			r.e.lastChild.style.opacity = +(p > .6); // words wait until it is nearly up: two cards never read at once
		});
	};
	const aim = () => { goal = turn - max(0, Y + vh - top) * speed; };
	const tick = now => {
		frame = 0;
		const dt = min(50, now - last || 16), stop = still(); last = now;
		if (!seen) return vel = 0; // scrolled away mid-turn
		if (stop) { vel = 0; goal = ang; } else {
			if (moved) { moved = 0; Y = scrollY; aim(); if (paused) { paused = 0; turn += ang - goal; goal = ang; } }
			if (vel && !drag) { turn += vel * dt; vel *= exp(-dt / 240); if (abs(vel) < .01) vel = 0; aim(); }
		}
		ang += (goal - ang) * (drag && drag.on ? 1 : 1 - exp(-dt / 110));
		if (abs(goal - ang) < .03) ang = goal;
		if (ang === goal && !vel && !drag && !stop) goal = round(goal / step) * step; // left alone, it settles on a card
		draw(stop ? 0 : dt);
		if (ang !== goal || vel && !drag || busy) frame = raf(tick);
	};
	const kick = () => { if (!frame && seen) { last = 0; frame = raf(tick); } };
	const measure = jump => {
		const w = stage.clientWidth, fresh = !R;
		if (!w) return;
		// it runs off the window's left edge only if the stage reaches that edge
		R = round(min(stage.clientHeight / 1.12, innerWidth < 980 ? w : stage.getBoundingClientRect().left < 1 ? (w - 230) / .92 : w / 1.9));
		stage.style.fontSize = R + 'px';
		head = `perspective(${R * 2.8}px) translateZ(${-R}px) rotateX(-32deg)`;
		S = cards[0].offsetWidth / readers[0].e.offsetWidth;
		vh = innerHeight; Y = scrollY; top = el.getBoundingClientRect().top + Y;
		readers.forEach(r => r.w = -1);
		if (!still()) {
			aim();
			if (jump || fresh) ang = goal = round(goal / step) * step; // coming on screen: no catching up
			else { turn += ang - goal; goal = ang; } // a resize does not turn it
		}
		draw(0);
	};
	const scroll = () => {
		if (!el.isConnected) return end();
		if (still()) paused = 1; else if (seen) { moved = 1; kick(); }
	};
	const ro = new ResizeObserver(() => measure()), io = new IntersectionObserver(es => {
		seen = es[es.length - 1].isIntersecting;
		hub2.style.display = seen ? '' : 'none'; // off screen its cards are not kept as layers
		if (!el.isConnected) end(); else if (seen) measure(1);
	}, { rootMargin: '20%' });
	ro.observe(stage); io.observe(stage); measure();
	on(window, 'scroll', scroll);

	// a drag is a clearly sideways move only
	on(stage, 'pointerdown', e => { if (!e.button && e.isPrimary && !still()) drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, on: 0 }; });
	on(stage, 'pointermove', e => {
		if (!drag || e.pointerId !== drag.id) return;
		const dx = e.clientX - drag.x, dy = e.clientY - drag.y, dt = max(1, e.timeStamp - drag.t);
		if (!drag.on) {
			if (abs(dx) < 6 || abs(dx) < abs(dy)) { if (abs(dy) > 10) drag = null; return; }
			drag.on = 1; stage.setPointerCapture(e.pointerId);
		} else {
			const d = dx * 57.3 / R;
			turn += d; vel = .6 * d / dt + .4 * vel; aim(); kick();
		}
		drag.x = e.clientX; drag.t = e.timeStamp;
	});
	const drop = e => {
		if (!drag || e.pointerId !== drag.id) return;
		if (e.timeStamp - drag.t > 80) vel = 0; // it had stopped: no fling
		drag = null; kick();
	};
	on(stage, 'pointerup', drop); on(stage, 'pointercancel', drop);

	return () => {
		ac.abort(); ro.disconnect(); io.disconnect(); caf(frame);
		hub2.remove(); bare(stage);
		el.classList.remove('is-live');
	};
});

// == Folder stack: a list of folders becomes a tabs pattern, the chosen folder in front. With kws-folders--phone it is
// a stack below 760px only. A #hash naming a folder, or anything inside one, opens that folder
const phone = matchMedia('(max-width: 759.98px)'), stacks = new WeakMap();
let uid = 0;
kit('folders', (root, o) => {
	const id = 'kws-f' + ++uid;
	let list = null, tabs = [], folders = [], made = [], at = -1;
	const show = (i, user) => {
		if (!tabs[i]) return;
		if (user && i !== at) root.classList.add('is-moved'); // only a choice animates, never the first paint
		at = i;
		folders.forEach((f, k) => {
			f.classList.toggle('is-front', k === i);
			set(tabs[k], 'aria-selected', k === i ? 'true' : 'false');
			tabs[k].tabIndex = k === i ? 0 : -1;
		});
	};
	const fromHash = () => {
		let t = null;
		try { t = location.hash.length > 1 && D.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) {}
		for (let k = 0; t && k < folders.length; k++) if (folders[k].contains(t)) { show(k); return true; }
	};
	const click = e => { const t = e.target.closest('[role="tab"]'); if (t) show(tabs.indexOf(t), true); };
	const key = e => {
		if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return; // Alt+Left is the browser's Back
		let k = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: tabs.length - 1 }[e.key];
		if (k == null) return;
		e.preventDefault();
		k = (k + tabs.length) % tabs.length;
		show(k, true); tabs[k].focus();
	};
	const build = () => {
		const all = [...root.children].filter(x => x.classList.contains('kws-folder'));
		if (!all.length) return; // nothing to choose between: leave the page alone
		folders = all;
		list = make('div', 'kws-tabs');
		set(list, 'role', 'tablist');
		set(list, 'aria-label', o.label || root.getAttribute('data-label') || 'Choose one');
		tabs = folders.map((f, k) => {
			const from = f.querySelector('.kws-folder-tab'), b = make('button', 'kws-folder-tab');
			b.type = 'button'; b.id = id + '-t' + k; b.innerHTML = from ? from.innerHTML : k + 1;
			set(b, 'role', 'tab');
			if (!f.id) { f.id = id + '-p' + k; made.push(f); }
			set(b, 'aria-controls', f.id);
			set(f, 'role', 'tabpanel'); set(f, 'aria-labelledby', b.id);
			// a panel with nothing to focus inside takes focus itself, so keyboard users can reach and scroll it
			if (!f.querySelector('a[href], button, input, select, textarea, [tabindex]')) f.tabIndex = 0;
			list.appendChild(b);
			return b;
		});
		list.addEventListener('click', click);
		list.addEventListener('keydown', key);
		root.insertBefore(list, root.firstChild);
		root.classList.add('is-live');
		if (!fromHash()) show(min(folders.length, max(1, Math.floor(o.start || +root.getAttribute('data-start') || 1))) - 1);
	};
	const tear = () => {
		if (!list) return;
		list.remove(); list = null;
		root.classList.remove('is-live', 'is-moved');
		folders.forEach(f => { f.classList.remove('is-front'); ['role', 'aria-labelledby', 'tabindex'].forEach(a => f.removeAttribute(a)); });
		made.forEach(f => f.removeAttribute('id'));
		made = []; tabs = []; folders = []; at = -1;
	};
	const sync = () => { if (!root.classList.contains('kws-folders--phone') || phone.matches) { if (!list) build(); } else tear(); };
	stacks.set(root, { sync, hash: fromHash });
	sync();
	return () => { stacks.delete(root); tear(); };
});
// one listener each for the page, whatever the number of stacks; a stack that left the page is simply not found
const each = what => () => D.querySelectorAll('.kws-folders--stack').forEach(el => { const s = stacks.get(el); if (s) s[what](); });
addEventListener('hashchange', each('hash'));
phone.addEventListener('change', each('sync'));

const start = () => boots.forEach(f => { try { f(); } catch (e) { setTimeout(() => { throw e; }); } });
D.readyState === 'loading' ? D.addEventListener('DOMContentLoaded', start) : start();
})();
