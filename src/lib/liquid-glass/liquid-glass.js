/*!
 * liquid-glass.js — a WebGL2 port of LiquidGlassKit (DnV1eX, 2025)
 *
 * The refraction, chromatic dispersion, LCH glare and smooth-union shape merging
 * come straight from LiquidGlassFragment.metal. The components (switch, slider,
 * tab bar lens, draggable lens) follow LiquidGlassSwitch / LiquidGlassSlider /
 * LiquidLensView: contracted solid thumbs that morph into glass while touched,
 * rubber-band edges, springs, and squash/stretch from motion.
 *
 * How it works on the web: the browser cannot hand WebGL the pixels of the DOM,
 * so the backdrop is a source you give the engine (an image, canvas or video).
 * One fixed full-screen canvas draws that backdrop and every glass surface over
 * it. Your DOM elements stay on top, transparent, and carry the text, icons and
 * pointer events. Glass surfaces follow their elements' on-screen rects every
 * frame (CSS transforms and transitions included).
 *
 * Layers: glass on layer N refracts everything drawn on layers < N, so a glass
 * thumb on layer 1 can sit on a glass sheet on layer 0. Solid "fills" (switch
 * tracks, slider fills) are drawn under the glass of their own layer.
 */

const MAX_SHAPES = 16;
const MAX_FILLS = 24;

// ---------------------------------------------------------------------------
// Materials. Values mirror LiquidGlass.regular / .lens / .thumb in the kit.
// frost is a blur radius in CSS px (the kit downsamples + blurs its capture).
// zoom > 1 shows a wider area (kit's backgroundTextureSizeCoefficient).
// ---------------------------------------------------------------------------
export const presets = {
  regular: () => ({
    thickness: 10, refraction: 1.5, dispersion: 5, frost: 6, zoom: 1, refractScale: 1,
    glare: 0.1, glareConvergence: 0.1, glareAngle: -Math.PI / 4, glareSharpness: -0.15,
    glareRange: 30, glareOppositeBias: 1, shadow: 0,
    tint: { light: [0.902, 0.951, 1.0, 0.6], dark: [0.0, 0.05, 0.1, 0.6] },
  }),
  clear: () => ({
    thickness: 6, refraction: 1.1, dispersion: 15, frost: 0, zoom: 1.1, refractScale: 1,
    glare: 0.1, glareConvergence: 0.1, glareAngle: -Math.PI / 4, glareSharpness: -0.1,
    glareRange: 30, glareOppositeBias: 1, shadow: 1,
    tint: { light: [1, 1, 1, 0], dark: [1, 1, 1, 0] },
  }),
  thumb: (magnification = 1) => ({
    thickness: 10, refraction: 1.11, dispersion: 5, frost: 0, zoom: 1 / magnification, refractScale: 1,
    glare: 0.01, glareConvergence: 0, glareAngle: Math.PI * 0.9, glareSharpness: -0.2,
    glareRange: 30, glareOppositeBias: 0, shadow: 1,
    tint: { light: [0.9, 0.95, 1.0, 0.15], dark: [0.9, 0.95, 1.0, 0.15] },
  }),
};
presets.lens = presets.clear;

