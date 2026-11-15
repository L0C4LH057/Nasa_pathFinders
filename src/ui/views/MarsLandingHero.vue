<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useMarsStore } from '../stores/marsStore.js';
import { MARS_DESTINATIONS, flyToDestination } from '../../destinations.js';

const store = useMarsStore();

const canvasRef = ref(null);
const isReady = ref(false);
const isEntering = ref(false);
const isLeaving = ref(false);
const isFallback = ref(false);
const activeDestId = ref(store.selectedDestinationId || 'jezero');

const destinations = MARS_DESTINATIONS;
const currentDest = computed(() => destinations.find((d) => d.id === activeDestId.value) || destinations[0]);

// WebGL & Animation state
let gl = null;
let raf = null;
let lastTime = 0;
let ended = false;
let gone = false;

let yaw = 1.25;
let pitch = 0.22;
let dist = 4.6;
let dBase = 4.6;
let tDist = 4.6;
let vy = 0;
let vp = 0;
let autoBlend = 1;
let lastInter = -1e9;
let dragging = false;

let eStart = 0;
let eY0 = 0;
let eP0 = 0;
let eD0 = 0;
let eDY = 0;
let eDP = 0;
let entryVal = 0;

let cw = 1;
let ch = 1;
let dpr = 1;
let aspect = 1;
let texel = [1 / 2048, 1 / 1024];
const R = {};

const FOV = (35 * Math.PI) / 180;
const TH = Math.tan(FOV / 2);
const AUTO_ROT = 0.05;

// Acoustic synthesizer (Web Audio API)
function playMissionChirp() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.16);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.38);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);
  } catch {
    /* ignore audio restrictions */
  }
}

// Math helpers
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const eio = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const eout = (t) => 1 - (1 - t) ** 3;

function rotM(y, p) {
  const cy = Math.cos(y);
  const sy = Math.sin(y);
  const cp = Math.cos(p);
  const sp = Math.sin(p);
  return new Float32Array([
    cy, sp * sy, -cp * sy,
    0, cp, sp,
    sy, -sp * cy, cp * cy,
  ]);
}

function persp(fov, a, n, f) {
  const t = 1 / Math.tan(fov / 2);
  return new Float32Array([
    t / a, 0, 0, 0,
    0, t, 0, 0,
    0, 0, (f + n) / (n - f), -1,
    0, 0, (2 * f * n) / (n - f), 0,
  ]);
}

const radiusPx = () => (ch / dpr / 2) / (Math.sqrt(Math.max(dist * dist - 1, 0.01)) * TH);

function hit(clientX, clientY) {
  const cv = canvasRef.value;
  if (!cv) return false;
  const r = cv.getBoundingClientRect();
  const x = ((clientX - r.left) / r.width) * 2 - 1;
  const y = 1 - ((clientY - r.top) / r.height) * 2;
  const dx = x * aspect * TH;
  const dy = y * TH;
  const dz = -1;
  const m = Math.hypot(dx, dy, dz);
  const b = (dz / m) * -dist;
  return b > 0 && b * b - (dist * dist - 1) >= 0;
}

// Shader programs
const VS = `attribute vec3 aPos;attribute vec2 aUv;uniform mat3 uRot;uniform mat4 uProj;uniform float uDist;
varying vec2 vUv;varying vec3 vObj;varying vec3 vView;
void main(){vec3 p=uRot*aPos;vec3 vp=p+vec3(0.,0.,-uDist);vView=vp;vObj=aPos;vUv=aUv;gl_Position=uProj*vec4(vp,1.);}`;

