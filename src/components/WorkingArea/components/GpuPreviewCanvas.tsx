import { useEffect, useMemo, useRef, type ReactElement } from "react"
import { publishLiveHistogram } from "@/lib/liveHistogram"
import type { BasicEffectsState, ShadowsHighlightsState } from "@/types/domain"

type Size = { width: number; height: number }
type Pan = { x: number; y: number }

type Props = {
  photoId: string
  src: string
  alt: string
  rendered: Size
  pan: Pan
  effects: BasicEffectsState
  sh: ShadowsHighlightsState
  onImageNatural: (size: Size) => void
  onImageError: () => void
}

const VERT_SRC = `
attribute vec2 a_pos;
attribute vec2 a_uv;
varying vec2 v_uv;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
  v_uv = a_uv;
}
`

const FRAG_SRC = `
precision highp float;
uniform sampler2D u_tex;
uniform vec4 u_basic0;
uniform vec4 u_basic1;
uniform vec4 u_sh;
varying vec2 v_uv;
float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
float smoothx(float a, float b, float x) {
  float t = clamp((x - a) / (b - a), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}
void main() {
  vec4 src = texture2D(u_tex, v_uv);
  float exposure = u_basic0.x;
  float contrast = u_basic0.y;
  float contrastBalance = u_basic0.z;
  float clarity = u_basic0.w;
  float vibrance = u_basic1.x;
  float saturation = u_basic1.y;
  float shadows = u_sh.x;
  float darks = u_sh.y;
  float lights = u_sh.z;
  float highlights = u_sh.w;

  vec3 c = src.rgb * exp2(exposure);
  float y = lum(c);
  float pivot = clamp(0.5 + contrastBalance * 0.25, 0.2, 0.8);
  c = (c - vec3(pivot)) * contrast + vec3(pivot);

  float shw = smoothx(0.0, 0.45, 1.0 - y);
  float drk = smoothx(0.15, 0.6, 1.0 - y);
  float lgt = smoothx(0.4, 0.85, y);
  float hlt = smoothx(0.65, 1.0, y);
  float tonemap = shadows * 0.25 * shw + darks * 0.2 * drk + lights * 0.2 * lgt + highlights * 0.25 * hlt;
  c += vec3(tonemap);

  y = lum(c);
  float micro = (c.r + c.g + c.b - 3.0 * y) / 3.0;
  c += vec3(micro * clarity * 0.7);

  float mx = max(c.r, max(c.g, c.b));
  float mn = min(c.r, min(c.g, c.b));
  float chroma = clamp(mx - mn, 0.0, 1.0);
  float vibT = pow(clamp(1.0 - chroma, 0.0, 1.0), 1.35);
  float satGain = saturation + vibrance * vibT;
  c = mix(vec3(y), c, satGain);

  gl_FragColor = vec4(clamp(c, 0.0, 1.0), src.a);
}
`