// ---------------------------------------------------------------------------
// Springs (response / damping ratio, like SwiftUI) and small helpers
// ---------------------------------------------------------------------------
export class Spring {
  constructor(value = 0, { response = 0.35, dampingRatio = 0.8 } = {}) {
    this.value = value; this.target = value; this.velocity = 0;
    this.config(response, dampingRatio);
  }
  config(response, dampingRatio) {
    this.k = (2 * Math.PI / response) ** 2;
    this.c = 4 * Math.PI * dampingRatio / response;
    return this;
  }
  step(dt) {
    let t = dt;
    while (t > 1e-6) {
      const h = Math.min(t, 1 / 240);
      const a = -this.k * (this.value - this.target) - this.c * this.velocity;
      this.velocity += a * h; this.value += this.velocity * h; t -= h;
    }
    if (Math.abs(this.value - this.target) < 1e-4 && Math.abs(this.velocity) < 1e-3) {
      this.value = this.target; this.velocity = 0;
    }
    return this.value;
  }
  jump(v) { this.value = this.target = v; this.velocity = 0; }
  get settled() { return this.value === this.target && this.velocity === 0; }
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rubber = (v, lo, hi) => (v < lo ? lo - Math.sqrt(lo - v) : v > hi ? hi + Math.sqrt(v - hi) : v);

/** Squash & stretch from motion (LiquidLensView's acceleration-driven jelly). */
export class Jelly {
  constructor({ gain = 0.00012, max = 0.25 } = {}) {
    this.gain = gain; this.max = max; this.vx = 0; this.vy = 0; this.prev = null;
    this.s = new Spring(0, { response: 0.32, dampingRatio: 0.45 });
  }
  update(x, y, dt) {
    if (this.prev && dt > 0) {
      const k = Math.min(1, dt / 0.06);
      this.vx += ((x - this.prev.x) / dt - this.vx) * k;
      this.vy += ((y - this.prev.y) / dt - this.vy) * k;
    }
    this.prev = { x, y };
    this.s.target = clamp((Math.abs(this.vx) - Math.abs(this.vy)) * this.gain, -this.max, this.max);
    return this.s.step(dt);
  }
}

// ---------------------------------------------------------------------------
// Shaders
// ---------------------------------------------------------------------------
const VERT = `#version 300 es
in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
#define PI 3.14159265359
uniform sampler2D uSrc;
uniform vec2 uSrcScale, uSrcOffset;   // uv = q * scale + offset  (q = CSS px, y down)
uniform float uTpp;                   // source texels per CSS px (for blur LOD)
uniform float uDpr;
uniform float uViewH;                 // device px
uniform float uMerge;                 // smooth-union distance, CSS px
uniform int uCount;
uniform vec4 uRect[${MAX_SHAPES}];    // x y w h
uniform vec4 uA[${MAX_SHAPES}];       // radius thickness refraction dispersion
uniform vec4 uB[${MAX_SHAPES}];       // frost zoom opacity shadow
uniform vec4 uC[${MAX_SHAPES}];       // glare convergence angle sharpness
uniform vec4 uD[${MAX_SHAPES}];       // glareRange oppositeBias refractScale -
uniform vec4 uT[${MAX_SHAPES}];       // tint rgba
uniform int uFillCount;
uniform vec4 uFR[${MAX_FILLS}];
uniform vec4 uFC[${MAX_FILLS}];
uniform vec4 uFO[${MAX_FILLS}];       // radius - - -
out vec4 fragColor;

float sdRR(vec2 p, vec4 r, float rad){
  vec2 h = r.zw * 0.5;
  vec2 c = r.xy + h;
  rad = min(rad, min(h.x, h.y));
  vec2 q = abs(p - c) - h + rad;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - rad;
}
float smin(float a, float b, float k){
  if (k <= 0.0) return min(a, b);
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
float shapeSDF(vec2 p){
  float d = 1e5;
  for (int i = 0; i < ${MAX_SHAPES}; i++){
    if (i >= uCount) break;
    d = smin(d, sdRR(p, uRect[i], uA[i].x), uMerge);
  }
  return d;
}

vec3 texAt(vec2 q, float lod){ return textureLod(uSrc, q * uSrcScale + uSrcOffset, lod).rgb; }
vec3 srcAt(vec2 q, float blur){
  vec3 c;
  if (blur < 0.5) c = texAt(q, 0.0);
  else {
    float lod = log2(max(blur * uTpp * 0.6, 1.0));
    float r = blur * 0.55;
    c = texAt(q, lod) * 0.36
      + (texAt(q + vec2(r, r), lod) + texAt(q + vec2(-r, r), lod)
       + texAt(q + vec2(r, -r), lod) + texAt(q + vec2(-r, -r), lod)) * 0.16;
  }
  float aa = max(blur * 2.0, 1.0 / uDpr);
  for (int i = 0; i < ${MAX_FILLS}; i++){
    if (i >= uFillCount) break;
    float d = sdRR(q, uFR[i], uFO[i].x);
    float cov = clamp(0.5 - d / aa, 0.0, 1.0);
    c = mix(c, uFC[i].rgb, uFC[i].a * cov);
  }
  return c;
}

// --- sRGB <-> LCH (from the kit, D65) ---
const vec3 WP = vec3(0.95045592705, 1.0, 1.08905775076);
const mat3 RGB2XYZ = mat3(vec3(0.4124, 0.3576, 0.1805), vec3(0.2126, 0.7152, 0.0722), vec3(0.0193, 0.1192, 0.9505));
const mat3 XYZ2RGB = mat3(vec3(3.2406255, -1.537208, -0.4986286), vec3(-0.9689307, 1.8757561, 0.0415175), vec3(0.0557101, -0.2040211, 1.0569959));
float toLin(float c){ return c > 0.04045 ? pow((c + 0.055) / 1.055, 2.4) : c / 12.92; }
float toGam(float c){ c = max(c, 0.0); return c <= 0.0031308 ? 12.92 * c : 1.055 * pow(c, 1.0 / 2.4) - 0.055; }
float fLab(float t){ return t > 0.00885645167 ? pow(t, 1.0 / 3.0) : 7.78703703704 * t + 0.13793103448; }
float fInv(float t){ return t > 0.206897 ? t * t * t : 0.12841854934 * (t - 0.137931034); }
vec3 rgb2lch(vec3 c){
  c = clamp(c, 0.0, 1.0);
  vec3 xyz = vec3(toLin(c.r), toLin(c.g), toLin(c.b)) * RGB2XYZ / WP;
  vec3 f = vec3(fLab(xyz.x), fLab(xyz.y), fLab(xyz.z));
  vec3 lab = vec3(116.0 * f.y - 16.0, 500.0 * (f.x - f.y), 200.0 * (f.y - f.z));
  return vec3(lab.x, length(lab.yz), atan(lab.z, lab.y));
}
vec3 lch2rgb(vec3 l){
  vec3 lab = vec3(l.x, l.y * cos(l.z), l.y * sin(l.z));
  float fy = (lab.x + 16.0) / 116.0;
  vec3 xyz = WP * vec3(fInv(fy + lab.y / 500.0), fInv(fy), fInv(fy - lab.z / 200.0));
  vec3 lin = xyz * XYZ2RGB;
  return clamp(vec3(toGam(lin.r), toGam(lin.g), toGam(lin.b)), 0.0, 1.0);
}

void main(){
  vec2 q = vec2(gl_FragCoord.x, uViewH - gl_FragCoord.y) / uDpr;

  float D = 1e5, wsum = 0.0, sh = 0.0;
  vec4 A = vec4(0.0), B = vec4(0.0), C = vec4(0.0), E = vec4(0.0), T = vec4(0.0);
  vec2 ctr = vec2(0.0);
  for (int i = 0; i < ${MAX_SHAPES}; i++){
    if (i >= uCount) break;
    vec4 r = uRect[i];
    float di = sdRR(q, r, uA[i].x);
    D = smin(D, di, uMerge);
    float w = exp(-max(di, 0.0) * 0.08) + 1e-5;
    wsum += w;
    A += uA[i] * w; B += uB[i] * w; C += uC[i] * w; E += uD[i] * w; T += uT[i] * w;
    ctr += (r.xy + r.zw * 0.5) * w;
    if (uB[i].w > 0.0){
      float ds = sdRR(q - vec2(0.0, 4.0), r, uA[i].x);
      sh = max(sh, uB[i].w * uB[i].z * 0.2 * (1.0 - smoothstep(-6.0, 12.0, ds)));
    }
  }

  vec3 base = srcAt(q, 0.0) * (1.0 - sh);
  if (uCount == 0 || D > 1.5){ fragColor = vec4(base, 1.0); return; }

  A /= wsum; B /= wsum; C /= wsum; E /= wsum; T /= wsum; ctr /= wsum;

  // Surface normal from the merged SDF
  float e = 0.5;
  vec2 n = vec2(shapeSDF(q + vec2(e, 0.0)) - shapeSDF(q - vec2(e, 0.0)),
                shapeSDF(q + vec2(0.0, e)) - shapeSDF(q - vec2(0.0, e)));
  float nl = length(n);
  n = nl > 1e-5 ? n / nl : vec2(0.0);

  // Refraction through a rounded glass rim (Snell, as in the kit)
  float thick = max(A.y, 0.1), ior = max(A.z, 1.0001);
  float depth = -D, shift = 0.0;
  if (depth < thick){
    float ratio = clamp(1.0 - max(depth, 0.0) / thick, 0.0, 1.0);
    float inc = asin(ratio * ratio);
    float tr = asin(clamp(sin(inc) / ior, -1.0, 1.0));
    shift = -tan(tr - inc);
  }
  vec2 qz = ctr + (q - ctr) * B.y;
  vec2 off = -n * shift * 70.71 * E.z;

  // Chromatic dispersion: per-channel offsets (n_r = 0.98, n_b = 1.02)
  float dsp = A.w * 0.02;
  vec3 refr;
  if (dsp * length(off) < 0.25) refr = srcAt(qz + off, B.x);
  else {
    refr.r = srcAt(qz + off * (1.0 + dsp), B.x).r;
    refr.g = srcAt(qz + off, B.x).g;
    refr.b = srcAt(qz + off * (1.0 - dsp), B.x).b;
  }

  vec3 col = mix(refr, T.rgb, T.a * 0.8);

  // Directional glare, boosted in LCH so highlights keep their hue
  float geom = clamp(pow(max(1.0 + D / 1500.0 * pow(500.0 / max(E.x, 1.0), 2.0) + C.w, 0.0), 5.0), 0.0, 1.0);
  if (geom > 0.001 && nl > 1e-5){
    float ang = atan(n.y, n.x); if (ang < 0.0) ang += 2.0 * PI;
    ang = (ang - PI / 4.0 + C.z) * 2.0;
    bool far = (ang > PI * 1.5 && ang < PI * 3.5) || ang < -PI * 0.5;
    float ag = (0.5 + 0.5 * sin(ang)) * (far ? 1.2 * E.y : 1.2) * C.x;
    ag = clamp(pow(max(ag, 0.0), 0.1 + C.y * 2.0), 0.0, 1.0);
    vec3 lch = rgb2lch(mix(refr, T.rgb, T.a * 0.5));
    lch.x = clamp(lch.x + 150.0 * ag * geom, 0.0, 120.0);
    lch.y += 30.0 * ag * geom;
    col = mix(col, lch2rgb(lch), clamp(ag * geom * 1.5, 0.0, 1.0));
  }

  float cov = clamp(0.5 - D * uDpr, 0.0, 1.0);
  fragColor = vec4(mix(base, col, cov * clamp(B.z, 0.0, 1.0)), 1.0);
}`;

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export class LiquidGlass {
  /**
   * @param {object} [opts]
   * @param {HTMLCanvasElement} [opts.canvas]  canvas to draw into (default: a fixed full-viewport canvas)
   * @param {number} [opts.maxDpr=2]
   * @param {'light'|'dark'} [opts.theme]      picks material tints (default: prefers-color-scheme)
   */
  constructor(opts = {}) {
    this.maxDpr = opts.maxDpr ?? 2;
    this.theme = opts.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.shapes = []; this.fills = []; this.layerOpts = new Map();
    this.frameCbs = new Set(); this._rects = new Map(); this._ops = new Map();
    this._dirty = true; this._last = null; this._prevSig = null;

    let canvas = opts.canvas;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '0', pointerEvents: 'none', display: 'block' });
      document.body.prepend(canvas);
    }
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
    this.supported = !!gl;
    if (!gl) return;
    this.gl = gl;
    this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

    const sh = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.bindAttribLocation(p, 0, 'aPos'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    this.prog = p;
    this.u = {};
    for (const n of ['uSrc', 'uSrcScale', 'uSrcOffset', 'uTpp', 'uDpr', 'uViewH', 'uMerge', 'uCount', 'uRect', 'uA', 'uB', 'uC', 'uD', 'uT', 'uFillCount', 'uFR', 'uFC', 'uFO'])
      this.u[n] = gl.getUniformLocation(p, n);

    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.srcTex = this._makeTex();
    this.fbos = [this._makeFbo(), this._makeFbo()];
    this.pk = {
      rect: new Float32Array(MAX_SHAPES * 4), a: new Float32Array(MAX_SHAPES * 4), b: new Float32Array(MAX_SHAPES * 4),
      c: new Float32Array(MAX_SHAPES * 4), d: new Float32Array(MAX_SHAPES * 4), t: new Float32Array(MAX_SHAPES * 4),
      fr: new Float32Array(MAX_FILLS * 4), fc: new Float32Array(MAX_FILLS * 4), fo: new Float32Array(MAX_FILLS * 4),
    };

    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); cancelAnimationFrame(this._raf); });
    canvas.addEventListener('webglcontextrestored', () => location.reload());
    this._loop = this._loop.bind(this);
    this._raf = requestAnimationFrame(this._loop);
  }

  // ----- public API -------------------------------------------------------

  /**
   * Set the backdrop. fit:
   *  'page'  – the source covers the document at (0,0) with the given CSS width/height and scrolls with the page
   *  'cover' – the source covers the viewport and stays fixed
   * Pass live: true for video or a canvas you redraw every frame.
   */
  setSource(source, { fit = 'cover', width, height, live = false } = {}) {
    this.source = source;
    this.sourceOpts = { fit, width, height, live };
    this._uploadSource();
  }
  /** Call after you redraw a canvas source. */
  invalidateSource() { this._uploadSource(); }

  /**
   * Add a glass surface.
   * @param {Element|Function} target  element to track, or () => ({x, y, width, height}) in viewport CSS px
   * @param {object} [o]
   * @param {object} [o.material]      a preset object (shared objects can be edited live)
   * @param {number|'auto'|'pill'|Function} [o.radius='auto']   'auto' reads the element's border-radius
   * @param {number} [o.layer=0]
   * @param {number|Function} [o.opacity=1]
   */
  add(target, o = {}) {
    const s = {
      kind: 'shape', el: target instanceof Element ? target : null, rectFn: typeof target === 'function' ? target : null,
      material: o.material || presets.regular(), radius: o.radius ?? 'auto', layer: o.layer ?? 0, opacity: o.opacity ?? 1,
    };
    this.shapes.push(s); this._dirty = true; return s;
  }
  /** Add a solid rounded rect drawn beneath the glass of its layer (tracks, fills, badges). color: [r,g,b,a] 0–1 or () => [...] */
  addFill(target, o = {}) {
    const f = {
      kind: 'fill', el: target instanceof Element ? target : null, rectFn: typeof target === 'function' ? target : null,
      color: o.color || [1, 1, 1, 1], radius: o.radius ?? 'auto', layer: o.layer ?? 0, opacity: o.opacity ?? 1,
    };
    this.fills.push(f); this._dirty = true; return f;
  }
  remove(item) {
    const list = item.kind === 'fill' ? this.fills : this.shapes;
    const i = list.indexOf(item); if (i >= 0) list.splice(i, 1); this._dirty = true;
  }
  /** Per-layer options. merge: distance (CSS px) over which shapes melt together. */
  setLayer(layer, opts) { this.layerOpts.set(layer, { ...(this.layerOpts.get(layer) || {}), ...opts }); this._dirty = true; }
  setTheme(theme) { this.theme = theme; this._dirty = true; }
  onFrame(cb) { this.frameCbs.add(cb); return () => this.frameCbs.delete(cb); }
  invalidate() { this._dirty = true; }

  /** Cached per frame. */
  rectOf(el) {
    let r = this._rects.get(el);
    if (!r) { r = el.getBoundingClientRect(); this._rects.set(el, r); }
    return r;
  }
  opacityOf(el) {
    let v = this._ops.get(el);
    if (v === undefined) {
      const cs = getComputedStyle(el);
      v = cs.visibility === 'hidden' || cs.display === 'none' ? 0 : parseFloat(cs.opacity);
      this._ops.set(el, v);
    }
    return v;
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    this.gl?.getExtension('WEBGL_lose_context')?.loseContext();
    if (this.canvas.parentNode && !this.canvas.dataset.keep) this.canvas.remove();
  }

  // ----- internals --------------------------------------------------------

  _makeTex() {
    const gl = this.gl, t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    return t;
  }
  _makeFbo() { const gl = this.gl; return { tex: this._makeTex(), fb: gl.createFramebuffer(), w: 0, h: 0 }; }

  _uploadSource() {
    if (!this.gl || !this.source) return;
    const gl = this.gl, src = this.source;
    const sw = src.videoWidth || src.naturalWidth || src.width, shh = src.videoHeight || src.naturalHeight || src.height;
    if (!sw || !shh) return;
    let img = src;
    const max = this.maxTextureSize;
    if (sw > max || shh > max) {
      const k = Math.min(max / sw, max / shh);
      const c = this._scratch || (this._scratch = document.createElement('canvas'));
      c.width = Math.floor(sw * k); c.height = Math.floor(shh * k);
      c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
      img = c;
    }
    gl.bindTexture(gl.TEXTURE_2D, this.srcTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    this.srcSize = { w: sw, h: shh, texW: img.width };
    this._dirty = true;
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    const cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
    const w = Math.max(1, Math.round(cw * dpr)), h = Math.max(1, Math.round(ch * dpr));
    this.vw = cw; this.vh = ch; this.dpr = w / Math.max(cw, 1);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w; this.canvas.height = h; this._dirty = true;
      const gl = this.gl;
      for (const f of this.fbos) {
        gl.bindTexture(gl.TEXTURE_2D, f.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.bindFramebuffer(gl.FRAMEBUFFER, f.fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, f.tex, 0);
        f.w = w; f.h = h; f.mipped = false;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }

  _rectFor(item) {
    if (item.rectFn) return item.rectFn();
    const r = this.rectOf(item.el);
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  }
  _radiusFor(item, r) {
    const rad = item.radius;
    if (typeof rad === 'number') return rad;
    if (typeof rad === 'function') return rad(r);
    if (rad === 'auto' && item.el) {
      if (item._br === undefined || this._resized) item._br = parseFloat(getComputedStyle(item.el).borderTopLeftRadius) || 0;
      return item._br;
    }
    return Math.min(r.width, r.height) / 2; // 'pill'
  }
  _opacityFor(item) {
    const o = typeof item.opacity === 'function' ? item.opacity() : item.opacity;
    return item.el ? o * this.opacityOf(item.el) : o;
  }

  _loop(now) {
    this._raf = requestAnimationFrame(this._loop);
    const dt = this._last == null ? 1 / 60 : Math.min(0.05, (now - this._last) / 1000);
    this._last = now;
    this._rects.clear(); this._ops.clear();
    for (const cb of this.frameCbs) cb(dt, now);
    this._resize();
    if (this.sourceOpts?.live) this._uploadSource();
    this._render();
  }

  _collect() {
    const layers = new Map();
    const get = (l) => { let v = layers.get(l); if (!v) layers.set(l, v = { shapes: [], fills: [] }); return v; };
    const tk = this.theme === 'dark' ? 'dark' : 'light';
    for (const s of this.shapes) {
      const op = this._opacityFor(s);
      if (op < 0.01) continue;
      const r = this._rectFor(s);
      if (r.width <= 0.5 || r.height <= 0.5) continue;
      if (r.x > this.vw + 40 || r.y > this.vh + 40 || r.x + r.width < -40 || r.y + r.height < -40) continue;
      get(s.layer).shapes.push({ s, r, op, rad: this._radiusFor(s, r), tint: s.material.tint?.[tk] || s.material.tint || [1, 1, 1, 0] });
    }
    for (const f of this.fills) {
      const op = this._opacityFor(f);
      if (op < 0.01) continue;
      const r = this._rectFor(f);
      if (r.width <= 0 || r.height <= 0) continue;
      const c = typeof f.color === 'function' ? f.color() : f.color;
      if (c[3] * op < 0.004) continue;
      get(f.layer).fills.push({ r, c, op, rad: this._radiusFor(f, r) });
    }
    return [...layers.entries()].sort((a, b) => a[0] - b[0]);
  }

  _render() {
    const gl = this.gl;
    if (!this.srcSize) return;
    this._resized = false;
    const layers = this._collect();
    if (!layers.length) layers.push([0, { shapes: [], fills: [] }]);

    // Skip the frame when nothing moved
    const sig = [this.vw, this.vh, this.dpr, window.scrollX, window.scrollY, this.theme];
    for (const [l, L] of layers) {
      sig.push(l, this.layerOpts.get(l)?.merge ?? 0);
      for (const x of L.shapes) { const m = x.s.material; sig.push(x.r.x, x.r.y, x.r.width, x.r.height, x.op, x.rad, m.thickness, m.refraction, m.dispersion, m.frost, m.zoom, m.refractScale, m.glare, m.glareConvergence, m.glareAngle, m.glareSharpness, m.glareRange, m.glareOppositeBias, m.shadow, ...x.tint); }
      for (const x of L.fills) sig.push(x.r.x, x.r.y, x.r.width, x.r.height, x.op, x.rad, ...x.c);
    }
    const prev = this._prevSig;
    let same = !this._dirty && prev && prev.length === sig.length;
    if (same) for (let i = 0; i < sig.length; i++) if (sig[i] !== prev[i]) { same = false; break; }
    if (same) return;
    this._prevSig = sig; this._dirty = false;

    // Source mapping for the backdrop texture
    const so = this.sourceOpts, ss = this.srcSize;
    let scale, offset, tpp;
    if (so.fit === 'page') {
      const w = so.width || ss.w, h = so.height || ss.h;
      const ox = (this.vw - w) / 2 - window.scrollX;
      scale = [1 / w, 1 / h]; offset = [-ox / w, window.scrollY / h]; tpp = ss.texW / w;
    } else {
      const k = Math.max(this.vw / ss.w, this.vh / ss.h);
      const dw = ss.w * k, dh = ss.h * k, ox = (this.vw - dw) / 2, oy = (this.vh - dh) / 2;
      scale = [1 / dw, 1 / dh]; offset = [-ox / dw, -oy / dh]; tpp = ss.texW / dw;
    }

    gl.useProgram(this.prog);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.u.uDpr, this.dpr);
    gl.uniform1f(this.u.uViewH, this.canvas.height);
    gl.uniform1i(this.u.uSrc, 0);
    gl.activeTexture(gl.TEXTURE0);

    let srcTex = this.srcTex;
    const W = this.canvas.width, H = this.canvas.height, dpr = this.dpr;
    for (let li = 0; li < layers.length; li++) {
      const [layerId, L] = layers[li];
      const last = li === layers.length - 1;
      const target = last ? null : this.fbos[li % 2];
      const fb = target ? target.fb : null;
      if (li > 0) {
        // Copy the layers below, then redraw only the area this layer touches
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.fbos[(li - 1) % 2].fb);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, fb);
        gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        const grow = (r, m) => { x0 = Math.min(x0, r.x - m); y0 = Math.min(y0, r.y - m); x1 = Math.max(x1, r.x + r.width + m); y1 = Math.max(y1, r.y + r.height + m); };
        L.shapes.forEach((x) => grow(x.r, 20)); L.fills.forEach((x) => grow(x.r, 3));
        const sx = clamp(Math.floor(x0 * dpr), 0, W), sy = clamp(Math.floor(y0 * dpr), 0, H);
        const ex = clamp(Math.ceil(x1 * dpr), 0, W), ey = clamp(Math.ceil(y1 * dpr), 0, H);
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(sx, H - ey, Math.max(0, ex - sx), Math.max(0, ey - sy));
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.bindTexture(gl.TEXTURE_2D, srcTex);
      gl.uniform2fv(this.u.uSrcScale, scale); gl.uniform2fv(this.u.uSrcOffset, offset); gl.uniform1f(this.u.uTpp, tpp);
      gl.uniform1f(this.u.uMerge, this.layerOpts.get(layerId)?.merge ?? 0);
      this._uploadLayer(L);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.disable(gl.SCISSOR_TEST);

      if (!last) {
        // The next layer reads what we just drew; build mips only if it needs blur
        const next = layers[li + 1][1];
        const needBlur = next.shapes.some((x) => x.s.material.frost >= 0.5);
        gl.bindTexture(gl.TEXTURE_2D, target.tex);
        if (needBlur) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
        else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        srcTex = target.tex;
        scale = [1 / this.vw, -1 / this.vh]; offset = [0, 1]; tpp = dpr;
      }
    }
  }

  _uploadLayer(L) {
    const gl = this.gl, P = this.pk, u = this.u;
    const n = Math.min(L.shapes.length, MAX_SHAPES);
    for (let i = 0; i < n; i++) {
      const { s, r, op, rad, tint } = L.shapes[i], m = s.material, j = i * 4;
      P.rect.set([r.x, r.y, r.width, r.height], j);
      P.a.set([rad, m.thickness, m.refraction, m.dispersion], j);
      P.b.set([m.frost, m.zoom ?? 1, op, m.shadow ?? 0], j);
      P.c.set([m.glare, m.glareConvergence, m.glareAngle, m.glareSharpness], j);
      P.d.set([m.glareRange, m.glareOppositeBias, m.refractScale ?? 1, 0], j);
      P.t.set(tint, j);
    }
    const nf = Math.min(L.fills.length, MAX_FILLS);
    for (let i = 0; i < nf; i++) {
      const { r, c, op, rad } = L.fills[i], j = i * 4;
      P.fr.set([r.x, r.y, r.width, r.height], j);
      P.fc.set([c[0], c[1], c[2], c[3] * op], j);
      P.fo.set([rad, 0, 0, 0], j);
    }
    gl.uniform1i(u.uCount, n); gl.uniform1i(u.uFillCount, nf);
    gl.uniform4fv(u.uRect, P.rect); gl.uniform4fv(u.uA, P.a); gl.uniform4fv(u.uB, P.b);
    gl.uniform4fv(u.uC, P.c); gl.uniform4fv(u.uD, P.d); gl.uniform4fv(u.uT, P.t);
    gl.uniform4fv(u.uFR, P.fr); gl.uniform4fv(u.uFC, P.fc); gl.uniform4fv(u.uFO, P.fo);
  }
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
const mixColor = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
const offTrack = (engine) => (engine.theme === 'dark' ? [0.47, 0.47, 0.5, 0.36] : [0.47, 0.47, 0.5, 0.2]);
const WHITE = [1, 1, 1, 1];

/** iOS 26 switch (63×28). The thumb turns into glass while pressed. */
export class GlassSwitch {
  constructor(engine, host, { checked = false, onChange, tint = [0.204, 0.78, 0.349, 1], layer = 1, opacity = 1 } = {}) {
    Object.assign(this, { engine, host, checked, onChange, tint });
    host.setAttribute('role', 'switch'); host.tabIndex = 0;
    host.setAttribute('aria-checked', String(checked));
    Object.assign(host.style, { width: '63px', height: '28px', display: 'inline-block', touchAction: 'none', cursor: 'pointer', borderRadius: '14px' });
    const rm = engine.reducedMotion;
    this.pos = new Spring(checked ? 1 : 0, { response: 0.45, dampingRatio: 1 });
    this.on = new Spring(checked ? 1 : 0, { response: 0.25, dampingRatio: 1 });
    this.exp = new Spring(0, { response: 0.4, dampingRatio: rm ? 1 : 0.6 });
    this.material = presets.thumb();
    const op = () => (typeof opacity === 'function' ? opacity() : opacity);
    this.items = [
      engine.addFill(host, { radius: 14, layer, opacity: op, color: () => mixColor(offTrack(engine), tint, this.on.value) }),
      engine.addFill(() => this.thumbRect(), { radius: 'pill', layer, opacity: () => op() * clamp(1 - this.exp.value * 1.4, 0, 1), color: WHITE }),
      engine.add(() => this.thumbRect(), { material: this.material, radius: 'pill', layer, opacity: () => op() * clamp(this.exp.value, 0, 1) }),
    ];
    this.off = engine.onFrame((dt) => { this.pos.step(dt); this.on.step(dt); this.exp.step(dt); });
    this._bind();
  }
  thumbRect() {
    const r = this.engine.rectOf(this.host), e = Math.max(0, this.exp.value);
    const w = lerp(37, 58, e), h = lerp(24, 38.33, e);
    const cx = r.left + 2 + 18.5 + this.pos.value * (r.width - 4 - 37), cy = r.top + r.height / 2;
    return { x: cx - w / 2, y: cy - h / 2, width: w, height: h };
  }
  set(v, emit = true) {
    if (v === this.checked) return;
    this.checked = v; this.host.setAttribute('aria-checked', String(v));
    this.on.target = v ? 1 : 0;
    if (!this.drag) this.pos.target = v ? 1 : 0;
    if (emit) { navigator.vibrate?.(8); this.onChange?.(v); }
  }
  _pulse() { this.exp.target = 1; clearTimeout(this._t); this._t = setTimeout(() => (this.exp.target = 0), 260); }
  _bind() {
    const h = this.host;
    h.addEventListener('pointerdown', (e) => {
      h.setPointerCapture(e.pointerId);
      this.drag = { x: e.clientX, p: this.pos.value, t: performance.now(), moved: false };
      this.exp.target = 1;
    });
    h.addEventListener('pointermove', (e) => {
      const d = this.drag; if (!d) return;
      const travel = this.engine.rectOf(h).width - 4 - 37;
      if (Math.abs(e.clientX - d.x) > 3) d.moved = true;
      const px = rubber(d.p * travel + (e.clientX - d.x), 0, travel);
      this.pos.jump(px / travel);
      if (px >= travel && !this.checked) this.set(true);
      if (px <= 0 && this.checked) this.set(false);
    });
    const end = () => {
      const d = this.drag; if (!d) return;
      this.drag = null;
      if (!d.moved && performance.now() - d.t < 350) { this.set(!this.checked); this.pos.target = this.checked ? 1 : 0; this._pulse(); }
      else { this.pos.target = this.checked ? 1 : 0; this.exp.target = 0; }
    };
    h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
    h.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this.set(!this.checked); this.pos.target = this.checked ? 1 : 0; this._pulse(); }
    });
  }
  destroy() { this.items.forEach((i) => this.engine.remove(i)); this.off(); }
}

