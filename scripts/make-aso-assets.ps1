Add-Type -AssemblyName System.Drawing

$root = "C:\Users\Lenovo\Desktop\ghost-escape\store-listing"
$srcDir = $root
$outP = Join-Path $root "aso\phone-1080x1920"
$outL = Join-Path $root "aso\phone-1920x1080"
$outF = Join-Path $root "aso"
New-Item -ItemType Directory -Force -Path $outP, $outL, $outF | Out-Null

$shots = @(
  @{ File = "01-home.png";          L1 = "ONE TAP";           L2 = "TWO WORLDS" },
  @{ File = "02-human-run.png";     L1 = "OUTRUN";            L2 = "THE REAPER" },
  @{ File = "03-ghost-switch.png";  L1 = "TAP TO SWITCH";     L2 = "OR YOU'RE CAUGHT" },
  @{ File = "04-reaper-close.png";  L1 = "HE'S RIGHT";        L2 = "BEHIND YOU" }
)

function New-Bmp([int]$w, [int]$h) {
  $b = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $b
}
function Save-Png24([System.Drawing.Bitmap]$bmp, [string]$path) {
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

$bg = [System.Drawing.Color]::FromArgb(7, 6, 12)
$plate = [System.Drawing.Color]::FromArgb(22, 16, 24)
$red = [System.Drawing.Color]::FromArgb(255, 59, 59)
$redDark = [System.Drawing.Color]::FromArgb(138, 16, 16)
$white = [System.Drawing.Color]::White
$muted = [System.Drawing.Color]::FromArgb(200, 192, 212)
$chain = [System.Drawing.Color]::FromArgb(90, 90, 100)

$fontBig = New-Object System.Drawing.Font "Impact", 72, ([System.Drawing.FontStyle]::Regular)
$fontMid = New-Object System.Drawing.Font "Impact", 56, ([System.Drawing.FontStyle]::Regular)
$fontTag = New-Object System.Drawing.Font "Trebuchet MS", 18, ([System.Drawing.FontStyle]::Bold)
$fontFeat = New-Object System.Drawing.Font "Impact", 54, ([System.Drawing.FontStyle]::Regular)
$fontFeat2 = New-Object System.Drawing.Font "Trebuchet MS", 20, ([System.Drawing.FontStyle]::Bold)
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

function Draw-RoundRect([System.Drawing.Graphics]$g, [System.Drawing.Brush]$brush, [int]$x, [int]$y, [int]$w, [int]$h, [int]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $p.AddArc($x, $y, $r, $r, 180, 90)
  $p.AddArc($x + $w - $r, $y, $r, $r, 270, 90)
  $p.AddArc($x + $w - $r, $y + $h - $r, $r, $r, 0, 90)
  $p.AddArc($x, $y + $h - $r, $r, $r, 90, 90)
  $p.CloseFigure()
  $g.FillPath($brush, $p)
  $p.Dispose()
}

$i = 1
foreach ($s in $shots) {
  $img = [System.Drawing.Image]::FromFile((Join-Path $srcDir $s.File))

  # Portrait 1080x1920 — Jetpack-style hanging sign + gameplay
  $pBmp = New-Bmp 1080 1920
  $g = [System.Drawing.Graphics]::FromImage($pBmp)
  $g.SmoothingMode = "AntiAlias"
  $g.InterpolationMode = "HighQualityBicubic"
  $g.TextRenderingHint = "AntiAliasGridFit"
  $g.Clear($bg)

  $g.FillRectangle((New-Object System.Drawing.SolidBrush $chain), 528, 36, 10, 70)
  $g.FillRectangle((New-Object System.Drawing.SolidBrush $chain), 542, 36, 10, 70)

  $signX = 70; $signY = 96; $signW = 940; $signH = 430
  Draw-RoundRect $g (New-Object System.Drawing.SolidBrush $plate) $signX $signY $signW $signH 28
  Draw-RoundRect $g (New-Object System.Drawing.SolidBrush $red) $signX $signY $signW 18 8
  $g.DrawString($s.L1, $fontBig, (New-Object System.Drawing.SolidBrush $white), (New-Object System.Drawing.RectangleF ($signX+20), ($signY+70), ($signW-40), 160), $sf)
  $g.DrawString($s.L2, $fontBig, (New-Object System.Drawing.SolidBrush $red), (New-Object System.Drawing.RectangleF ($signX+20), ($signY+220), ($signW-40), 160), $sf)
  $g.DrawString("GHOST ESCAPE", $fontTag, (New-Object System.Drawing.SolidBrush $muted), (New-Object System.Drawing.RectangleF $signX, ($signY+370), $signW, 40), $sf)

  $playW = 1000
  $playH = [int]($img.Height * (1000.0 / $img.Width))
  $playX = 40
  $playY = 1920 - $playH - 40
  if ($playY -lt 560) { $playY = 560; $playH = 1920 - 600; $playW = [int]($img.Width * ($playH / $img.Height)); $playX = [int]((1080 - $playW) / 2) }
  $g.DrawImage($img, $playX, $playY, $playW, $playH)
  $g.Dispose()
  Save-Png24 $pBmp (Join-Path $outP ("{0:d2}-{1}" -f $i, ($s.File -replace '\.png$','.png')))
  $pBmp.Dispose()

  # Landscape 1920x1080 — caption bar on top, gameplay under
  $lBmp = New-Bmp 1920 1080
  $g = [System.Drawing.Graphics]::FromImage($lBmp)
  $g.SmoothingMode = "AntiAlias"
  $g.InterpolationMode = "HighQualityBicubic"
  $g.TextRenderingHint = "AntiAliasGridFit"
  $g.Clear($bg)
  $g.FillRectangle((New-Object System.Drawing.SolidBrush $plate), 0, 0, 1920, 220)
  $g.FillRectangle((New-Object System.Drawing.SolidBrush $red), 0, 0, 1920, 12)
  $g.DrawString(($s.L1 + "  " + $s.L2), $fontMid, (New-Object System.Drawing.SolidBrush $white), (New-Object System.Drawing.RectangleF 40, 28, 1840, 120), $sf)
  $g.DrawString("GHOST ESCAPE  ·  ONE TAP ENDLESS CHASE", $fontTag, (New-Object System.Drawing.SolidBrush $muted), (New-Object System.Drawing.RectangleF 40, 150, 1840, 50), $sf)
  $g.DrawImage($img, 0, 220, 1920, 860)
  $g.Dispose()
  Save-Png24 $lBmp (Join-Path $outL ("{0:d2}-{1}" -f $i, ($s.File -replace '\.png$','.png')))
  $lBmp.Dispose()

  $img.Dispose()
  $i++
}

# Feature graphic 1024x500 — required, keep art in the center
$hero = [System.Drawing.Image]::FromFile((Join-Path $srcDir "01-home.png"))
$fBmp = New-Bmp 1024 500
$g = [System.Drawing.Graphics]::FromImage($fBmp)
$g.SmoothingMode = "AntiAlias"
$g.InterpolationMode = "HighQualityBicubic"
$g.TextRenderingHint = "AntiAliasGridFit"
$g.Clear($bg)
$scale = [Math]::Max(1024.0 / $hero.Width, 500.0 / $hero.Height)
$dw = [int]($hero.Width * $scale)
$dh = [int]($hero.Height * $scale)
$g.DrawImage($hero, [int]((1024 - $dw) / 2), [int]((500 - $dh) / 2) - 20, $dw, $dh)
$g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(160, 7, 6, 12))), 0, 0, 1024, 500)
$g.DrawString("GHOST ESCAPE", $fontFeat, (New-Object System.Drawing.SolidBrush $white), (New-Object System.Drawing.RectangleF 40, 130, 944, 120), $sf)
$g.DrawString("ONE TAP  ·  TWO WORLDS  ·  OUTRUN THE REAPER", $fontFeat2, (New-Object System.Drawing.SolidBrush $red), (New-Object System.Drawing.RectangleF 40, 260, 944, 60), $sf)
$g.Dispose()
Save-Png24 $fBmp (Join-Path $outF "feature-1024x500.png")
$fBmp.Dispose()
$hero.Dispose()

$fontBig.Dispose(); $fontMid.Dispose(); $fontTag.Dispose(); $fontFeat.Dispose(); $fontFeat2.Dispose()
Write-Output "ASO assets written"
Get-ChildItem $outP, $outL, (Join-Path $outF "feature-1024x500.png") | Select-Object FullName, Length
