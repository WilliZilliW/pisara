# Draws Pisara's app icons, splash screens and Play Store feature graphic with System.Drawing.
# Output: assets/ (input for `npx @capacitor/assets generate --android`) and kauppa/ (Play Store images).
# Run: powershell -ExecutionPolicy Bypass -File tools/kuvat.ps1
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
New-Item -ItemType Directory -Force (Join-Path $root 'assets') | Out-Null
New-Item -ItemType Directory -Force (Join-Path $root 'kauppa') | Out-Null

function C($hex, $a = 255) {
  $h = $hex.TrimStart('#')
  [System.Drawing.Color]::FromArgb($a, [Convert]::ToInt32($h.Substring(0, 2), 16), [Convert]::ToInt32($h.Substring(2, 2), 16), [Convert]::ToInt32($h.Substring(4, 2), 16))
}

function New-Canvas($w, $h) {
  $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'; $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
  return @($bmp, $g)
}

function Fill-Pond($g, $w, $h) {
  $rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
  $b = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, (C '#0e2f31'), (C '#081b1e'), 90
  $g.FillRectangle($b, $rect); $b.Dispose()
}

# a round lotus leaf with veins radiating from its centre
function Draw-Leaf($g, $cx, $cy, $r) {
  $shadow = New-Object System.Drawing.SolidBrush (C '#000000' 90)
  $g.FillEllipse($shadow, $cx - $r, $cy - $r + $r * 0.04, 2 * $r, 2 * $r); $shadow.Dispose()
  $rim = New-Object System.Drawing.SolidBrush (C '#2f6a2e')
  $g.FillEllipse($rim, $cx - $r, $cy - $r, 2 * $r, 2 * $r); $rim.Dispose()
  $ri = $r * 0.965
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddEllipse($cx - $ri, $cy - $ri, 2 * $ri, 2 * $ri)
  $pg = New-Object System.Drawing.Drawing2D.PathGradientBrush $path
  $pg.CenterColor = C '#6aa652'
  $pg.SurroundColors = @((C '#2c5f2c'))
  $pg.CenterPoint = New-Object System.Drawing.PointF ($cx - $ri * 0.1), ($cy - $ri * 0.15)
  $blend = New-Object System.Drawing.Drawing2D.Blend 3
  $blend.Factors = [single[]]@(0, 0.6, 1); $blend.Positions = [single[]]@(0, 0.45, 1)
  $pg.Blend = $blend
  $g.FillPath($pg, $path); $pg.Dispose()
  $g.SetClip($path)
  $vein = New-Object System.Drawing.Pen (C '#d6f5be' 40), ([single]($r * 0.012))
  for ($i = 0; $i -lt 22; $i++) {
    $a = $i / 22 * 2 * [Math]::PI + 0.05
    $g.DrawLine($vein, [single]$cx, [single]$cy, [single]($cx + [Math]::Cos($a) * $r), [single]($cy + [Math]::Sin($a) * $r))
  }
  $vein.Dispose()
  $g.ResetClip(); $path.Dispose()
}

