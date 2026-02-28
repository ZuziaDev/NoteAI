import { useEffect, useRef } from 'react'

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

const drawLogo = (canvas: HTMLCanvasElement) => {
  const size = 280
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = size
  canvas.height = size

  ctx.clearRect(0, 0, size, size)

  const panelGradient = ctx.createLinearGradient(24, 24, size - 24, size - 24)
  panelGradient.addColorStop(0, '#071426')
  panelGradient.addColorStop(0.5, '#123862')
  panelGradient.addColorStop(1, '#1da7d6')

  roundRect(ctx, 16, 16, size - 32, size - 32, 56)
  ctx.fillStyle = panelGradient
  ctx.fill()

  const glow = ctx.createRadialGradient(size * 0.75, size * 0.24, 12, size * 0.75, size * 0.24, 90)
  glow.addColorStop(0, 'rgba(191, 235, 255, 0.35)')
  glow.addColorStop(1, 'rgba(191, 235, 255, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, size, size)

  ctx.strokeStyle = 'rgba(255,255,255,0.24)'
  ctx.lineWidth = 3
  roundRect(ctx, 16, 16, size - 32, size - 32, 56)
  ctx.stroke()

  ctx.fillStyle = '#e3f7ff'
  ctx.font = '700 142px "Syne", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('N', size / 2, size / 2 + 14)

  ctx.beginPath()
  ctx.lineWidth = 8
  ctx.strokeStyle = 'rgba(178, 237, 255, 0.7)'
  ctx.arc(size * 0.73, size * 0.3, size * 0.18, Math.PI * 0.28, Math.PI * 1.92)
  ctx.stroke()
}

export const LogoCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    drawLogo(canvasRef.current)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="h-28 w-28 rounded-2xl border border-white/15 bg-black/20"
      aria-label="NoteAI logo preview"
    />
  )
}