export const GpuPreviewCanvas = ({
  photoId,
  src,
  alt,
  rendered,
  pan,
  effects,
  sh,
  onImageNatural,
  onImageError,
}: Props): ReactElement => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const progRef = useRef<WebGLProgram | null>(null)
  const texRef = useRef<WebGLTexture | null>(null)
  const uBasic0Ref = useRef<WebGLUniformLocation | null>(null)
  const uBasic1Ref = useRef<WebGLUniformLocation | null>(null)
  const uShRef = useRef<WebGLUniformLocation | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const lastHistMsRef = useRef(0)

  const uniforms = useMemo(
    () => ({
      basic0: new Float32Array([
        effects.exposure,
        effects.contrast,
        effects.contrastBalance,
        effects.clarity,
      ]),
      basic1: new Float32Array([effects.vibrance, effects.saturation, 0, 0]),
      sh: new Float32Array([sh.shadows, sh.darks, sh.lights, sh.highlights]),
    }),
    [
      effects.exposure,
      effects.contrast,
      effects.contrastBalance,
      effects.clarity,
      effects.vibrance,
      effects.saturation,
      sh.shadows,
      sh.darks,
      sh.lights,
      sh.highlights,
    ],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false })
    if (!gl) return
    const prog = initProgram(gl)
    if (!prog) return
    const tex = gl.createTexture()
    if (!tex) return

    glRef.current = gl
    progRef.current = prog
    texRef.current = tex
    uBasic0Ref.current = gl.getUniformLocation(prog, "u_basic0")
    uBasic1Ref.current = gl.getUniformLocation(prog, "u_basic1")
    uShRef.current = gl.getUniformLocation(prog, "u_sh")

    gl.useProgram(prog)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    return () => {
      if (progRef.current) gl.deleteProgram(progRef.current)
      if (texRef.current) gl.deleteTexture(texRef.current)
      progRef.current = null
      texRef.current = null
      glRef.current = null
    }
  }, [])

  useEffect(() => {
    const img = new Image()
    imageRef.current = img
    img.decoding = "async"
    img.crossOrigin = "anonymous"
    img.onload = () => {
      if (imageRef.current !== img) return
      onImageNatural({ width: img.naturalWidth, height: img.naturalHeight })
      draw()
    }
    img.onerror = () => {
      if (imageRef.current !== img) return
      onImageError()
    }
    img.src = src
    return () => {
      if (imageRef.current === img) imageRef.current = null
    }
  }, [src, onImageError, onImageNatural])

  useEffect(() => {
    draw()
  }, [uniforms, rendered.width, rendered.height, src, photoId])

  const style = {
    width: rendered.width,
    height: rendered.height,
    transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
  }

  return (
    <canvas
      ref={canvasRef}
      aria-label={alt}
      className="pointer-events-none absolute left-1/2 top-1/2 max-h-none max-w-none select-none"
      style={style}
    />
  )

  function draw(): void {
    const gl = glRef.current
    const prog = progRef.current
    const tex = texRef.current
    const img = imageRef.current
    const canvas = canvasRef.current
    if (!gl || !prog || !tex || !img || !canvas) return
    const w = Math.max(1, Math.round(rendered.width))
    const h = Math.max(1, Math.round(rendered.height))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.useProgram(prog)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    if (uBasic0Ref.current) gl.uniform4fv(uBasic0Ref.current, uniforms.basic0)
    if (uBasic1Ref.current) gl.uniform4fv(uBasic1Ref.current, uniforms.basic1)
    if (uShRef.current) gl.uniform4fv(uShRef.current, uniforms.sh)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    publishHistogramFromFrame(gl, canvas.width, canvas.height, photoId, lastHistMsRef)
  }
}

const HIST_MIN_INTERVAL_MS = 100
const HIST_TARGET_SAMPLES = 65_536

const publishHistogramFromFrame = (
  gl: WebGLRenderingContext,
  width: number,
  height: number,
  photoId: string,
  lastHistMsRef: { current: number },
): void => {
  const now = performance.now()
  if (now - lastHistMsRef.current < HIST_MIN_INTERVAL_MS) return
  lastHistMsRef.current = now

  const pixelCount = Math.max(1, width * height)
  const stride = Math.max(1, Math.floor(Math.sqrt(pixelCount / HIST_TARGET_SAMPLES)))
  const packed = new Uint8Array(width * height * 4)
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, packed)

  const red = new Array<number>(256).fill(0)
  const green = new Array<number>(256).fill(0)
  const blue = new Array<number>(256).fill(0)
  const luma = new Array<number>(256).fill(0)
  const rowStride = width * 4

  for (let y = 0; y < height; y += stride) {
    const rowOffset = y * rowStride
    for (let x = 0; x < width; x += stride) {
      const idx = rowOffset + x * 4
      const r = packed[idx]
      const g = packed[idx + 1]
      const b = packed[idx + 2]
      red[r] += 1
      green[g] += 1
      blue[b] += 1
      const yVal = Math.min(255, Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b))
      luma[yVal] += 1
    }
  }

  publishLiveHistogram(photoId, { red, green, blue, luma })
}

function initProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC)
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC)
  if (!vs || !fs) return null
  const prog = gl.createProgram()
  if (!prog) return null
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    gl.deleteProgram(prog)
    return null
  }

  const quad = gl.createBuffer()
  if (!quad) return null
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0,
    ]),
    gl.STATIC_DRAW,
  )
  const aPos = gl.getAttribLocation(prog, "a_pos")
  const aUv = gl.getAttribLocation(prog, "a_uv")
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0)
  gl.enableVertexAttribArray(aUv)
  gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8)
  return prog
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

