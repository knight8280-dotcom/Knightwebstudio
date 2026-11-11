/* ==========================================================================
   KnightWebstudio — animated grain gradient (WebGL)
   Hand-written, no dependencies and nothing to licence: slow-drifting light
   in the brand colours, drawn on a <canvas> behind a section.

   Use: add data-shader to a section that is position: relative and
   isolation: isolate (.hero already is), and load this file with defer.
       <section class="hero" data-shader>
   Optional attributes:
       data-shader-colors="#a5b8ff,#46e0c0,#c9d4ff"   three fixed colours.
           Default: --brand, --accent and --brand-soft, so it follows the
           theme toggle.
       data-shader-strength="0.32,0.14"   peak opacity on the dark and the
           light theme.
   On other sites (a React build, say) call window.KWSShader.mount(el, opts)
   after the element is on the page; it returns a function that removes it.

   Text stays readable: every pixel's opacity is capped so the background
   it makes keeps the section's text colours (--text, --muted, --brand-soft,
   --accent) at 4.6:1 or better against it, whatever the colours or theme.

   Easy on phones: nothing starts until the page has loaded; it draws at
   most 30 frames a second at no more than one pixel per CSS pixel; it stops
   when scrolled out of view or in a background tab; visitors who ask for
   reduced motion get one still frame; with no WebGL, or Save-Data on, the
   CSS glow stays instead.
   ========================================================================== */