/** iOS 26 slider: 6px track, solid thumb that turns into a glass lens while dragged, rubber-band ends. */
export class GlassSlider {
  constructor(engine, host, { min = 0, max = 1, value = 0.5, step = 0, onInput, tint = [0, 0.478, 1, 1], layer = 1, opacity = 1, label } = {}) {
    Object.assign(this, { engine, host, min, max, step, onInput, tint });
    host.setAttribute('role', 'slider'); host.tabIndex = 0;
    if (label) host.setAttribute('aria-label', label);
    host.setAttribute('aria-valuemin', min); host.setAttribute('aria-valuemax', max);
    Object.assign(host.style, { height: '28px', display: 'block', touchAction: 'none', cursor: 'pointer', borderRadius: '14px' });
    this.value = value;
    this.p = new Spring(this._norm(value), { response: 0.18, dampingRatio: 1 });
    this.over = new Spring(0, { response: 0.4, dampingRatio: 0.7 });
    this.exp = new Spring(0, { response: 0.4, dampingRatio: engine.reducedMotion ? 1 : 0.6 });
    this.material = presets.thumb();
    const op = () => (typeof opacity === 'function' ? opacity() : opacity);
    const track = () => {
      const r = engine.rectOf(host), th = Math.max(2, 6 - Math.abs(this.over.value) * 0.25);
      const shift = this.over.value * 0.35;
      return { x: r.left + shift, y: r.top + r.height / 2 - th / 2, width: r.width, height: th };
    };
    this.items = [
      engine.addFill(track, { radius: 'pill', layer, opacity: op, color: () => offTrack(engine) }),
      engine.addFill(() => { const t = track(), c = this._cx(); return { ...t, width: Math.max(t.height, c - t.x) }; }, { radius: 'pill', layer, opacity: op, color: tint }),
      engine.addFill(() => this.thumbRect(), { radius: 'pill', layer, opacity: () => op() * clamp(1 - this.exp.value * 1.4, 0, 1), color: WHITE }),
      engine.add(() => this.thumbRect(), { material: this.material, radius: 'pill', layer, opacity: () => op() * clamp(this.exp.value, 0, 1) }),
    ];
    this.off = engine.onFrame((dt) => { this.p.step(dt); this.over.step(dt); this.exp.step(dt); });
    this._aria(); this._bind();
  }
  _norm(v) { return (v - this.min) / (this.max - this.min || 1); }
  _cx() { const r = this.engine.rectOf(this.host); return r.left + 18.5 + clamp(this.p.value, 0, 1) * (r.width - 37) + this.over.value; }
  thumbRect() {
    const r = this.engine.rectOf(this.host), e = Math.max(0, this.exp.value);
    const w = lerp(37, 58, e), h = lerp(24, 38.33, e), cx = this._cx(), cy = r.top + r.height / 2;
    return { x: cx - w / 2, y: cy - h / 2, width: w, height: h };
  }
  setValue(v, emit = false) {
    let n = clamp(this._norm(v), 0, 1);
    let val = this.min + n * (this.max - this.min);
    if (this.step) { val = Math.round((val - this.min) / this.step) * this.step + this.min; val = clamp(val, this.min, this.max); }
    this.value = +val.toFixed(6);
    this.p.target = this._norm(this.value);
    this._aria();
    if (emit) this.onInput?.(this.value);
  }
  _aria() { this.host.setAttribute('aria-valuenow', this.value); }
  _bind() {
    const h = this.host;
    const fromX = (x) => {
      const r = this.engine.rectOf(h), travel = r.width - 37;
      const raw = x - r.left - 18.5 - (this.drag?.grab || 0);
      const n = clamp(raw / travel, 0, 1);
      const excess = raw < 0 ? raw : raw > travel ? raw - travel : 0;
      this.over.jump(excess ? Math.sign(excess) * Math.sqrt(Math.abs(excess)) * 1.6 : 0);
      this.setValue(this.min + n * (this.max - this.min), true);
      this.p.jump(n);
    };
    h.addEventListener('pointerdown', (e) => {
      h.setPointerCapture(e.pointerId);
      const cx = this._cx();
      this.drag = { grab: Math.abs(e.clientX - cx) < 24 ? e.clientX - cx : 0 };
      this.exp.target = 1;
      if (!this.drag.grab) { this.p.target = this.p.value; fromX(e.clientX); }
    });
    h.addEventListener('pointermove', (e) => { if (this.drag) fromX(e.clientX); });
    const end = () => { if (!this.drag) return; this.drag = null; this.exp.target = 0; this.over.target = 0; };
    h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
    h.addEventListener('keydown', (e) => {
      const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
      if (!k) return;
      e.preventDefault();
      this.setValue(this.value + k * (this.step || (this.max - this.min) / 20), true);
    });
  }
  destroy() { this.items.forEach((i) => this.engine.remove(i)); this.off(); }
}