# a water bead: soft shadow with a bright caustic, a clear body with dark rim, and the sun's highlight
function Draw-Drop($g, $cx, $cy, $r) {
  $sx = $cx + $r * 0.3; $sy = $cy + $r * 0.42
  $sp = New-Object System.Drawing.Drawing2D.GraphicsPath
  $sp.AddEllipse($sx - $r * 1.08, $sy - $r * 1.0, $r * 2.16, $r * 2.0)
  $sb = New-Object System.Drawing.Drawing2D.PathGradientBrush $sp
  $sb.CenterColor = C '#fffcd7' 150
  $sb.SurroundColors = @((C '#061c08' 0))
  $sblend = New-Object System.Drawing.Drawing2D.ColorBlend 4
  $sblend.Colors = @((C '#061c08' 0), (C '#061c08' 110), (C '#2c4a1a' 60), (C '#fff6c8' 170))
  $sblend.Positions = [single[]]@(0, 0.3, 0.6, 1)
  $sb.InterpolationColors = $sblend
  $g.FillPath($sb, $sp); $sb.Dispose(); $sp.Dispose()

  $bp = New-Object System.Drawing.Drawing2D.GraphicsPath
  $bp.AddEllipse($cx - $r, $cy - $r, 2 * $r, 2 * $r)
  $bb = New-Object System.Drawing.Drawing2D.PathGradientBrush $bp
  $bb.CenterPoint = New-Object System.Drawing.PointF ($cx + $r * 0.25), ($cy + $r * 0.3)
  $cb = New-Object System.Drawing.Drawing2D.ColorBlend 4
  $cb.Colors = @((C '#0e3a24' 215), (C '#3d7d5e' 120), (C '#b4e4ec' 90), (C '#f0ffe8' 150))
  $cb.Positions = [single[]]@(0, 0.18, 0.6, 1)
  $bb.InterpolationColors = $cb
  $g.FillPath($bb, $bp); $bb.Dispose()
  $rim = New-Object System.Drawing.Pen (C '#08231a' 130), ([single]($r * 0.035))
  $g.DrawPath($rim, $bp); $rim.Dispose()
  $sky = New-Object System.Drawing.Pen (C '#dcf5ff' 90), ([single]($r * 0.11))
  $sky.StartCap = 'Round'; $sky.EndCap = 'Round'
  $g.DrawArc($sky, [single]($cx - $r * 0.9), [single]($cy - $r * 0.9), [single]($r * 1.8), [single]($r * 1.8), 184, 108); $sky.Dispose()
  $bp.Dispose()

  $hp = New-Object System.Drawing.Drawing2D.GraphicsPath
  $hx = $cx - $r * 0.38; $hy = $cy - $r * 0.42
  $hp.AddEllipse($hx - $r * 0.3, $hy - $r * 0.2, $r * 0.6, $r * 0.4)
  $hb = New-Object System.Drawing.Drawing2D.PathGradientBrush $hp
  $hb.CenterColor = C '#ffffff' 245; $hb.SurroundColors = @((C '#ffffff' 0))
  $g.FillPath($hb, $hp); $hb.Dispose(); $hp.Dispose()
  $dot = New-Object System.Drawing.SolidBrush (C '#ffffff')
  $g.FillEllipse($dot, $hx - $r * 0.07, $hy - $r * 0.06, $r * 0.14, $r * 0.12); $dot.Dispose()
}

function Save($bmp, $g, $name) {
  $g.Dispose(); $bmp.Save($name, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
  Write-Output "  $name"
}

$assets = Join-Path $root 'assets'
$kauppa = Join-Path $root 'kauppa'

# full icon (1024): pond, leaf filling most of it, one big drop
$bmp, $g = New-Canvas 1024 1024
Fill-Pond $g 1024 1024
Draw-Leaf $g 512 512 470
Draw-Drop $g 500 492 230
Draw-Drop $g 760 300 52
Save $bmp $g (Join-Path $assets 'icon-only.png')

# adaptive icon: background (leaf, edge to edge) and foreground (drop inside the 66 % safe zone)
$bmp, $g = New-Canvas 1024 1024
Fill-Pond $g 1024 1024
Draw-Leaf $g 512 512 560
Save $bmp $g (Join-Path $assets 'icon-background.png')
$bmp, $g = New-Canvas 1024 1024
Draw-Drop $g 500 492 200
Draw-Drop $g 700 330 42
Save $bmp $g (Join-Path $assets 'icon-foreground.png')

# splash screens (2732, content centred: Android shows only a small middle part)
foreach ($n in @('splash.png')) {
  $bmp, $g = New-Canvas 2732 2732
  Fill-Pond $g 2732 2732
  Draw-Leaf $g 1366 1366 420
  Draw-Drop $g 1356 1350 190
  Save $bmp $g (Join-Path $assets $n)
}

# Play Store: 512 icon and 1024x500 feature graphic
$src = [System.Drawing.Image]::FromFile((Join-Path $assets 'icon-only.png'))
$bmp, $g = New-Canvas 512 512
$g.DrawImage($src, 0, 0, 512, 512); $src.Dispose()
Save $bmp $g (Join-Path $kauppa 'play-kuvake-512.png')

$bmp, $g = New-Canvas 1024 500
Fill-Pond $g 1024 500
Draw-Leaf $g 512 250 420
$drops = @(@(512, 240, 92), @(330, 170, 38), @(700, 330, 44), @(250, 330, 26), @(780, 150, 30), @(430, 380, 22), @(620, 120, 20))
foreach ($d in $drops) { Draw-Drop $g $d[0] $d[1] $d[2] }
Save $bmp $g (Join-Path $kauppa 'play-mainoskuva-1024x500.png')
