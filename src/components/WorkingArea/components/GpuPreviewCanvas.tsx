import { readFile } from "@tauri-apps/plugin-fs"
import { isTauri } from "@tauri-apps/api/core"
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactElement } from "react"
import { hasLiveHistogramSubscribers, publishHistogramFromFrame } from "@/lib/liveHistogram"
import type { BasicEffectsState, ColorEffectsState, ShadowsHighlightsState } from "@/types/domain"
import { GPU_PREVIEW_FRAG_SRC } from "./gpuPreviewFragSrc"

type Size = { width: number; height: number }
type Pan = { x: number; y: number }

type Props = {
  photoId: string
  /** Asset URL for fetch fallback. */
  src: string
  /** Absolute file path — in Tauri we read bytes here first (fetch(asset) is unreliable for raw previews). */
  diskSourcePath?: string
  alt: string
  rendered: Size
  pan: Pan
  basicEffects: BasicEffectsState
  colorEffects: ColorEffectsState
  sh: ShadowsHighlightsState
  /** Laplacian map as sparse red dots (source texture luminance). */
  focusPeaking?: boolean
  /** Tint clipped highlights magenta-red on graded RGB. */
  highlightClipping?: boolean
  onImageNatural: (size: Size) => void
  onImageError: () => void
  className?: string
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

export const GpuPreviewCanvas = ({
  photoId,
  src,
  diskSourcePath,
  alt,
  rendered,
  pan,
  basicEffects,
  colorEffects,
  sh,
  focusPeaking = false,
  highlightClipping = false,
  onImageNatural,
  onImageError,
  className,
}: Props): ReactElement => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const progRef = useRef<WebGLProgram | null>(null)
  const texRef = useRef<WebGLTexture | null>(null)
  const uBasic0Ref = useRef<WebGLUniformLocation | null>(null)
  const uBasic1Ref = useRef<WebGLUniformLocation | null>(null)
  const uShRef = useRef<WebGLUniformLocation | null>(null)
  const uTexelRef = useRef<WebGLUniformLocation | null>(null)
  const uFocusPeakingRef = useRef<WebGLUniformLocation | null>(null)
  const uHighlightClipRef = useRef<WebGLUniformLocation | null>(null)
  /** Decoded via fetch+blob so WebGL texImage2D is allowed (asset URLs taint HTMLImageElement on WebKit). */
  const bitmapRef = useRef<ImageBitmap | null>(null)
  const onImageNaturalRef = useRef(onImageNatural)
  const onImageErrorRef = useRef(onImageError)
  const needsTexUploadRef = useRef(true)
  const histDirtyRef = useRef(true)
  const histBufferRef = useRef<Uint8Array | null>(null)
  /** Bumps when a new bitmap is decoded so draw runs even if `rendered` dimensions match the previous image (same `src`, new file). */
  const [texEpoch, setTexEpoch] = useState(0)

  useEffect(() => {
    onImageNaturalRef.current = onImageNatural
  }, [onImageNatural])

  useEffect(() => {
    onImageErrorRef.current = onImageError
  }, [onImageError])

  const uniforms = useMemo(
    () => ({
      basic0: new Float32Array([
        basicEffects.exposure,
        basicEffects.contrast,
        basicEffects.contrastBalance,
        basicEffects.clarity,
      ]),
      basic1: new Float32Array([
        colorEffects.vibrance,
        colorEffects.saturation,
        colorEffects.temperature,
        colorEffects.tint,
      ]),
      sh: new Float32Array([sh.shadows, sh.darks, sh.lights, sh.highlights]),
    }),
    [
      basicEffects.exposure,
      basicEffects.contrast,
      basicEffects.contrastBalance,
      basicEffects.clarity,
      colorEffects.vibrance,
      colorEffects.saturation,
      colorEffects.temperature,
      colorEffects.tint,
      sh.shadows,
      sh.darks,
      sh.lights,
      sh.highlights,
    ],
  )

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext("webgl", {
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    })
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
    uTexelRef.current = gl.getUniformLocation(prog, "u_texel")
    uFocusPeakingRef.current = gl.getUniformLocation(prog, "u_focusPeaking")
    uHighlightClipRef.current = gl.getUniformLocation(prog, "u_highlightClip")

    gl.useProgram(prog)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    draw()

    return () => {
      if (progRef.current) gl.deleteProgram(progRef.current)
      if (texRef.current) gl.deleteTexture(texRef.current)
      progRef.current = null
      texRef.current = null
      glRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!src && !diskSourcePath) {
      bitmapRef.current?.close()
      bitmapRef.current = null
      return
    }
    let cancelled = false
    needsTexUploadRef.current = true
    histDirtyRef.current = true

    void (async () => {
      try {
        let blob: Blob
        if (isTauri() && diskSourcePath) {
          try {
            const bytes = await readFile(diskSourcePath)
            blob = new Blob([bytes])
          } catch {
            const res = await fetch(src)
            if (!res.ok) throw new Error(`fetch ${res.status}`)
            blob = await res.blob()
          }
        } else {
          const res = await fetch(src)
          if (!res.ok) throw new Error(`fetch ${res.status}`)
          blob = await res.blob()
        }
        const bmp = await createImageBitmap(blob)
        if (cancelled) {
          bmp.close()
          return
        }
        bitmapRef.current?.close()
        bitmapRef.current = bmp
        needsTexUploadRef.current = true
        histDirtyRef.current = true
        onImageNaturalRef.current({ width: bmp.width, height: bmp.height })
        setTexEpoch((n) => n + 1)
      } catch {
        if (!cancelled) onImageErrorRef.current()
      }
    })()

    return () => {
      cancelled = true
      bitmapRef.current?.close()
      bitmapRef.current = null
    }
  }, [src, diskSourcePath])

  useLayoutEffect(() => {
    draw()
  }, [
    texEpoch,
    uniforms,
    rendered.width,
    rendered.height,
    src,
    photoId,
    focusPeaking,
    highlightClipping,
  ])

  useLayoutEffect(() => {
    histDirtyRef.current = true
    draw()
  }, [
    src,
    basicEffects.exposure,
    basicEffects.contrast,
    basicEffects.contrastBalance,
    basicEffects.clarity,
    colorEffects.vibrance,
    colorEffects.saturation,
    colorEffects.temperature,
    colorEffects.tint,
    sh.shadows,
    sh.darks,
    sh.lights,
    sh.highlights,
    photoId,
    focusPeaking,
    highlightClipping,
  ])

  const style = {
    width: rendered.width,
    height: rendered.height,
    transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
  }

  return (
    <canvas
      ref={canvasRef}
      aria-label={alt}
      className={className ?? "pointer-events-none absolute left-1/2 top-1/2 max-h-none max-w-none select-none"}
      style={style}
    />
  )

  function draw(): void {
    const gl = glRef.current
    const prog = progRef.current
    const tex = texRef.current
    const bmp = bitmapRef.current
    const canvas = canvasRef.current
    if (!gl || !prog || !tex || !bmp || !canvas) return

    const w = Math.max(1, Math.round(rendered.width))
    const h = Math.max(1, Math.round(rendered.height))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.useProgram(prog)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    if (needsTexUploadRef.current) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp)
      needsTexUploadRef.current = false
    }
    if (uBasic0Ref.current) gl.uniform4fv(uBasic0Ref.current, uniforms.basic0)
    if (uBasic1Ref.current) gl.uniform4fv(uBasic1Ref.current, uniforms.basic1)
    if (uShRef.current) gl.uniform4fv(uShRef.current, uniforms.sh)
    if (uTexelRef.current) {
      gl.uniform2f(uTexelRef.current, 1 / Math.max(bmp.width, 1), 1 / Math.max(bmp.height, 1))
    }
    if (uFocusPeakingRef.current) gl.uniform1f(uFocusPeakingRef.current, focusPeaking ? 1 : 0)
    if (uHighlightClipRef.current)
      gl.uniform1f(uHighlightClipRef.current, highlightClipping ? 1 : 0)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    if (histDirtyRef.current && hasLiveHistogramSubscribers()) {
      publishHistogramFromFrame(gl, canvas.width, canvas.height, photoId, histBufferRef)
      histDirtyRef.current = false
    }
  }
}

function initProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC)
  const fs = compile(gl, gl.FRAGMENT_SHADER, GPU_PREVIEW_FRAG_SRC)
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
    new Float32Array([-1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0]),
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
