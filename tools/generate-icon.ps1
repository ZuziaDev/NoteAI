$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$buildDir = Join-Path $root 'build'
New-Item -ItemType Directory -Path $buildDir -Force | Out-Null

$pngPath = Join-Path $buildDir 'icon.png'
$icoPath = Join-Path $buildDir 'icon.ico'

$iconSizes = @(16, 24, 32, 48, 64, 128, 256)

function New-RoundedPath {
  param(
    [float]$x,
    [float]$y,
    [float]$w,
    [float]$h,
    [float]$r
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-IconBitmap {
  param(
    [int]$size
  )

  $bitmap = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $s = [float]($size / 256.0)

  $panelPath = New-RoundedPath -x (14 * $s) -y (14 * $s) -w (228 * $s) -h (228 * $s) -r (50 * $s)
  $gradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    [System.Drawing.RectangleF]::new((14 * $s), (14 * $s), (228 * $s), (228 * $s)),
    [System.Drawing.Color]::FromArgb(255, 7, 20, 38),
    [System.Drawing.Color]::FromArgb(255, 29, 167, 214),
    45
  )
  $graphics.FillPath($gradient, $panelPath)

  $glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(80, 191, 235, 255))
  $graphics.FillEllipse($glowBrush, (136 * $s), (30 * $s), (86 * $s), (86 * $s))

  $ringPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(150, 178, 237, 255), [Math]::Max((7 * $s), 1))
  $graphics.DrawArc($ringPen, (146 * $s), (38 * $s), (74 * $s), (74 * $s), 18, 312)

  $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(75, 255, 255, 255), [Math]::Max((3 * $s), 1))
  $graphics.DrawPath($borderPen, $panelPath)

  $fontSize = [Math]::Max([float](120 * $s), 8)
  $font = New-Object System.Drawing.Font('Segoe UI Semibold', $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 227, 247, 255))
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $graphics.DrawString('N', $font, $brush, [System.Drawing.RectangleF]::new(0, (20 * $s), $size, $size - (8 * $s)), $format)

  $format.Dispose()
  $brush.Dispose()
  $font.Dispose()
  $borderPen.Dispose()
  $ringPen.Dispose()
  $glowBrush.Dispose()
  $gradient.Dispose()
  $panelPath.Dispose()
  $graphics.Dispose()

  return $bitmap
}

function New-IcoImageBytesFromBitmap {
  param(
    [System.Drawing.Bitmap]$bitmap
  )

  $size = $bitmap.Width
  $pixelStream = New-Object System.IO.MemoryStream
  $pixelWriter = New-Object System.IO.BinaryWriter($pixelStream)

  for ($y = $size - 1; $y -ge 0; $y--) {
    for ($x = 0; $x -lt $size; $x++) {
      $color = $bitmap.GetPixel($x, $y)
      $pixelWriter.Write([byte]$color.B)
      $pixelWriter.Write([byte]$color.G)
      $pixelWriter.Write([byte]$color.R)
      $pixelWriter.Write([byte]$color.A)
    }
  }
  $pixelWriter.Flush()
  $pixelBytes = $pixelStream.ToArray()
  $pixelWriter.Close()
  $pixelStream.Dispose()

  $maskStride = [int]([Math]::Ceiling($size / 32.0) * 4)
  $maskBytes = New-Object byte[] ($maskStride * $size)

  $stream = New-Object System.IO.MemoryStream
  $writer = New-Object System.IO.BinaryWriter($stream)
  $writer.Write([UInt32]40)
  $writer.Write([Int32]$size)
  $writer.Write([Int32]($size * 2))
  $writer.Write([UInt16]1)
  $writer.Write([UInt16]32)
  $writer.Write([UInt32]0)
  $writer.Write([UInt32]$pixelBytes.Length)
  $writer.Write([Int32]0)
  $writer.Write([Int32]0)
  $writer.Write([UInt32]0)
  $writer.Write([UInt32]0)
  $writer.Write($pixelBytes)
  $writer.Write($maskBytes)
  $writer.Flush()
  $imageBytes = $stream.ToArray()
  $writer.Close()
  $stream.Dispose()

  return ,([byte[]]$imageBytes)
}

$iconEntries = @()
foreach ($size in $iconSizes) {
  $bitmap = New-IconBitmap -size $size
  $imageBytes = New-IcoImageBytesFromBitmap -bitmap $bitmap
  $iconEntries += [PSCustomObject]@{
    Size  = $size
    Bytes = [byte[]]$imageBytes
  }
  $bitmap.Dispose()
}

$pngBitmap = New-IconBitmap -size 512
$pngBitmap.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
$pngBitmap.Dispose()

$fileStream = [System.IO.File]::Create($icoPath)
$writer = New-Object System.IO.BinaryWriter($fileStream)

$writer.Write([UInt16]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]$iconEntries.Count)

$offset = 6 + (16 * $iconEntries.Count)
foreach ($entry in $iconEntries) {
  $dimension = if ($entry.Size -ge 256) { [byte]0 } else { [byte]$entry.Size }
  $writer.Write($dimension)
  $writer.Write($dimension)
  $writer.Write([byte]0)
  $writer.Write([byte]0)
  $writer.Write([UInt16]1)
  $writer.Write([UInt16]32)
  $entryBytes = [byte[]]$entry.Bytes
  $writer.Write([UInt32]$entryBytes.Length)
  $writer.Write([UInt32]$offset)
  $offset += $entryBytes.Length
}

foreach ($entry in $iconEntries) {
  $entryBytes = [byte[]]$entry.Bytes
  $writer.Write($entryBytes)
}

$writer.Close()
$fileStream.Close()

Write-Host "Generated icon files:"
Write-Host " - $pngPath"
Write-Host " - $icoPath"