const FS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTex;uniform mat3 uRot;uniform vec3 uLight;uniform vec2 uTexel;uniform float uBump;uniform float uEntry;
varying vec2 vUv;varying vec3 vObj;varying vec3 vView;
float lum(vec2 uv){return dot(texture2D(uTex,uv).rgb,vec3(.3,.59,.11));}
void main(){
 vec3 n0=normalize(vObj);
 vec3 T=normalize(cross(vec3(0.,1.,0.),n0)+vec3(1e-4,0.,0.));vec3 B=cross(n0,T);
 float he=lum(vUv+vec2(uTexel.x,0.))-lum(vUv-vec2(uTexel.x,0.));
 float hn=lum(vUv-vec2(0.,uTexel.y))-lum(vUv+vec2(0.,uTexel.y));
 vec3 n=normalize(n0-uBump*(he*T+hn*B));
 vec3 nv=normalize(uRot*n);vec3 ng=normalize(uRot*n0);
 vec3 Ld=normalize(uLight);vec3 V=normalize(-vView);
 float ndl=dot(nv,Ld);float d=clamp((ndl+.08)/1.08,0.,1.);
 vec3 alb=pow(texture2D(uTex,vUv).rgb,vec3(2.2));
 vec3 col=alb*(.010+1.55*d);
 float fres=pow(1.-max(dot(ng,V),0.),3.);
 float lit=.12+.88*smoothstep(-.25,.55,dot(ng,Ld));
 col+=fres*vec3(1.,.55,.34)*.75*lit;
 col+=pow(1.-max(dot(ng,V),0.),7.)*vec3(.45,.6,1.)*.35*lit;
 col=mix(col,vec3(.95,.44,.22)*(.35+.65*lit),uEntry*.88);
 col=col/(1.+.16*col);
 gl_FragColor=vec4(pow(col,vec3(1./2.2)),1.);}`;

const SVS = `attribute vec2 aPos;attribute float aSize;attribute float aBr;attribute float aPh;attribute float aTint;uniform float uDpr;uniform float uTime;
varying float vB;varying float vT;
void main(){gl_Position=vec4(aPos,0.,1.);gl_PointSize=aSize*uDpr;vB=aBr*(.82+.18*sin(uTime*(.6+aPh)+aPh*40.));vT=aTint;}`;

const SFS = `precision mediump float;varying float vB;varying float vT;
void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.08,d)*vB;vec3 c=mix(vec3(.75,.82,1.),vec3(1.,.82,.7),vT);gl_FragColor=vec4(c*a,1.);}`;

const GVS = `attribute vec2 aPos;varying vec2 vP;void main(){vP=aPos;gl_Position=vec4(aPos,0.,1.);}`;

const GFS = `precision mediump float;varying vec2 vP;uniform float uAspect;uniform float uR;uniform float uEntry;uniform vec2 uLdir;
void main(){vec2 p=vec2(vP.x*uAspect,vP.y);float r=length(p)/uR;vec2 dir=p/max(length(p),1e-4);
 float lit=.2+.8*smoothstep(-.3,.9,dot(dir,uLdir));
 float o=max(r-1.,0.);
 vec3 c=vec3(1.,.52,.32)*exp(-o*15.)*.5*lit+vec3(.9,.45,.3)*exp(-o*3.2)*.10*lit+vec3(.45,.6,1.)*exp(-o*34.)*.09*lit;
 c*=(1.+uEntry*1.6)*step(1.,r+.0001);
 gl_FragColor=vec4(c,1.);}`;

function sh(t, s) {
  const o = gl.createShader(t);
  gl.shaderSource(o, s);
  gl.compileShader(o);
  if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o));
  return o;
}

function prog(v, f) {
  const p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, v));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, f));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}

function buf(data, type) {
  const b = gl.createBuffer();
  gl.bindBuffer(type || gl.ARRAY_BUFFER, b);
  gl.bufferData(type || gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return b;
}

function initGL() {
  const cv = canvasRef.value;
  gl = cv.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' }) ||
       cv.getContext('experimental-webgl');
  if (!gl) throw new Error('WebGL unavailable');

  R.pm = prog(VS, FS);
  R.ps = prog(SVS, SFS);
  R.pg = prog(GVS, GFS);

  const SEG = 128;
  const RING = 64;
  const v = [];
  const idx = [];

  for (let j = 0; j <= RING; j++) {
    const ph = Math.PI / 2 - (Math.PI * j) / RING;
    for (let i = 0; i <= SEG; i++) {
      const la = -Math.PI + (2 * Math.PI * i) / SEG;
      v.push(
        Math.cos(ph) * Math.sin(la),
        Math.sin(ph),
        Math.cos(ph) * Math.cos(la),
        i / SEG,
        j / RING
      );
    }
  }

  for (let j = 0; j < RING; j++) {
    for (let i = 0; i < SEG; i++) {
      const a = j * (SEG + 1) + i;
      const b = a + SEG + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  R.vb = buf(new Float32Array(v));
  R.ib = buf(new Uint16Array(idx), gl.ELEMENT_ARRAY_BUFFER);
  R.n = idx.length;

  const s = [];
  for (let i = 0; i < 950; i++) {
    const k = Math.random() ** 3;
    s.push(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      0.9 + k * 1.9,
      0.25 + 0.75 * Math.random() ** 1.5,
      Math.random(),
      Math.random() < 0.18 ? 1 : 0
    );
  }
  R.sb = buf(new Float32Array(s));
  R.sn = 950;

  R.qb = buf(new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]));

  R.tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, R.tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([163, 88, 53, 255]));
  gl.getExtension('EXT_texture_filter_anisotropic');

  cv.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    if (!gone) isFallback.value = true;
  });
}

function uploadTex(img) {
  gl.bindTexture(gl.TEXTURE_2D, R.tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const ex = gl.getExtension('EXT_texture_filter_anisotropic');
  if (ex) {
    gl.texParameterf(gl.TEXTURE_2D, ex.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(ex.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  }
  texel = [1 / img.width, 1 / img.height];
}

function resize() {
  const cv = canvasRef.value;
  if (!cv) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cw = Math.max(1, Math.round(cv.clientWidth * dpr));
  ch = Math.max(1, Math.round(cv.clientHeight * dpr));
  cv.width = cw;
  cv.height = ch;
  aspect = cw / ch;

  dBase = Math.max(4.8, 1.32 / (TH * Math.min(aspect, 1.4)));
  if (!isEntering.value) {
    tDist = clamp(tDist, dBase * 0.62, dBase * 1.7);
    if (!isReady.value) {
      dist = tDist = dBase;
    }
  }
}

function draw(time) {
  if (!gl) return;
  gl.viewport(0, 0, cw, ch);
  gl.clearColor(0.012, 0.013, 0.017, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);

  // 1. Starfield background
  let p = R.ps;
  gl.useProgram(p);
  gl.bindBuffer(gl.ARRAY_BUFFER, R.sb);
  const st = 24;
  const at = (n, sz, off) => {
    const l = gl.getAttribLocation(p, n);
    gl.enableVertexAttribArray(l);
    gl.vertexAttribPointer(l, sz, gl.FLOAT, false, st, off);
  };
  at('aPos', 2, 0);
  at('aSize', 1, 8);
  at('aBr', 1, 12);
  at('aPh', 1, 16);
  at('aTint', 1, 20);
  gl.uniform1f(gl.getUniformLocation(p, 'uDpr'), dpr);
  gl.uniform1f(gl.getUniformLocation(p, 'uTime'), time);
  gl.drawArrays(gl.POINTS, 0, R.sn);

  // 2. Atmospheric glow
  p = R.pg;
  gl.useProgram(p);
  gl.bindBuffer(gl.ARRAY_BUFFER, R.qb);
  const l = gl.getAttribLocation(p, 'aPos');
  gl.enableVertexAttribArray(l);
  gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
  const uR = 1 / (Math.sqrt(Math.max(dist * dist - 1, 0.01)) * TH);
  const Lx = -0.75;
  const Ly = 0.38;
  const lm = Math.hypot(Lx, Ly);
  gl.uniform1f(gl.getUniformLocation(p, 'uAspect'), aspect);
  gl.uniform1f(gl.getUniformLocation(p, 'uR'), uR);
  gl.uniform1f(gl.getUniformLocation(p, 'uEntry'), entryVal);
  gl.uniform2f(gl.getUniformLocation(p, 'uLdir'), Lx / lm, Ly / lm);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  // 3. Planet sphere with bump mapping & illumination
  gl.disable(gl.BLEND);
  gl.enable(gl.DEPTH_TEST);
  p = R.pm;
  gl.useProgram(p);
  gl.bindBuffer(gl.ARRAY_BUFFER, R.vb);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, R.ib);
  const a1 = gl.getAttribLocation(p, 'aPos');
  const a2 = gl.getAttribLocation(p, 'aUv');
  gl.enableVertexAttribArray(a1);
  gl.vertexAttribPointer(a1, 3, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(a2);
  gl.vertexAttribPointer(a2, 2, gl.FLOAT, false, 20, 12);

  const rot = rotM(yaw, pitch);
  gl.uniformMatrix3fv(gl.getUniformLocation(p, 'uRot'), false, rot);
  gl.uniformMatrix4fv(gl.getUniformLocation(p, 'uProj'), false, persp(FOV, aspect, 0.05, 60));
  gl.uniform1f(gl.getUniformLocation(p, 'uDist'), dist);
  gl.uniform3f(gl.getUniformLocation(p, 'uLight'), -0.75, 0.38, 0.55);
  gl.uniform2f(gl.getUniformLocation(p, 'uTexel'), texel[0], texel[1]);
  gl.uniform1f(gl.getUniformLocation(p, 'uBump'), 4.8);
  gl.uniform1f(gl.getUniformLocation(p, 'uEntry'), entryVal);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, R.tex);
  gl.uniform1i(gl.getUniformLocation(p, 'uTex'), 0);
  gl.drawElements(gl.TRIANGLES, R.n, gl.UNSIGNED_SHORT, 0);
}

function update(dt, now) {
  if (isEntering.value) {
    const t = clamp((now - eStart) / 2800, 0, 1);
    yaw = eY0 + eDY * eout(clamp(t / 0.75, 0, 1));
    pitch = eP0 + eDP * eout(clamp(t / 0.75, 0, 1));
    dist = eD0 + (1.07 - eD0) * eio(t);
    entryVal = sstep(0.35, 0.95, t);

    if (t >= 1 && !ended) {
      ended = true;
      isLeaving.value = true;
      setTimeout(finish, 800);
    }
    return;
  }

  if (!dragging) {
    yaw += vy * dt;
    pitch += vp * dt;
    const k = Math.exp(-3 * dt);
    vy *= k;
    vp *= k;
  }

  const idle = (now - lastInter) / 1000;
  const target = !dragging && idle > 1.2 ? 1 : 0;
  autoBlend += (target - autoBlend) * Math.min(1, dt * 1.2);
  yaw += AUTO_ROT * autoBlend * dt;
  pitch = clamp(pitch, -1.25, 1.25);
  dist += (tDist - dist) * Math.min(1, dt * 6);
}

function frame(now) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
  lastTime = now;
  update(dt, now);
  draw(now / 1000);
}

// Target selection: smooth rotation to destination coordinates
function selectDestination(destId) {
  activeDestId.value = destId;
  store.setDestination(destId);

  const dest = destinations.find((d) => d.id === destId);
  if (!dest) return;

  const targetYaw = -((dest.lon * Math.PI) / 180);
  const targetPitch = (dest.lat * Math.PI) / 180;

  const dy = targetYaw - yaw;
  const shortestDy = Math.atan2(Math.sin(dy), Math.cos(dy));
  vy = shortestDy * 1.8;
  vp = (targetPitch - pitch) * 1.8;
  lastInter = performance.now();
}

function enterMission() {
  if (isEntering.value || !isReady.value) return;
  isEntering.value = true;
  playMissionChirp();

  // Synchronize Cesium 3D camera in background
  if (window.__marsController?.viewer) {
    flyToDestination(window.__marsController.viewer, activeDestId.value, { duration: 3.5 });
  }

  eStart = performance.now();
  eY0 = yaw;
  eP0 = pitch;
  eD0 = dist;

  const dest = currentDest.value;
  const targetYaw = -((dest.lon * Math.PI) / 180);
  const targetPitch = (dest.lat * Math.PI) / 180;
  const dy = targetYaw - eY0;

  eDY = Math.atan2(Math.sin(dy), Math.cos(dy));
  eDP = targetPitch - eP0;
  vy = 0;
  vp = 0;
}

function skipImmediately() {
  isEntering.value = true;
  isLeaving.value = true;
  setTimeout(finish, 80);
}

function finish() {
  cleanup();
  store.closeLanding();
}

function cleanup() {
  if (gone) return;
  gone = true;
  if (raf) cancelAnimationFrame(raf);
  if (gl) {
    try {
      gl.deleteTexture(R.tex);
      [R.vb, R.ib, R.sb, R.qb].forEach((b) => gl.deleteBuffer(b));
      [R.pm, R.ps, R.pg].forEach((p) => gl.deleteProgram(p));
      const x = gl.getExtension('WEBGL_lose_context');
      if (x) x.loseContext();
    } catch {
      /* ignore */
    }
  }
}

// Pointer & interaction handlers
const ptr = new Map();
let down = null;
let pinch0 = 0;

function onPointerDown(e) {
  if (isEntering.value) return;
  const cv = canvasRef.value;
  if (cv) cv.setPointerCapture(e.pointerId);
  ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (ptr.size === 1) {
    down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
    dragging = true;
    vy = vp = 0;
    if (cv) cv.style.cursor = 'grabbing';
  } else {
    if (down) down.moved = 99;
    const [a, b] = [...ptr.values()];
    pinch0 = Math.hypot(a.x - b.x, a.y - b.y);
  }
  lastInter = performance.now();
}

function onPointerMove(e) {
  const cv = canvasRef.value;
  if (!ptr.has(e.pointerId)) {
    if (!isEntering.value && cv) cv.style.cursor = hit(e.clientX, e.clientY) ? 'pointer' : 'grab';
    return;
  }
  const p = ptr.get(e.pointerId);
  const dx = e.clientX - p.x;
  const dy = e.clientY - p.y;
  p.x = e.clientX;
  p.y = e.clientY;
  lastInter = performance.now();

  if (ptr.size === 2) {
    const [a, b] = [...ptr.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinch0 > 0 && d > 0) tDist = clamp((tDist * pinch0) / d, dBase * 0.62, dBase * 1.7);
    pinch0 = d;
    return;
  }

  if (down) down.moved += Math.abs(dx) + Math.abs(dy);
  const r = radiusPx();
  const dt = 0.016;
  yaw += dx / r;
  pitch = clamp(pitch + dy / r, -1.25, 1.25);
  vy = 0.7 * vy + 0.3 * (dx / r) / dt;
  vp = 0.7 * vp + 0.3 * (dy / r) / dt;
  vy = clamp(vy, -2.5, 2.5);
  vp = clamp(vp, -2.5, 2.5);
}

function onPointerUp(e) {
  const cv = canvasRef.value;
  const was = ptr.size;
  ptr.delete(e.pointerId);
  lastInter = performance.now();

  if (ptr.size === 0) {
    dragging = false;
    if (cv) cv.style.cursor = 'grab';
    if (down && was === 1 && down.moved < 8 && performance.now() - down.t < 700 && hit(e.clientX, e.clientY)) {
      enterMission();
    }
    down = null;
  }
}

function onWheel(e) {
  e.preventDefault();
  if (isEntering.value) return;
  tDist = clamp(tDist * Math.exp(e.deltaY * 0.0012), dBase * 0.62, dBase * 1.7);
  lastInter = performance.now();
}

function onKeyDown(e) {
  if (isEntering.value) return;
  const k = e.key;
  if (k === 'Enter' || k === ' ') {
    e.preventDefault();
    enterMission();
  } else if (k === 'Escape') {
    skipImmediately();
  } else if (k === 'ArrowLeft') {
    vy = -0.9;
    lastInter = performance.now();
    e.preventDefault();
  } else if (k === 'ArrowRight') {
    vy = 0.9;
    lastInter = performance.now();
    e.preventDefault();
  } else if (k === 'ArrowUp') {
    vp = -0.9;
    lastInter = performance.now();
    e.preventDefault();
  } else if (k === 'ArrowDown') {
    vp = 0.9;
    lastInter = performance.now();
    e.preventDefault();
  } else if (k === '+' || k === '=') {
    tDist = clamp(tDist * 0.88, dBase * 0.62, dBase * 1.7);
  } else if (k === '-' || k === '_') {
    tDist = clamp(tDist / 0.88, dBase * 0.62, dBase * 1.7);
  }
}

onMounted(() => {
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', onKeyDown);

  try {
    initGL();
    resize();
  } catch (err) {
    console.warn('WebGL init fallback:', err);
    isFallback.value = true;
    isReady.value = true;
    return;
  }

  const img = new Image();
  img.onload = () => {
    try {
      uploadTex(img);
    } catch (e) {
      console.warn('Tex upload warning:', e);
    }
    isReady.value = true;
    lastTime = performance.now();
    raf = requestAnimationFrame(frame);
  };
  img.onerror = () => {
    console.warn('Mars texture load failed; continuing with fallback shader');
    isReady.value = true;
    lastTime = performance.now();
    raf = requestAnimationFrame(frame);
  };
  img.src = '/mars-data/mars_2k.jpg';
});

onUnmounted(() => {
  window.removeEventListener('resize', resize);
  window.removeEventListener('keydown', onKeyDown);
  cleanup();
});
</script>

<template>
  <section
    id="landing-hero"
    :class="{ entering: isEntering, leaving: isLeaving }"
    role="region"
    aria-label="Mars Pathfinder Planetary Exploration Landing"
  >
    <!-- WebGL Canvas for interactive 3D Mars globe -->
    <canvas
      v-if="!isFallback"
      ref="canvasRef"
      id="mars-landing-canvas"
      :class="{ ready: isReady }"
      tabindex="0"
      role="button"
      aria-label="Interactive 3D globe of Mars. Click or press Enter to initiate mission descent. Drag to rotate, scroll to zoom."
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @wheel="onWheel"
    ></canvas>

    <!-- Fallback Planet for non-WebGL devices -->
    <div v-else class="landing-fallback">
      <div class="fallback-planet" aria-hidden="true"></div>
      <p>3D WebGL acceleration is unavailable. The mission console remains fully operational.</p>
    </div>

    <!-- Vignette & Atmospheric Scrim -->
    <div class="landing-vignette" aria-hidden="true"></div>
    <div class="landing-scrim" aria-hidden="true"></div>

    <!-- HUD Telemetry Overlay -->
    <div id="landing-hud" :class="{ 'hud-hidden': isEntering }">
      <!-- Top HUD Header -->
      <div class="hud-top">
        <div class="hud-brand">
          <div class="hud-title-row">
            <svg viewBox="0 0 100 80" class="hud-meatball">
              <circle cx="48" cy="40" r="34" fill="#0b3d91"/>
              <circle cx="34" cy="28" r="1.2" fill="#fff"/>
              <circle cx="56" cy="26" r="1.4" fill="#fff"/>
              <circle cx="62" cy="38" r="1.2" fill="#fff"/>
              <path d="M22 62 L48 18 L60 44 L44 48 L76 56" fill="none" stroke="#fc3d21" stroke-width="5" stroke-linejoin="round"/>
              <ellipse cx="48" cy="40" rx="42" ry="14" fill="none" stroke="#ffffff" stroke-width="2.2" transform="rotate(-28 48 40)"/>
              <text x="48" y="47" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="20" fill="#ffffff" text-anchor="middle">NASA</text>
            </svg>
            <div class="hud-brand-text">
              <span class="hud-main-title">MARS PATHFINDER</span>
              <span class="hud-subtitle">PLANETARY EXPLORATION &amp; TRAVERSAL SYSTEM</span>
            </div>
          </div>
        </div>

        <div class="hud-status-badge">
          <span class="pulse-dot" aria-hidden="true"></span>
          <span class="status-label">MISSION STATUS: ORBITAL STANDBY</span>
        </div>
      </div>

      <!-- Mid-Right: Live Orbital Flight Dynamics Card -->
      <div class="hud-telemetry-panel">
        <div class="telem-header">ORBITAL FLIGHT DYNAMICS</div>
        <div class="telem-row">
          <span class="telem-label">SOL COUNTER</span>
          <span class="telem-val">SOL 75 &bull; NOMINAL</span>
        </div>
        <div class="telem-row">
          <span class="telem-label">APPROACH TARGET</span>
          <span class="telem-val highlight">{{ currentDest.name }}</span>
        </div>
        <div class="telem-row">
          <span class="telem-label">COORDINATES</span>
          <span class="telem-val">{{ currentDest.lat > 0 ? currentDest.lat + '°N' : Math.abs(currentDest.lat) + '°S' }}, {{ currentDest.lon > 0 ? currentDest.lon + '°E' : Math.abs(currentDest.lon) + '°W' }}</span>
        </div>
        <div class="telem-row">
          <span class="telem-label">DESCENT VELOCITY</span>
          <span class="telem-val">5.62 KM/S</span>
        </div>
        <div class="telem-row">
          <span class="telem-label">ENTRY TRAJECTORY</span>
          <span class="telem-val">&gamma; = &minus;12.5&deg;</span>
        </div>
      </div>

      <!-- Bottom HUD Action Bar -->
      <div class="hud-bottom">
        <!-- Bottom Left Telemetry -->
        <div class="hud-bottom-left">
          <div class="bl-line"><span class="bl-tag">TARGET:</span> MARS (IAU 2015:49900)</div>
          <div class="bl-line"><span class="bl-tag">SYSTEM:</span> SOL / INNER SYSTEM</div>
          <div class="bl-line"><span class="bl-tag">DATUM:</span> MOLA TOPOGRAPHIC 0M</div>
        </div>

        <!-- Center: Interactive Destination Selector & Enter Button -->
        <div class="hud-center">
          <!-- Multi-Destination Quick Selector -->
          <div class="destination-pills-wrap">
            <span class="pills-title">EXPLORATION TARGET:</span>
            <div class="destination-pills">
              <button
                v-for="d in destinations"
                :key="d.id"
                class="dest-pill"
                :class="{ active: activeDestId === d.id }"
                @click.stop="selectDestination(d.id)"
                :title="d.subtitle"
              >
                {{ d.name }}
              </button>
            </div>
          </div>

          <div class="initiate-prompt">CLICK PLANET OR PRESS ENTER TO INITIATE DESCENT</div>

          <button
            id="l-enter-btn"
            class="enter-mission-btn"
            :disabled="!isReady"
            @click="enterMission"
          >
            ENTER MISSION
          </button>

          <div class="hud-attribution">
            NASA MRO Context Camera &bull; Caltech Murray Lab Global CTX Mosaic &bull; Solar System Scope
          </div>
        </div>

        <!-- Bottom Right Helper -->
        <div class="hud-bottom-right">
          <div class="control-hint">DRAG TO ROTATE GLOBE</div>
          <div class="control-hint">SCROLL TO ZOOM ALTITUDE</div>
          <button class="skip-btn" @click="skipImmediately" title="Skip directly to Mission Control">
            FAST ENTRY &rarr;
          </button>
        </div>
      </div>
    </div>

    <!-- Initializing Loading Screen -->
    <div v-if="!isReady" id="landing-loader" class="landing-loader">
      <div class="loader-spinner" aria-hidden="true"></div>
      <div class="loader-text">INITIALIZING PLANETARY MISSION DATA</div>
      <div class="loader-progress-bar" aria-hidden="true"><i></i></div>
    </div>
  </section>
</template>

<style scoped>
#landing-hero {
  position: fixed;
  inset: 0;
  z-index: 999999;
  background: #030407;
  color: #f1f3f8;
  opacity: 1;
  transition: opacity 0.85s ease;
  overflow: hidden;
  font-family: ui-monospace, 'JetBrains Mono', SFMono-Regular, Menlo, monospace;
}

#landing-hero.leaving {
  opacity: 0;
  pointer-events: none;
}

#mars-landing-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  opacity: 0;
  transition: opacity 1.2s ease;
  outline: none;
  touch-action: none;
  cursor: grab;
  -webkit-tap-highlight-color: transparent;
}

#mars-landing-canvas.ready {
  opacity: 1;
}

#mars-landing-canvas:focus-visible {
  box-shadow: inset 0 0 0 2px #ff6b35;
}

.landing-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% 47%, rgba(0, 0, 0, 0) 36%, rgba(0, 0, 0, 0.65) 100%);
}

.landing-scrim {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 38%;
  pointer-events: none;
  background: linear-gradient(to top, rgba(3, 4, 7, 0.88), rgba(3, 4, 7, 0));
}

#landing-hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  padding: max(20px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: opacity 0.45s ease;
}

#landing-hud.hud-hidden {
  opacity: 0;
}

/* Header */
.hud-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.hud-brand-text {
  display: flex;
  flex-direction: column;
}

.hud-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hud-meatball {
  width: 44px;
  height: 35px;
  filter: drop-shadow(0 0 8px rgba(11, 61, 145, 0.45));
}

.hud-main-title {
  font-size: clamp(16px, 2.2vw, 24px);
  letter-spacing: 0.22em;
  font-weight: 800;
  color: #ffffff;
}

.hud-subtitle {
  margin-top: 3px;
  font-size: clamp(9px, 1.1vw, 11px);
  letter-spacing: 0.18em;
  color: #94a3b8;
}

.hud-status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(255, 107, 53, 0.35);
  border-radius: 6px;
  padding: 6px 14px;
  font-size: clamp(10px, 1.2vw, 12px);
  letter-spacing: 0.16em;
  color: #f8fafc;
  backdrop-filter: blur(8px);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff6b35;
  box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.28);
  animation: pulse-ring 2.4s ease-in-out infinite;
}

@keyframes pulse-ring {
  50% {
    box-shadow: 0 0 0 7px rgba(255, 107, 53, 0);
  }
}

/* Mid-Right Telemetry Card */
.hud-telemetry-panel {
  position: absolute;
  right: 24px;
  top: 90px;
  width: 280px;
  background: rgba(13, 20, 36, 0.78);
  border: 1px solid rgba(56, 189, 248, 0.28);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
}

.telem-header {
  font-size: 10.5px;
  letter-spacing: 0.18em;
  color: var(--neo-cyan, #00d2ff);
  border-bottom: 1px solid rgba(56, 189, 248, 0.2);
  padding-bottom: 6px;
  font-weight: 700;
}

.telem-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}

.telem-label {
  color: #94a3b8;
  letter-spacing: 0.1em;
}

.telem-val {
  color: #f1f5f9;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-align: right;
}

.telem-val.highlight {
  color: #ff6b35;
}

/* Bottom Bar */
.hud-bottom {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: end;
  gap: 16px;
}

.hud-bottom-left {
  font-size: clamp(10px, 1.2vw, 11.5px);
  letter-spacing: 0.14em;
  color: #cbd5e1;
  line-height: 1.8;
}

.bl-tag {
  color: #ff6b35;
  font-weight: 700;
}

.hud-center {
  text-align: center;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

/* Destination Pills */
.destination-pills-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.pills-title {
  font-size: 10px;
  letter-spacing: 0.2em;
  color: #94a3b8;
}

.destination-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 600px;
}

.dest-pill {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  padding: 5px 11px;
  color: #cbd5e1;
  font-family: inherit;
  font-size: 11px;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dest-pill:hover {
  border-color: #00d2ff;
  color: #00d2ff;
  background: rgba(0, 210, 255, 0.12);
}

.dest-pill.active {
  border-color: #ff6b35;
  color: #ffffff;
  background: rgba(255, 107, 53, 0.25);
  box-shadow: 0 0 12px rgba(255, 107, 53, 0.35);
  font-weight: 700;
}

.initiate-prompt {
  font-size: clamp(10.5px, 1.2vw, 12px);
  letter-spacing: 0.24em;
  color: #f1f5f9;
  animation: prompt-fade 2.8s ease-in-out infinite;
}

@keyframes prompt-fade {
  50% {
    opacity: 0.45;
  }
}

.enter-mission-btn {
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.26em;
  color: #ffffff;
  background: rgba(255, 107, 53, 0.18);
  border: 1.5px solid #ff6b35;
  border-radius: 3px;
  padding: 13px 32px;
  cursor: pointer;
  box-shadow: 0 0 18px rgba(255, 107, 53, 0.3);
  transition: all 0.25s ease;
}

.enter-mission-btn:hover:not(:disabled) {
  background: rgba(255, 107, 53, 0.45);
  box-shadow: 0 0 30px rgba(255, 107, 53, 0.65);
  transform: translateY(-1px);
}

.enter-mission-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.hud-attribution {
  font-size: 9px;
  letter-spacing: 0.08em;
  color: #64748b;
  max-width: 440px;
  line-height: 1.4;
}

.hud-bottom-right {
  text-align: right;
  font-size: clamp(10px, 1.2vw, 11px);
  letter-spacing: 0.14em;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.control-hint {
  line-height: 1.4;
}

.skip-btn {
  margin-top: 4px;
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #e2e8f0;
  border-radius: 4px;
  padding: 4px 10px;
  font-family: inherit;
  font-size: 10px;
  letter-spacing: 0.12em;
  cursor: pointer;
  transition: all 0.2s;
}

.skip-btn:hover {
  background: rgba(0, 210, 255, 0.2);
  border-color: #00d2ff;
  color: #00d2ff;
}

/* Fallback & Loading */
.landing-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  text-align: center;
  padding: 24px;
}

.fallback-planet {
  width: min(50vw, 320px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle at 32% 30%, #e98a5c 0%, #b9532f 38%, #5a2314 72%, #1a0a06 100%);
  box-shadow: 0 0 60px rgba(255, 107, 53, 0.3);
}

.landing-loader {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #030407;
  font-size: 12px;
  letter-spacing: 0.26em;
  color: #94a3b8;
  z-index: 3;
}

.loader-spinner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(255, 107, 53, 0.2);
  border-top-color: #ff6b35;
  animation: lspin 1s linear infinite;
}

@keyframes lspin {
  to {
    transform: rotate(360deg);
  }
}

.loader-progress-bar {
  width: 200px;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.loader-progress-bar i {
  display: block;
  width: 40%;
  height: 100%;
  background: #ff6b35;
  animation: lbar 1.4s ease-in-out infinite;
}

@keyframes lbar {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(260%);
  }
}

@media (max-width: 900px) {
  .hud-telemetry-panel {
    display: none;
  }
  .hud-bottom {
    grid-template-columns: 1fr;
    row-gap: 14px;
  }
  .hud-bottom-left, .hud-bottom-right {
    text-align: center;
    align-items: center;
  }
}
</style>