/**
 * Tab bar with the iOS 26 "liquid lens" selection: a resting pill that lifts
 * into a clear glass lens while you press or drag across the tabs.
 * host must contain the tab buttons (or pass them as items).
 */
export class GlassTabBar {
  constructor(engine, host, { items, selected = 0, onSelect, layer = 1, opacity = 1, material } = {}) {
    Object.assign(this, { engine, host, onSelect, selected });
    this.items = items || [...host.querySelectorAll('button')];
    host.setAttribute('role', 'tablist');
    host.style.touchAction = 'none';
    this.x = new Spring(0, { response: 0.38, dampingRatio: 0.78 });
    this.lift = new Spring(0, { response: 0.36, dampingRatio: engine.reducedMotion ? 1 : 0.62 });
    this.jelly = new Jelly({ gain: engine.reducedMotion ? 0 : 0.00016, max: 0.22 });
    this.material = material || { ...presets.clear(), zoom: 0.92 };
    this._s = 0; this._init = false;
    const op = () => (typeof opacity === 'function' ? opacity() : opacity);
    const pillColor = () => (engine.theme === 'dark' ? [1, 1, 1, 0.14] : [0, 0, 0, 0.07]);
    this.parts = [
      engine.addFill(() => this._pill(0), { radius: 'pill', layer, opacity: () => op() * clamp(1 - this.lift.value * 1.5, 0, 1), color: pillColor }),
      engine.add(() => this._pill(this.lift.value), { material: this.material, radius: 'pill', layer, opacity: () => op() * clamp(this.lift.value * 1.2, 0, 1) }),
    ];
    this.off = engine.onFrame((dt) => this._tick(dt));
    this.items.forEach((b, i) => {
      b.setAttribute('role', 'tab');
      b.addEventListener('click', (e) => { if (e.detail === 0) this.select(i, { animate: true }); });
    });
    this._emitted = selected;
    this._mark(); this._bind();
  }
  _center(i) { const hr = this.engine.rectOf(this.host), r = this.engine.rectOf(this.items[i]); return r.left + r.width / 2 - hr.left; }
  _pill(l) {
    const hr = this.engine.rectOf(this.host), ir = this.engine.rectOf(this.items[this.selected]);
    const w0 = ir.width - 4, h0 = hr.height - 8;
    const s = this._s * clamp(l, 0, 1);
    const w = lerp(w0, w0 * 1.12, l) * (1 + s), h = lerp(h0, h0 * 1.3, l) * (1 - s);
    const cx = hr.left + this.x.value, cy = hr.top + hr.height / 2;
    return { x: cx - w / 2, y: cy - h / 2, width: w, height: h };
  }
  _tick(dt) {
    if (!this._init) { this.x.jump(this._center(this.selected)); this._init = true; }
    this.x.step(dt); this.lift.step(dt);
    this._s = this.jelly.update(this.x.value, 0, dt);
    if (!this.drag && this.lift.target === 1 && this._landing && Math.abs(this.x.value - this.x.target) < 2 && Math.abs(this.x.velocity) < 60) {
      this._landing = false; this.lift.target = 0;
    }
  }
  _mark() {
    this.items.forEach((b, i) => { b.setAttribute('aria-selected', String(i === this.selected)); b.tabIndex = i === this.selected ? 0 : -1; b.classList.toggle('is-selected', i === this.selected); });
  }
  /** animate: slide the pill; lift: pop the lens while it travels; emit: call onSelect */
  select(i, { animate = true, lift = true, emit = true } = {}) {
    this.selected = i; this._mark();
    this.x.target = this._center(i);
    if (!animate) this.x.jump(this.x.target);
    else if (lift) { this.lift.target = 1; this._landing = true; }
    if (i !== this._emitted) { this._emitted = i; if (emit) this.onSelect?.(i); }
  }
  _nearest(localX) {
    let best = 0, bd = Infinity;
    this.items.forEach((_, i) => { const d = Math.abs(this._center(i) - localX); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  _bind() {
    const h = this.host;
    const local = (e) => {
      const hr = this.engine.rectOf(h);
      return clamp(e.clientX - hr.left, this._center(0), this._center(this.items.length - 1));
    };
    h.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      h.setPointerCapture(e.pointerId);
      this.drag = true; this._landing = false;
      this.lift.target = 1; this.x.target = local(e);
      const i = this._nearest(this.x.target);
      if (i !== this.selected) { this.selected = i; this._mark(); }
    });
    h.addEventListener('pointermove', (e) => {
      if (!this.drag) return;
      this.x.target = local(e);
      const i = this._nearest(this.x.target);
      if (i !== this.selected) { this.selected = i; this._mark(); }
    });
    const end = (e) => {
      if (!this.drag) return;
      this.drag = false;
      this.select(this._nearest(local(e)));
    };
    h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
    h.addEventListener('keydown', (e) => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!k) return;
      e.preventDefault();
      const i = clamp(this.selected + k, 0, this.items.length - 1);
      this.select(i, { animate: true }); this.items[i].focus();
    });
  }
  destroy() { this.parts.forEach((i) => this.engine.remove(i)); this.off(); }
}

