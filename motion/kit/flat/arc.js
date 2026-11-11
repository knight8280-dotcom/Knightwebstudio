/* KWS motion kit: arc focus carousel. Signs ride the top of a wheel; drag, swipe, arrows, dots and arrow keys turn it.
   Starts on [data-kws="arc"], or: const off = KWS.arc.mount(el, { start: 0, loop: true, noun: 'service' }); off(); See NOTES.md */
(function () {
'use strict';
const { abs, min, max, round, sign, sin, cos } = Math, live = new WeakMap(), raf = requestAnimationFrame, caf = cancelAnimationFrame,
	rd = 'aria-roledescription', set = (e, k, v) => e.setAttribute(k, v),
	still = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off',
	at = (v, p, k = p | 0) => v[k] + (v[k + 1] - v[k]) * (p - k), fix = v => v.toFixed(2),
	make = (tag, cls, label, html = '') => {
		const e = document.createElement(tag);
		e.className = 'kws-arc-' + cls; e.innerHTML = html;
		if (label) { e.type = 'button'; set(e, 'aria-label', label); }
		return e;
	};

function mount(el, opt) {
	if (live.has(el)) return live.get(el);
	const items = [...el.querySelectorAll('.kws-arc-item')], n = items.length, list = n && items[0].parentNode,
		pick = q => items.map(li => li.querySelector(q)), tiles = pick('.kws-arc-tile'), caps = pick('.kws-arc-cap');
	if (!n || [...tiles, ...caps].includes(null)) return () => {};
	const o = { ...el.dataset, ...opt }, noun = o.noun || 'item', of = i => `${i + 1} of ${n}`,
		names = pick('h2,h3,h4').map((h, i) => `${h ? h.textContent.trim() : noun}, ${of(i)}`),
		nav = (label, d) => make('button', 'nav', label + noun, `<svg viewBox="0 0 24 24"><path d="m${d}"/></svg>`),
		prev = nav('Previous ', '14 6-6 6 6 6'), next = nav('Next ', '10 6 6 6-6 6'), dots = names.map(name => make('button', 'dot', name)),
		ctl = make('div', 'ctl', 'Choose a ' + noun), count = make('span', 'n'), tell = make('output', 'sr'),
		loop = n > 2 && o.loop + '' !== 'false', ang = [0], size = [1], ac = new AbortController(), cl = el.classList,
		on = (t, type, fn, how) => // how: 1 active, 2 capture
			t.addEventListener(type, fn, { signal: ac.signal, passive: !how, capture: how > 1 }),
		mod = i => (i % n + n) % n,
		wrap = d => loop ? mod(d + n / 2) - n / 2 : d,
		to = (i, quiet) => go(target + wrap(i - target), quiet);
	let pos = min(n - 1, max(0, +o.start || 0)), target = pos, vel = 0, frame = 0, last = 0, cur = -1, seen = 1, drag, moved, say,
		R, step, half;

	// On resize. Lettering stays 12px or more; a sign hanging below the top one must clear the widest caption by 16px
	const measure = () => {
		const w = list.clientWidth / 2, t = tiles[0].offsetWidth, c = max(...caps.map(c => c.offsetWidth)) / 2 + 16,
			lo = max(.6, 12.1 / parseFloat(getComputedStyle(tiles[0]).fontSize));
		R = t * 2.9; half = 0;
		for (let k = 1, ok = 1; k < 6; k++) {
			const s = size[k] = max(lo, .86 - .1 * k), th = ang[k] = ang[k - 1] + t * ((size[k - 1] + s) / 2 + .16) / R, q = th * .49,
				x = R * sin(th), b = t * s * (cos(q) + sin(q)) / 2;
			if (ok &&= k < 5 && x + b < w + 6 && (R * .78 * (1 - cos(th)) + b < t / 2 + 20 || x - b > c)) half = k;
		}
		if (loop) half = min(half, n - 1 >> 1);
		step = R * sin(ang[1]);
		ctl.replaceChildren(prev, ...(w < n * 26 + 55 ? [count] : dots), next);
		render();
	};

	const render = () => {
		tiles.forEach((tile, i) => {
			const d = wrap(i - pos), a = abs(d), p = min(a, half), th = at(ang, p), o = min(1, (half + .25 - a) * 4), s = tile.style;
			s.visibility = o > 0 ? '' : 'hidden';
			if (o > 0) {
				s.opacity = fix(o);
				s.transform = `translate(${fix(sign(d) * R * sin(th))}px,${fix(R * .78 * (1 - cos(th)))}px) rotate(${fix(sign(d) * th * 28)}deg) scale(${fix(at(size, p))})`;
			}
			caps[i].style.opacity = fix(max(0, 1 - a * 2));
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

	const move = e => {
		const g = drag, x = e.clientX, now = e.timeStamp;
		if (!g || e.pointerId !== g.id) return;
		if (!e.buttons) return up(e);
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
	const up = e => {
		const g = drag;
		if (!g || e.pointerId !== g.id) return;
		drag = 0; if (!g.on) return;
		setTimeout(() => moved = 0, 60);
		const dx = g.lx - g.x, a = round(g.p), v = e.timeStamp - g.t > 90 ? 0 : max(-14, min(14, -g.v * 1000 / step));
		let i = still() ? a : max(a - half - 1, min(a + half + 1, round(pos + v * .16)));
		if (i === a && abs(dx) > 40) i -= sign(dx);
		vel = v; go(loop ? i : min(n - 1, max(0, i)));
	};

	items.forEach((li, i) => { set(li, rd, 'slide'); set(li, 'aria-label', of(i)); });
	set(ctl, 'role', 'group'); tell.style = 'position:absolute;clip-path:inset(50%)'; n > 1 && el.append(ctl, tell); set(el, rd, 'carousel'); cl.add('is-live');

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
	on(el, 'click', e => {
		const i = tiles.indexOf(e.target.closest('.kws-arc-tile')), a = i > -1 && caps[i].querySelector('a');
		if (moved) { moved = 0; e.preventDefault(); e.stopPropagation(); }
		else if (i !== cur) i > -1 && to(i);
		else if (a) e.ctrlKey || e.metaKey ? open(a.href) : a.click();
	}, 2);
	on(list, 'focusin', e => {
		const i = items.indexOf(e.target.closest('li'));
		if (i > -1 && i !== mod(target)) to(i, 1);
	});
	on(el, 'keydown', e => {
		const d = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
		if (!d || e.altKey || e.ctrlKey || e.metaKey) return;
		e.preventDefault(); go(target + d);
		const a = document.activeElement, i = mod(target), f = dots.includes(a) ? dots[i] : list.contains(a) && items[i].querySelector('a,button');
		if (f) f.focus();
	}, 1);

	const ro = new ResizeObserver(measure), io = new IntersectionObserver(r => seen = r.pop().isIntersecting);
	[list, ...caps].forEach(x => ro.observe(x)); io.observe(el); measure();

	const off = () => {
		ac.abort(); caf(frame); ro.disconnect(); io.disconnect(); ctl.remove(); tell.remove(); live.delete(el);
		cl.remove('is-live', 'is-moving'); el.removeAttribute(rd);
		items.forEach((li, i) => {
			li.classList.remove('is-on'); li.removeAttribute(rd); li.removeAttribute('aria-label');
			for (const x of [tiles[i], caps[i]]) x.getAttribute('style'), x.removeAttribute('style'); // read first, or Chromium keeps style=""
		});
	};
	live.set(el, off); return off;
}

(window.KWS ||= {}).arc = { mount };
const start = () => document.querySelectorAll('[data-kws=arc]').forEach(el => mount(el));
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
