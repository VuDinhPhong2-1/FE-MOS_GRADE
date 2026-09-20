Add-Type -AssemblyName System.Drawing

$PublicDir = Join-Path $PSScriptRoot "..\public"

function New-RoundedRectanglePath {
    param(
        [System.Drawing.RectangleF]$Rect,
        [float]$Radius
    )

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $Radius * 2
    $path.AddArc($Rect.X, $Rect.Y, $diameter, $diameter, 180, 90)
    $path.AddArc($Rect.Right - $diameter, $Rect.Y, $diameter, $diameter, 270, 90)
    $path.AddArc($Rect.Right - $diameter, $Rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($Rect.X, $Rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

function New-LogoBitmap {
    param([int]$Size)

    $bmp = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.Clear([System.Drawing.Color]::Transparent)

    $fullRect = New-Object System.Drawing.RectangleF 0, 0, $Size, $Size
    $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush $fullRect, ([System.Drawing.ColorTranslator]::FromHtml("#1B6EF3")), ([System.Drawing.ColorTranslator]::FromHtml("#0F3F9F")), 45
    $bgPath = New-RoundedRectanglePath -Rect $fullRect -Radius ($Size * 0.25)
    $g.FillPath($bg, $bgPath)

    $glassBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(28, 255, 255, 255))
    $inner = New-Object System.Drawing.RectangleF ($Size * 0.18), ($Size * 0.20), ($Size * 0.64), ($Size * 0.58)
    $innerPath = New-RoundedRectanglePath -Rect $inner -Radius ($Size * 0.085)
    $g.FillPath($glassBrush, $innerPath)

    $fontSize = [Math]::Max(7, [Math]::Round($Size * 0.31))
    $font = New-Object System.Drawing.Font "Arial", $fontSize, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
    $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $textRect = New-Object System.Drawing.RectangleF ($Size * 0.07), ($Size * 0.24), ($Size * 0.70), ($Size * 0.36)
    $g.DrawString("MOS", $font, $textBrush, $textRect, $format)

    $accentRect = New-Object System.Drawing.RectangleF ($Size * 0.62), ($Size * 0.62), ($Size * 0.30), ($Size * 0.30)
    $accentBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $accentRect, ([System.Drawing.ColorTranslator]::FromHtml("#38BDF8")), ([System.Drawing.ColorTranslator]::FromHtml("#22C55E")), 45
    $g.FillEllipse($accentBrush, $accentRect)

    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), ([Math]::Max(1.8, $Size * 0.045))
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $points = @(
        (New-Object System.Drawing.PointF ($Size * 0.675), ($Size * 0.765)),
        (New-Object System.Drawing.PointF ($Size * 0.725), ($Size * 0.815)),
        (New-Object System.Drawing.PointF ($Size * 0.845), ($Size * 0.695))
    )
    $g.DrawLines($pen, $points)

    $g.Dispose()
    return $bmp
}

function Save-Png {
    param([int]$Size, [string]$FileName)
    $bmp = New-LogoBitmap -Size $Size
    $bmp.Save((Join-Path $PublicDir $FileName), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

function New-OgImage {
    $width = 1200
    $height = 630
    $bmp = New-Object System.Drawing.Bitmap $width, $height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $rect = New-Object System.Drawing.RectangleF 0, 0, $width, $height
    $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.ColorTranslator]::FromHtml("#0F3F9F")), ([System.Drawing.ColorTranslator]::FromHtml("#1B6EF3")), 25
    $g.FillRectangle($bg, $rect)

    $bubble = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(35, 255, 255, 255))
    $g.FillEllipse($bubble, -160, -180, 520, 520)
    $g.FillEllipse($bubble, 860, 360, 460, 460)

    $logo = New-LogoBitmap -Size 180
    $g.DrawImage($logo, 90, 105, 180, 180)
    $logo.Dispose()

    $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $muted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(225, 255, 255, 255))
    $titleFont = New-Object System.Drawing.Font "Arial", 76, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
    $subFont = New-Object System.Drawing.Font "Arial", 34, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
    $smallFont = New-Object System.Drawing.Font "Arial", 26, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)

    $g.DrawString("MOS Grader", $titleFont, $white, 310, 125)
    $g.DrawString("He thong cham diem MOS", $subFont, $muted, 318, 218)
    $g.DrawString("Cham diem tu dong - Quan ly lop hoc - To chuc thi", $smallFont, $white, 96, 390)
    $g.DrawString("Excel - Word - PowerPoint", $subFont, $muted, 96, 445)

    $bmp.Save((Join-Path $PublicDir "og-image.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

Save-Png 16 "favicon-16x16.png"
Save-Png 32 "favicon-32x32.png"
Save-Png 180 "apple-touch-icon.png"
Save-Png 192 "android-chrome-192x192.png"
Save-Png 512 "android-chrome-512x512.png"
New-OgImage

$iconBmp = New-LogoBitmap -Size 32
$iconHandle = $iconBmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($iconHandle)
$fs = [System.IO.File]::Create((Join-Path $PublicDir "favicon.ico"))
$icon.Save($fs)
$fs.Dispose()
$icon.Dispose()
$iconBmp.Dispose()

Get-ChildItem $PublicDir -File | Where-Object { $_.Name -match 'favicon|apple-touch|android-chrome|og-image|site.webmanifest|mos-tab-logo' } | Select-Object Name, Length