/** A free-floating glass lens you can drag and throw. el should be position: fixed. */
export class GlassDraggable {
  constructor(engine, el, { material = presets.clear(), layer = 2, x, y, margin = 8 } = {}) {
    Object.assign(this, { engine, el, material, margin });
    Object.assign(el.style, { position: 'fixed', left: '0', top: '0', touchAction: 'none', cursor: 'grab' });
    this.x = x ?? innerWidth / 2; this.y = y ?? innerHeight / 2; this.vx = 0; this.vy = 0;
    this.jelly = new Jelly({ gain: engine.reducedMotion ? 0 : 0.00011, max: 0.2 });
    this.s = 0;
    this.shape = engine.add(() => {
      const w = el.offsetWidth * (1 + this.s), h = el.offsetHeight * (1 - this.s);
      return { x: this.x - w / 2, y: this.y - h / 2, width: w, height: h };
    }, { material, radius: 'pill', layer });
    this.off = engine.onFrame((dt) => this._tick(dt));
    this._bind(); this._place();
  }
  _place() { this.el.style.transform = `translate(${this.x - this.el.offsetWidth / 2}px, ${this.y - this.el.offsetHeight / 2}px)`; }
  _tick(dt) {
    if (!this.drag && (this.vx || this.vy)) {
      this.x += this.vx * dt; this.y += this.vy * dt;
      const f = Math.exp(-2.6 * dt); this.vx *= f; this.vy *= f;
      const hw = this.el.offsetWidth / 2 + this.margin, hh = this.el.offsetHeight / 2 + this.margin;
      if (this.x < hw) { this.x = hw; this.vx = Math.abs(this.vx) * 0.55; }
      if (this.x > innerWidth - hw) { this.x = innerWidth - hw; this.vx = -Math.abs(this.vx) * 0.55; }
      if (this.y < hh) { this.y = hh; this.vy = Math.abs(this.vy) * 0.55; }
      if (this.y > innerHeight - hh) { this.y = innerHeight - hh; this.vy = -Math.abs(this.vy) * 0.55; }
      if (Math.hypot(this.vx, this.vy) < 6) { this.vx = this.vy = 0; }
      this._place();
    }
    this.s = this.jelly.update(this.x, this.y, dt);
  }
  clampToViewport() {
    const hw = this.el.offsetWidth / 2 + this.margin, hh = this.el.offsetHeight / 2 + this.margin;
    this.x = clamp(this.x, hw, Math.max(hw, innerWidth - hw)); this.y = clamp(this.y, hh, Math.max(hh, innerHeight - hh)); this._place();
  }
  _bind() {
    const el = this.el;
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing';
      this.drag = { dx: e.clientX - this.x, dy: e.clientY - this.y, hist: [] };
      this.vx = this.vy = 0;
    });
    el.addEventListener('pointermove', (e) => {
      const d = this.drag; if (!d) return;
      this.x = e.clientX - d.dx; this.y = e.clientY - d.dy;
      d.hist.push({ x: this.x, y: this.y, t: performance.now() });
      if (d.hist.length > 8) d.hist.shift();
      this._place();
    });
    const end = () => {
      const d = this.drag; if (!d) return;
      this.drag = null; el.style.cursor = 'grab';
      const now = performance.now(), h = d.hist.filter((p) => now - p.t < 90);
      if (h.length > 1) {
        const a = h[0], b = h[h.length - 1], dt = Math.max(0.016, (b.t - a.t) / 1000);
        this.vx = clamp((b.x - a.x) / dt, -2600, 2600); this.vy = clamp((b.y - a.y) / dt, -2600, 2600);
      }
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  }
  destroy() { this.engine.remove(this.shape); this.off(); }
}