(function () {
  'use strict';

  var VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';

  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2 u_res;',
    'uniform float u_time;',
    'uniform vec3 u_c1, u_c2, u_c3;',
    'uniform float u_alpha;',   // peak opacity
    'uniform float u_fade;',    // 1 = fade out towards the bottom edge
    'uniform vec3 u_bg;',       // the page colour under the canvas
    'uniform vec2 u_lum;',      // allowed background luminance: min, max

    // 2D simplex noise: Ian McEwan, Ashima Arts (MIT licence)
    'vec3 permute(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}',
    'float snoise(vec2 v){',
    '  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);',
    '  vec2 i=floor(v+dot(v,C.yy));',
    '  vec2 x0=v-i+dot(i,C.xx);',
    '  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);',
    '  vec4 x12=x0.xyxy+C.xxzz;',
    '  x12.xy-=i1;',
    '  i=mod(i,289.0);',
    '  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));',
    '  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);',
    '  m=m*m;m=m*m;',
    '  vec3 x=2.0*fract(p*C.www)-1.0;',
    '  vec3 h=abs(x)-0.5;',
    '  vec3 ox=floor(x+0.5);',
    '  vec3 a0=x-ox;',
    '  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);',
    '  vec3 g;',
    '  g.x=a0.x*x0.x+h.x*x0.y;',
    '  g.yz=a0.yz*x12.xz+h.yz*x12.yw;',
    '  return 130.0*dot(m,g);',
    '}',

    'float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}',

    // Relative luminance of an sRGB colour (WCAG formula)
    'float lum(vec3 c){',
    '  vec3 l=mix(c/12.92,pow((c+0.055)/1.055,vec3(2.4)),step(0.04045,c));',
    '  return dot(l,vec3(0.2126,0.7152,0.0722));',
    '}',
    'bool ok(float L){return L>=u_lum.x&&L<=u_lum.y;}',
    // Largest opacity up to a whose blend over the page keeps text readable
    'float guard(vec3 col,float a){',
    '  if(ok(lum(mix(u_bg,col,a))))return a;',
    '  float lo=0.0,hi=a;',
    '  for(int i=0;i<7;i++){',
    '    float mid=0.5*(lo+hi);',
    '    if(ok(lum(mix(u_bg,col,mid))))lo=mid;else hi=mid;',
    '  }',
    '  return lo;',
    '}',

    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/u_res;',
    // One unit = the section's geometric-mean side, so the lights keep a
    // similar size on a wide desktop hero and a tall phone one
    '  float unit=sqrt(u_res.x*u_res.y);',
    '  vec2 p=gl_FragCoord.xy/unit;',
    '  vec2 k=u_res/unit;',
    '  float t=u_time;',
    // Domain warp bends the round lights into slow, liquid shapes
    '  vec2 w=vec2(snoise(p*0.9+vec2(0.0,t*0.05)),snoise(p*0.9+vec2(5.2,-t*0.04)));',
    '  vec2 q=p+w*0.28;',
    // Three lights drifting on long, out-of-step loops (y is up)
    '  vec2 b1=k*vec2(0.22+0.10*sin(t*0.11),0.80+0.08*cos(t*0.09));',
    '  vec2 b2=k*vec2(0.82+0.08*cos(t*0.08+1.0),0.60+0.10*sin(t*0.10));',
    '  vec2 b3=k*vec2(0.50+0.18*sin(t*0.07+2.0),0.32+0.08*cos(t*0.12));',
    '  vec2 d1=q-b1,d2=q-b2,d3=q-b3;',
    '  float f1=exp(-dot(d1,d1)/0.16);',
    '  float f2=exp(-dot(d2,d2)/0.12)*0.55;',
    '  float f3=exp(-dot(d3,d3)/0.14)*0.70;',
    '  float s=f1+f2+f3;',
    '  vec3 col=(u_c1*f1+u_c2*f2+u_c3*f3)/max(s,1e-4);',
    '  float a=min(s,1.0);',
    // A faint ripple of brighter and darker bands through the colour
    '  a*=0.85+0.15*snoise(q*2.2+vec2(t*0.03,0.0));',
    '  a*=mix(1.0,smoothstep(0.0,0.45,uv.y),u_fade);',
    // Grain: gives the gradient texture and stops it banding
    '  a*=1.0+(hash(floor(gl_FragCoord.xy))-0.5)*0.35;',
    '  a=guard(col,clamp(a*u_alpha,0.0,1.0));',
    '  gl_FragColor=vec4(col*a,a);',  // premultiplied alpha
    '}'
  ].join('\n');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);

  /* Any CSS colour → [r, g, b] in 0–1, using the browser's own parser */
  var parser = document.createElement('canvas').getContext('2d');
  function rgb(css) {
    css = (css || '').trim();
    if (!css || !parser) return null;
    parser.fillStyle = '#000';
    parser.fillStyle = css;
    var v = parser.fillStyle;
    var n = v.charAt(0) === '#'
      ? [v.slice(1, 3), v.slice(3, 5), v.slice(5, 7)].map(function (h) { return parseInt(h, 16); })
      : (v.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    return n.length === 3 ? n.map(function (x) { return x / 255; }) : null;
  }
  function lin(c) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function lum(c) { return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]); }

  function mount(el, opts) {
    opts = opts || {};
    var noop = function () {};
    if (saveData || !el) return noop;

    var canvas = document.createElement('canvas');
    canvas.className = 'shader-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    var gl = canvas.getContext('webgl', {
      alpha: true, premultipliedAlpha: true, antialias: false,
      depth: false, stencil: false, powerPreference: 'low-power'
    });
    if (!gl) return noop;

    function shader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var vs = shader(gl.VERTEX_SHADER, VERT);
    var fs = shader(gl.FRAGMENT_SHADER, FRAG);
    var prog = gl.createProgram();
    if (!vs || !fs) return noop;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return noop;
    gl.useProgram(prog);

    // One triangle larger than the screen covers every pixel
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var pos = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ['u_res', 'u_time', 'u_c1', 'u_c2', 'u_c3', 'u_alpha', 'u_fade', 'u_bg', 'u_lum'].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });

    var strength = opts.strength || [0.32, 0.14];
    var time = opts.start != null ? opts.start : 12;   // a pleasing first frame
    var speed = opts.speed || 1;
    var still = reduceMotion;
    var visible = false, running = false, lost = false, drawn = false;
    var raf = 0, last = 0;

    /* Colours come from the CSS tokens, re-read whenever the theme changes */
    function readColours() {
      var cs = getComputedStyle(el);
      var v = function (name) { return cs.getPropertyValue(name); };
      var cols = (opts.colors || [v('--brand'), v('--accent'), v('--brand-soft')]).map(rgb);
      var bg = rgb(opts.bg || v('--bg')) || [0, 0, 0];
      var texts = (opts.text || [v('--text'), v('--muted'), v('--brand-soft'), v('--accent')]).map(rgb);
      var target = opts.contrast || 4.6;
      var Lb = lum(bg), lo = 0, hi = 1;
      texts.forEach(function (c) {
        if (!c) return;
        var Lt = lum(c);
        if (Lt > Lb) hi = Math.min(hi, (Lt + 0.05) / target - 0.05);   // light text: keep the ground dark
        else lo = Math.max(lo, target * (Lt + 0.05) - 0.05);            // dark text: keep it light
      });
      gl.useProgram(prog);
      [U.u_c1, U.u_c2, U.u_c3].forEach(function (u, i) {
        var c = cols[i] || cols[0] || [0.43, 0.55, 1];
        gl.uniform3f(u, c[0], c[1], c[2]);
      });
      gl.uniform3f(U.u_bg, bg[0], bg[1], bg[2]);
      gl.uniform2f(U.u_lum, lo, hi);
      gl.uniform1f(U.u_alpha, Lb > 0.5 ? strength[1] : strength[0]);
      gl.uniform1f(U.u_fade, opts.fade === false ? 0 : 1);
    }

    function size() {
      var scale = Math.min(window.devicePixelRatio || 1, 1);
      var w = Math.round(el.clientWidth * scale), h = Math.round(el.clientHeight * scale);
      if (w && h && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    function draw() {
      if (lost || !canvas.width || !canvas.height) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.u_res, canvas.width, canvas.height);
      gl.uniform1f(U.u_time, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!drawn) {
        drawn = true;
        canvas.classList.add('is-on');
        el.classList.add('shader-on');
      }
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (now - last < 30) return;                  // ~30 fps is plenty for a slow drift
      if (last) time += Math.min(now - last, 100) / 1000 * speed;
      last = now;
      draw();
    }
    function start() {
      if (running || still || lost || !visible || document.hidden) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      lost = true;
      stop();
      canvas.classList.remove('is-on');
      el.classList.remove('shader-on');
    });

    el.insertBefore(canvas, el.firstChild);   // first, so the section's own art paints over it
    readColours();
    size();
    draw();

    var ro = 'ResizeObserver' in window
      ? new ResizeObserver(function () { size(); if (!running) draw(); })
      : null;
    if (ro) ro.observe(el);

    var io = 'IntersectionObserver' in window
      ? new IntersectionObserver(function (entries) {
          visible = entries[entries.length - 1].isIntersecting;
          if (visible) start(); else stop();
        })
      : null;
    if (io) io.observe(el); else { visible = true; start(); }

    function onVisibility() { if (document.hidden) stop(); else start(); }
    document.addEventListener('visibilitychange', onVisibility);

    var mo = new MutationObserver(function () { readColours(); if (!running) draw(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return function destroy() {
      stop();
      if (ro) ro.disconnect();
      if (io) io.disconnect();
      mo.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      var ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      el.classList.remove('shader-on');
    };
  }

  window.KWSShader = { mount: mount };

  /* Sections marked data-shader, once the page has loaded and gone quiet,
     so the drawing never competes with the first paint */
  function init() {
    document.querySelectorAll('[data-shader]').forEach(function (el) {
      var o = {};
      var c = el.getAttribute('data-shader-colors');
      var s = el.getAttribute('data-shader-strength');
      if (c) o.colors = c.split(',');
      if (s) o.strength = s.split(',').map(Number);
      if (o.strength && o.strength.length < 2) o.strength.push(o.strength[0]);
      mount(el, o);
    });
  }
  function later() {
    if ('requestIdleCallback' in window) requestIdleCallback(init, { timeout: 1500 });
    else setTimeout(init, 200);
  }
  if (document.readyState === 'complete') later();
  else window.addEventListener('load', later);
})();
