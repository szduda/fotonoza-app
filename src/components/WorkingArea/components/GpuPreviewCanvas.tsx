import { useEffect, useMemo, useRef, type ReactElement } from "react"
import type { BasicEffectsState } from "@/types/domain"

type Size = { width: number; height: number }
type Pan = { x: number; y: number }

type Props = {
  src: string
  alt: string
  rendered: Size
  pan: Pan
  effects: BasicEffectsState
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
uniform mat4 u_mtx;
varying vec2 v_uv;
void main() {
  vec4 src = texture2D(u_tex, v_uv);
  vec3 out_rgb = (u_mtx * vec4(src.rgb, 1.0)).rgb;
  gl_FragColor = vec4(clamp(out_rgb, 0.0, 1.0), src.a);
}
`

export const GpuPreviewCanvas = ({
  src,
  alt,
  rendered,
  pan,
  effects,
  onImageNatural,
  onImageError,
}: Props): ReactElement => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const progRef = useRef<WebGLProgram | null>(null)
  const texRef = useRef<WebGLTexture | null>(null)
  const uMtxRef = useRef<WebGLUniformLocation | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const matrix = useMemo(
    () => buildColorMatrix(effects.exposure, effects.contrast, effects.saturation),
    [effects.exposure, effects.contrast, effects.saturation],
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
    uMtxRef.current = gl.getUniformLocation(prog, "u_mtx")

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
  }, [matrix, rendered.width, rendered.height, src])

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
    if (uMtxRef.current) gl.uniformMatrix4fv(uMtxRef.current, false, matrix)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
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

function buildColorMatrix(exposure: number, contrast: number, saturation: number): Float32Array {
  const evMul = 2 ** exposure
  const sat = saturation
  const sr = 0.2126
  const sg = 0.7152
  const sb = 0.0722

  const satM = [
    sr + (1 - sr) * sat,
    sg - sg * sat,
    sb - sb * sat,
    0,
    sr - sr * sat,
    sg + (1 - sg) * sat,
    sb - sb * sat,
    0,
    sr - sr * sat,
    sg - sg * sat,
    sb + (1 - sb) * sat,
    0,
  ]

  const c = contrast
  const t = 0.5 * (1 - c)

  return new Float32Array([
    satM[0] * c * evMul,
    satM[4] * c * evMul,
    satM[8] * c * evMul,
    0,
    satM[1] * c * evMul,
    satM[5] * c * evMul,
    satM[9] * c * evMul,
    0,
    satM[2] * c * evMul,
    satM[6] * c * evMul,
    satM[10] * c * evMul,
    0,
    t,
    t,
    t,
    1,
  ])
}
