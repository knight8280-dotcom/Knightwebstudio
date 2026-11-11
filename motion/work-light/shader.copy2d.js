/* KnightWebstudio motion kit: animated backgrounds and the motion pause button. Hand-written
   WebGL, no dependencies. Load with defer, after shader.css. Markup, options, limits: NOTES.md.
   Layer, first inside its host: <div class="kws-shader" data-kws="shader" data-shader="wash">
   (or "band", or "ribbon" with data-tone="1|2|3"). KWS.shader.mount(el, {speed, seed, contrast,
   strength}) returns a function that removes it. One shared WebGL context, low resolution, 30
   frames a second, only layers on screen; wash and band keep text at 4.8:1; with no WebGL or
   with Save-Data the CSS still stays.
   Pause: <button class="kws-motion" data-kws="motion" hidden> sets data-motion="off" on <html>,
   kept in localStorage "kws-motion"; reduced motion starts off. KWS.motion.set(off), .off(), and
   a "kws:motion" event on document. */
(function () {
	'use strict';
	var KWS = window.KWS = window.KWS || {}, doc = document, html = doc.documentElement;

	/* ---------- Motion pause control ---------- */
	var btns = [];
	function off() { return html.getAttribute('data-motion') === 'off'; }
	function label(b) { b.title = (off() ? 'Play' : 'Pause') + ' background motion'; b.setAttribute('aria-label', b.title); }
	function setMotion(v, keep) {
		if (v) html.setAttribute('data-motion', 'off'); else html.removeAttribute('data-motion');
		if (keep) try { localStorage.setItem('kws-motion', v ? 'off' : 'on'); } catch (e) {}
		btns.forEach(label);
		doc.dispatchEvent(new CustomEvent('kws:motion', { detail: { off: v } }));
	}
	var saved;
	try { saved = localStorage.getItem('kws-motion'); } catch (e) {}
	setMotion(saved ? saved === 'off' : off() || matchMedia('(prefers-reduced-motion: reduce)').matches);
  KWS.motion = {
		off: off,
		set: function (v) { setMotion(!!v, true); },
		mount: function (b) {
			function click() { setMotion(!off(), true); }
			b.addEventListener('click', click);
			b.hidden = false; btns.push(b); label(b);
			return function () { b.removeEventListener('click', click); b.hidden = true; btns.splice(btns.indexOf(b), 1); };
		}
	};

	/* ---------- Shaders ---------- */
	// R size, Lm luminance allowed, T time, A strength, S CSS px per pixel, Z seed, B ground, M text mask
	var HEAD = [
		'precision highp float;',
		'uniform vec2 R,Lm;uniform float T,A,S,Z;uniform vec3 C1,C2,C3,B;uniform sampler2D M;',
		// 2D simplex noise: Ian McEwan, Ashima Arts (MIT licence)
		'vec3 pm(vec3 x){return mod((x*34.+1.)*x,289.);}',
		'float sn(vec2 v){const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);',
		'vec2 i=floor(v+dot(v,C.yy)),a=v-i+dot(i,C.xx),o=a.x>a.y?vec2(1.,0.):vec2(0.,1.);vec4 b=a.xyxy+C.xxzz;b.xy-=o;i=mod(i,289.);',
		'vec3 p=pm(pm(i.y+vec3(0.,o.y,1.))+i.x+vec3(0.,o.x,1.)),m=max(.5-vec3(dot(a,a),dot(b.xy,b.xy),dot(b.zw,b.zw)),0.);m=m*m;m=m*m;',
		'vec3 x=2.*fract(p*C.www)-1.,h=abs(x)-.5,e=x-floor(x+.5);m*=1.79284291400159-.85373472095314*(e*e+h*h);',
		'vec3 g;g.x=e.x*a.x+h.x*a.y;g.yz=e.yz*b.xz+h.yz*b.yw;return 130.*dot(m,g);}',
		'float hs(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}',
		// WCAG luminance; gd(): the largest opacity up to a that keeps text readable over the blend
		'float lu(vec3 c){vec3 l=mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(.04045,c));return dot(l,vec3(.2126,.7152,.0722));}',
		'bool ok(vec3 c,float a){float L=lu(mix(B,c,a));return L>=Lm.x&&L<=Lm.y;}',
		'float gd(vec3 c,float a){if(ok(c,a))return a;float lo=0.,hi=a;for(int i=0;i<6;i++){float m=.5*(lo+hi);if(ok(c,m))lo=m;else hi=m;}return lo;}',
		'void main(){vec2 uv=gl_FragCoord.xy/R;float u=sqrt(R.x*R.y);vec2 p=gl_FragCoord.xy/u,k=R/u;'
	].join('\n');
	var FRAG = {
		// Three soft lights on long loops, crossed by slanted shafts as through a shop window
		wash: [
			'vec2 q=p+.26*vec2(sn(p*.9+vec2(0.,T*.05)),sn(p*.9+vec2(5.2,-T*.04)));',
			'vec2 a1=q-k*vec2(.8+.07*sin(T*.11),.84+.06*cos(T*.09)),a2=q-k*vec2(.2+.09*cos(T*.08+1.),.62+.09*sin(T*.1)),a3=q-k*vec2(.55+.15*sin(T*.07+2.),.3+.07*cos(T*.12));',
			'float f1=exp(-dot(a1,a1)/.2),f2=.7*exp(-dot(a2,a2)/.13),f3=.6*exp(-dot(a3,a3)/.14),s=f1+f2+f3;',
			'vec3 c=(C2*f1+C1*f2+C3*f3)/max(s,1e-4);',
			'float sh=smoothstep(.25,.75,.5+.5*sin((q.x*.8+q.y*.6)*20.+1.6*sn(q*.7+T*.02)+T*.06));',
			'float a=gd(c,clamp(min(s,1.)*mix(.3,1.,sh)*smoothstep(0.,.4,uv.y)*smoothstep(1.,.86,uv.y)*A+(hs(gl_FragCoord.xy)-.5)/128.,0.,1.));',
			'gl_FragColor=vec4(c*a,a);}'
		],
		// Slow folds in tones of the ground; sparse gilt flecks, never behind text
		band: [
			'float n=sn(p*vec2(.5,.8)+vec2(T*.02,-T*.015)),v=p.y*3.2-p.x*1.1+n*1.3+T*.05;',
			'float h=smoothstep(0.,1.,mix(.5+.5*sin(v*2.),.5+.5*sin(v*5.3+n*2.+1.7),.25));',
			'vec3 c=mix(C3,C1,h)+C1*.25*pow(h,8.);c=mix(B,c,gd(c,A)*smoothstep(1.,.88,uv.y));',
			'vec2 g=gl_FragCoord.xy*S/40.,id=floor(g);float r=hs(id),e=hs(id+7.3);',
			'vec2 o=fract(g)-.5-.6*vec2(r-.5,e-.5);',
			'float fl=step(.9,hs(id+3.1))*(.15+.85*pow(.5+.5*sin(T*(.4+e)+r*40.),4.))*smoothstep(.16+.1*r,.04,abs(o.x)*(1.+e)+abs(o.y)*(2.-e));',
			'fl*=1.-smoothstep(0.,.4,texture2D(M,vec2(uv.x,1.-uv.y)).r);',
			'gl_FragColor=vec4(mix(c,C2,fl*.9),1.);}'
		],
		// Three silk ribbons: a slow twist narrows each and shows its darker back; sheen runs along it
		ribbon: [
			'p=(uv-.5)*vec2(R.x/R.y,1.);p=vec2(p.x*.92-p.y*.38,p.x*.38+p.y*.92);vec3 c=B;float e=2./R.y;',
			'for(int j=0;j<3;j++){float i=float(j),x=p.x*(1.2+.25*i)+i*2.3+Z;',
			'float y=(i-1.)*.27+.15*sin(x*1.7+T*.2+i)+.06*sin(x*3.9-T*.13+i*2.),tw=cos(x*1.3+T*.16+i*1.9);',
			'float w=(j==1?.19:.08)*(.45+.55*abs(tw)),s=(p.y-y)/w,g=.5+.5*sin(x*2.6+T*.11+i*3.);',
			'c*=1.-.18*smoothstep(1.6,.2,abs(s+.035/w));',
			'vec3 t=j==1?C1:C3,b=mix(t*.62,t,smoothstep(-.3,.3,tw));',
			'b=mix(b,mix(t,vec3(1.),.6),.5*g*g*(.62+.38*s)+.12*exp(-pow((s-.3*tw)/.5,2.)))*(1.-.07*s*s);',
			'if(j==1)b=mix(b,C2,smoothstep(.07,.03,abs(abs(s)-.72)));',
			'c=mix(c,b,smoothstep(1.+e/w,1.-e/w,abs(s)));}',
			'gl_FragColor=vec4(c,1.);}'
		]
	};
	// q pixels per CSS pixel, d pixel-ratio cap, max pixels drawn
	var P = {
		wash: { q: .5, d: 1, max: 9e4 },
		band: { q: .66, d: 1, max: 14e4 },
		ribbon: { q: 1, d: 1.5, max: 7e4 }
	};
	var mounts = [], byEl = new WeakMap(), G, io, ro, mo, raf = 0, last = 0, slow = 0, quality = 1, turn = 0, none = function () {};
	var dark = matchMedia('(prefers-color-scheme: dark)');
	var px = doc.createElement('canvas').getContext('2d', { willReadFrequently: true });
	if (px) px.canvas.width = px.canvas.height = 1;

	/* Any CSS colour, painted over `under`, as [r, g, b] from 0 to 1: the browser's own parser */
	function rgb(css, under) {
		css = (css || '').trim();
		if (!css || !px) return null;
		px.fillStyle = '#010203'; px.fillStyle = css;
		var f = px.fillStyle, d;
		if (f === '#010203') return null;
		px.fillStyle = 'rgb(' + (under || [0, 0, 0]).map(function (x) { return Math.round(x * 255); }) + ')'; px.fillRect(0, 0, 1, 1);
		px.fillStyle = f; px.fillRect(0, 0, 1, 1);
		d = px.getImageData(0, 0, 1, 1).data;
		return [d[0] / 255, d[1] / 255, d[2] / 255];
	}
	function lum(c) {
		c = c.map(function (x) { return x <= .04045 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); });
		return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
	}
	/* The colour really painted behind a layer: its own and its ancestors' backgrounds */
	function ground(el) {
		var stack = [], out = [1, 1, 1], c;
		for (; el; el = el.parentElement) {
			c = getComputedStyle(el).backgroundColor;
			if (c !== 'transparent' && c !== 'rgba(0, 0, 0, 0)') stack.push(c);
		}
		while (stack.length) out = rgb(stack.pop(), out) || out;
		return out;
	}
	/* Colours from the kit variables; the luminance the ground may take while text stays readable */
	function colours(m) {
		var cs = getComputedStyle(m.el), bg = m.bg = ground(m.el), Lb = lum(bg), lo = 0, hi = 1, K = m.o.contrast || 4.8, i, t;
		function v(n) { return rgb(cs.getPropertyValue(n), bg); }
		for (i = 1; i < 5; i++) if ((t = v('--kws-t' + i))) {
			if (lum(t) > Lb) hi = Math.min(hi, (lum(t) + .05) / K - .05);   // light text: a dark ground
			else lo = Math.max(lo, K * (lum(t) + .05) - .05);   // dark text: a light one
		}
		m.lum = [lo, hi];
		m.c = [v('--kws-s1'), v('--kws-s2'), v('--kws-s3')];
		if (m.name === 'band') {   // a lit and a deep tone of the ground
			m.c[0] = bg.map(function (x) { return Math.min(1, x * 1.3 + .01); });
			m.c[2] = bg.map(function (x) { return x * .66; });
		}
		if (m.name === 'wash') m.c = m.c.map(function (c) {   // soften any colour to a tint text can sit on
			for (i = 0; c && i < 12 && (lum(c) < lo || lum(c) > hi); i++) c = c.map(function (x, j) { return bg[j] + (x - bg[j]) * .8; });
			return c;
		});
		m.a = m.o.strength || (m.name !== 'wash' ? 1 : Lb > .4 ? .6 : .8);
		m.stale = false;
	}
	/* band: where the host's text sits, as a small mask the flecks keep out of */
	function keepOut(m) {
		var gl = G.gl, N = 128, cv = doc.createElement('canvas'), x = cv.getContext('2d'), b = m.el.getBoundingClientRect();
		var tw = doc.createTreeWalker(m.el.parentElement, 4), r = doc.createRange(), n;
		cv.width = cv.height = N; x.fillStyle = '#fff';
		x.setTransform(N / b.width, 0, 0, N / b.height, 0, 0);
		while ((n = tw.nextNode())) if (/\S/.test(n.data)) {
			r.selectNodeContents(n);
			[].forEach.call(r.getClientRects(), function (q) { x.fillRect(q.left - b.left - 22, q.top - b.top - 22, q.width + 44, q.height + 44); });
		}
		m.tex = m.tex || gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, m.tex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		m.remask = false;
	}

	function context() {
		if (G || G === null) return G;   // null: there is no WebGL to be had
		var cv = doc.createElement('canvas'), gl = cv.getContext('webgl', { antialias: false, depth: false, powerPreference: 'low-power' });
		if (!gl) return (G = null);
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);   // one triangle covers the view
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
		cv.addEventListener('webglcontextlost', function () {   // back to the stills; the next draw asks for a new context
			if (!G || G.cv !== cv) return;
			G = 0;
			mounts.forEach(function (m) { m.tex = 0; m.dirty = true; m.el.classList.remove('is-live'); });
		});
		return (G = { cv: cv, gl: gl, progs: {} });
	}
	function program(name) {
		var gl = G.gl, p = G.progs[name], prog;
		if (p) return p;
		prog = gl.createProgram();
		[[gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'], [gl.FRAGMENT_SHADER, HEAD + FRAG[name].join('\n')]].forEach(function (s) {
			var sh = gl.createShader(s[0]);
			gl.shaderSource(sh, s[1]); gl.compileShader(sh); gl.attachShader(prog, sh);
		});
		gl.bindAttribLocation(prog, 0, 'p');
		gl.linkProgram(prog);
		p = G.progs[name] = { p: prog, ok: gl.getProgramParameter(prog, gl.LINK_STATUS) };
		'R Lm T A S Z C1 C2 C3 B'.split(' ').forEach(function (n) { p[n] = gl.getUniformLocation(prog, n); });
		return p;
	}
	function fit(m) {
		var p = P[m.name], s = Math.min(p.q * Math.min(devicePixelRatio || 1, p.d), Math.sqrt(p.max / (m.w * m.h || 1))) * quality;
		m.cw = Math.max(2, Math.round(m.w * s)); m.ch = Math.max(2, Math.round(m.h * s));
		m.dirty = m.remask = true;
	}
	function draw(m) {
		if (!m.w || !m.h || !context()) return;
		var gl = G.gl, c = G.cv, w = m.cw, h = m.ch, p = program(m.name);
		if (!p.ok) return;
		if (m.stale) colours(m);
		if (m.cv.width !== w || m.cv.height !== h) { m.cv.width = w; m.cv.height = h; }
		if (c.width < w || c.height < h) { c.width = Math.max(c.width, w); c.height = Math.max(c.height, h); }
		gl.useProgram(p.p);
		gl.viewport(0, 0, w, h);
		if (m.name === 'band') { if (m.remask || !m.tex) keepOut(m); gl.bindTexture(gl.TEXTURE_2D, m.tex); }
		gl.uniform2f(p.R, w, h); gl.uniform2f(p.Lm, m.lum[0], m.lum[1]);
		gl.uniform1f(p.T, m.t); gl.uniform1f(p.A, m.a); gl.uniform1f(p.S, m.w / w); gl.uniform1f(p.Z, m.seed);
		[p.C1, p.C2, p.C3, p.B].forEach(function (u, i) { var k = i < 3 && (m.c[i] || m.c[0]) || m.bg; gl.uniform3f(u, k[0], k[1], k[2]); });
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		m.x.globalCompositeOperation = 'copy';
		m.x.drawImage(c, 0, c.height - h, w, h, 0, 0, w, h);   // shared context to this layer's canvas
		m.dirty = false;
		m.el.classList.add('is-live');
	}

	function frame(now) {
		raf = 0;
		var anim = !off() && !doc.hidden, dt = now - last, start = turn, used = 0, again, i, m;
		if (anim && last && dt < 30) { raf = requestAnimationFrame(frame); return; }   // 30 frames a second is plenty
		if (anim && last) {   // falling behind: draw fewer pixels
			slow = dt > 50 ? slow + 1 : Math.max(0, slow - 1);
			if (slow > 12 && quality > .45) { quality *= .75; slow = 0; mounts.forEach(fit); }
		}
		last = 0;
		mounts.slice().forEach(function (m) { if (!m.el.isConnected) unmount(m); });
		for (i = 0; i < mounts.length; i++) {   // layers on screen take turns, so a frame never draws more than its share
			m = mounts[(start + i) % mounts.length];
			if (!m.vis || !(anim || m.dirty)) continue;
			if (anim) last = now;
			if (used && used + m.cw * m.ch > 15e4) { again = 1; continue; }
			if (anim) m.t += Math.min(now - (m.at || now), 250) / 1000 * m.speed;
			m.at = anim && now;
			draw(m);
			used += m.cw * m.ch;
			turn = start + i + 1;
		}
		if (last || again) raf = requestAnimationFrame(frame);
	}
	function kick() { if (!raf && mounts.length) raf = requestAnimationFrame(frame); }
	function restyle() { mounts.forEach(function (m) { m.stale = m.dirty = true; }); kick(); }

	function unmount(m) {
		var i = mounts.indexOf(m), x;
		if (i < 0) return;
		mounts.splice(i, 1); byEl.delete(m.el);
		io.unobserve(m.el); ro.unobserve(m.el);
		m.cv.remove();
		m.el.classList.remove('is-live');
		if (m.tex && G) G.gl.deleteTexture(m.tex);
		if (!mounts.length) {   // last one out: let go of it all
			io.disconnect(); ro.disconnect(); mo.disconnect(); io = 0;
			dark.removeEventListener('change', restyle);
			doc.removeEventListener('visibilitychange', kick);
			cancelAnimationFrame(raf); raf = last = 0;
			x = G && G.gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext();
			G = 0;
		}
	}
	function mount(el, o) {
		var name = el && el.getAttribute('data-shader') || 'wash', cv, m, seed;
		if (!el || (navigator.connection || {}).saveData || !FRAG[name]) return none;
		if (byEl.get(el)) return byEl.get(el).end;
		if (!context()) return none;
		o = o || {};
		cv = el.appendChild(doc.createElement('canvas'));
		seed = o.seed != null ? o.seed : +el.getAttribute('data-tone') || 0;
		m = { el: el, o: o, name: name, cv: cv, x: cv.getContext('2d'), seed: seed * 1.7, t: 12 + seed * 9, speed: o.speed || +el.getAttribute('data-shader-speed') || 1, stale: true };
		m.end = function () { unmount(m); };
		if (!io) {
			io = new IntersectionObserver(function (es) {
				es.forEach(function (e) { var k = byEl.get(e.target); if (k) k.vis = e.isIntersecting; });
				kick();
			}, { rootMargin: '40px' });
			ro = new ResizeObserver(function (es) {
				es.forEach(function (e) { var k = byEl.get(e.target); if (k) { k.w = e.contentRect.width; k.h = e.contentRect.height; fit(k); } });
				kick();
			});
			mo = new MutationObserver(restyle);
			mo.observe(html, { attributes: true, attributeFilter: ['data-theme', 'data-motion'] });
			dark.addEventListener('change', restyle);
			doc.addEventListener('visibilitychange', kick);
		}
		mounts.push(m); byEl.set(el, m);
		io.observe(el); ro.observe(el);
		return m.end;
	}
  KWS.shader = { mount: mount, refresh: restyle };

	/* Auto-start: the button at once, the drawing when the page has gone quiet */
	function each(name, fn) { [].forEach.call(doc.querySelectorAll('[data-kws="' + name + '"]'), function (el) { fn(el); }); }
	function start() {
		each('motion', KWS.motion.mount);
		var go = function () { each('shader', mount); };
		if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 800 }); else setTimeout(go, 200);
	}
	if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})();
