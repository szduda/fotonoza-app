/** WebGL1 fragment shader: graded preview + optional focus peaking + highlight clip overlay. */
export const GPU_PREVIEW_FRAG_SRC = `
precision highp float;
uniform sampler2D u_tex;
uniform vec4 u_basic0;
uniform vec4 u_basic1;
uniform vec4 u_sh;
uniform vec2 u_texel;
uniform float u_focusPeaking;
uniform float u_highlightClip;
varying vec2 v_uv;

float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

float smoothx(float a, float b, float x) {
  float t = clamp((x - a) / (b - a), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

float rawL(vec2 uv) {
  vec2 uvn = clamp(uv, vec2(1e-4), vec2(1.0) - vec2(1e-4));
  return lum(texture2D(u_tex, uvn).rgb);
}

float lap5(vec2 uv, vec2 d) {
  float l0 = rawL(uv);
  return abs(
    4.0 * l0 -
    rawL(uv + vec2(d.x, 0.0)) - rawL(uv - vec2(d.x, 0.0)) -
    rawL(uv + vec2(0.0, d.y)) - rawL(uv - vec2(0.0, d.y))
  );
}

float sharpness(vec2 uv, vec2 d) {
  return lap5(uv, d) / max(rawL(uv) + 0.065, 0.001);
}

void main() {
  vec4 src = texture2D(u_tex, v_uv);
  float exposure = u_basic0.x;
  float contrast = u_basic0.y;
  float contrastBalance = u_basic0.z;
  float clarity = u_basic0.w;
  float vibrance = u_basic1.x;
  float saturation = u_basic1.y;
  float temperature = u_basic1.z;
  float tint = u_basic1.w;
  float shadows = u_sh.x;
  float darks = u_sh.y;
  float lights = u_sh.z;
  float highlightsAdj = u_sh.w;

  vec3 c = src.rgb * exp2(exposure);
  float y = lum(c);
  float pivot = clamp(0.5 + contrastBalance * 0.25, 0.2, 0.8);
  c = (c - vec3(pivot)) * contrast + vec3(pivot);

  float shw = smoothx(0.0, 0.45, 1.0 - y);
  float drk = smoothx(0.15, 0.6, 1.0 - y);
  float lgt = smoothx(0.4, 0.85, y);
  float hlt = smoothx(0.65, 1.0, y);
  float tonemap = shadows * 0.25 * shw + darks * 0.2 * drk + lights * 0.2 * lgt + highlightsAdj * 0.25 * hlt;
  c += vec3(tonemap);

  y = lum(c);
  float micro = (c.r + c.g + c.b - 3.0 * y) / 3.0;
  c += vec3(micro * clarity * 0.7);

  float tr = 1.0 + temperature * 0.15 + tint * 0.05;
  float tg = 1.0 - tint * 0.12;
  float tb = 1.0 - temperature * 0.15 + tint * 0.05;
  c *= vec3(tr, tg, tb);

  float mx = max(c.r, max(c.g, c.b));
  float mn = min(c.r, min(c.g, c.b));
  float chroma = clamp(mx - mn, 0.0, 1.0);
  float vibT = pow(clamp(1.0 - chroma, 0.0, 1.0), 1.35);
  float satGain = saturation + vibrance * vibT;
  c = mix(vec3(y), c, satGain);

  vec3 fc = clamp(c, 0.0, 1.0);
  float mxh = max(fc.r, max(fc.g, fc.b));
  fc = mix(fc, vec3(1.0, 0.02, 0.02),
    smoothstep(0.93, 0.99996, mxh) * clamp(u_highlightClip, 0.0, 1.0));

  vec2 duv = max(u_texel * 5.25, vec2(1.0 / 6144.0));
  vec2 duvN = duv * vec2(1.9, 1.9);
  float rel0 = sharpness(v_uv, duv);
  float nh = max(
    max(sharpness(v_uv + vec2(duvN.x, 0.0), duv), sharpness(v_uv - vec2(duvN.x, 0.0), duv)),
    max(sharpness(v_uv + vec2(0.0, duvN.y), duv), sharpness(v_uv - vec2(0.0, duvN.y), duv))
  );
  float nhE = max(nh, 0.0006);
  float prominence = smoothstep(nhE * 1.05, nhE * 1.18, rel0);
  float elite = smoothstep(0.38, 0.72, rel0) * prominence;
  elite = elite * elite * elite;

  vec2 pq = floor(gl_FragCoord.xy * (1.0 / 6.75));
  float spr = fract(sin(dot(vec2(pq.x, pq.y), vec2(127.109, 311.743))) * 43758.5453123);
  float spark = smoothstep(0.91, 0.965, spr);
  float pk = clamp(u_focusPeaking, 0.0, 1.0) * spark * elite;
  fc = mix(fc, vec3(1.0, 0.0, 0.0), clamp(pk * 0.95, 0.0, 1.0));

  gl_FragColor = vec4(fc, src.a);
}
`
