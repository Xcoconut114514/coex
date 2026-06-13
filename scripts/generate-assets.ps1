Add-Type -AssemblyName System.Drawing

$assetRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\assets'))

$palette = @{
    Background = [System.Drawing.Color]::FromArgb(255, 4, 7, 7)
    BackgroundAlt = [System.Drawing.Color]::FromArgb(255, 10, 21, 17)
    Leaf = [System.Drawing.Color]::FromArgb(255, 151, 219, 128)
    Shell = [System.Drawing.Color]::FromArgb(255, 142, 100, 78)
    ShellShadow = [System.Drawing.Color]::FromArgb(255, 93, 59, 44)
    Foam = [System.Drawing.Color]::FromArgb(255, 244, 234, 200)
    Line = [System.Drawing.Color]::FromArgb(255, 60, 95, 79)
    Transparent = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
}

$iconArt = @(
    '000011100000',
    '000111110000',
    '001111111000',
    '011122211100',
    '111222222110',
    '112223322211',
    '112222222211',
    '112232232211',
    '011222222110',
    '001122221100',
    '000111111000',
    '000011110000'
)

function New-Bitmap {
    param(
        [int]$Width,
        [int]$Height
    )

    return New-Object System.Drawing.Bitmap($Width, $Height)
}

function Save-Png {
    param(
        [System.Drawing.Bitmap]$Bitmap,
        [string]$Path
    )

    $directory = Split-Path -Parent $Path
    if (-not (Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory | Out-Null
    }

    $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $Bitmap.Dispose()
}

function Draw-Backdrop {
    param(
        [System.Drawing.Graphics]$Graphics,
        [int]$Size
    )

    $Graphics.Clear($palette.Background)

    $backBrush = New-Object System.Drawing.SolidBrush($palette.BackgroundAlt)
    $lineBrush = New-Object System.Drawing.SolidBrush($palette.Line)

    $stripe = [Math]::Max([int]($Size / 16), 12)

    for ($index = -2; $index -lt 9; $index++) {
        $x = $index * $stripe * 2
        $points = [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new($x, 0),
            [System.Drawing.Point]::new($x + $stripe, 0),
            [System.Drawing.Point]::new($x + ($stripe * 3), $Size),
            [System.Drawing.Point]::new($x + ($stripe * 2), $Size)
        )
        $Graphics.FillPolygon($backBrush, $points)
    }

    $border = [Math]::Max([int]($Size / 128), 4)
    $Graphics.FillRectangle($lineBrush, 0, 0, $Size, $border)
    $Graphics.FillRectangle($lineBrush, 0, $Size - $border, $Size, $border)
    $Graphics.FillRectangle($lineBrush, 0, 0, $border, $Size)
    $Graphics.FillRectangle($lineBrush, $Size - $border, 0, $border, $Size)

    $backBrush.Dispose()
    $lineBrush.Dispose()
}

function Draw-PixelArt {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string[]]$Art,
        [int]$PixelSize,
        [int]$OffsetX,
        [int]$OffsetY,
        [switch]$Monochrome,
        [switch]$TransparentBackground
    )

    $leafBrush = New-Object System.Drawing.SolidBrush($(if ($Monochrome) { $palette.Foam } else { $palette.Leaf }))
    $shellBrush = New-Object System.Drawing.SolidBrush($(if ($Monochrome) { $palette.Foam } else { $palette.Shell }))
    $shadowBrush = New-Object System.Drawing.SolidBrush($(if ($Monochrome) { $palette.Foam } else { $palette.ShellShadow }))

    if (-not $TransparentBackground) {
        $outlineBrush = New-Object System.Drawing.SolidBrush($palette.Line)
        $outlineOffset = [Math]::Max([int]($PixelSize / 5), 1)
    }

    for ($rowIndex = 0; $rowIndex -lt $Art.Length; $rowIndex++) {
        $row = $Art[$rowIndex]

        for ($cellIndex = 0; $cellIndex -lt $row.Length; $cellIndex++) {
            $cell = $row[$cellIndex]
            if ($cell -eq '0') {
                continue
            }

            $x = $OffsetX + ($cellIndex * $PixelSize)
            $y = $OffsetY + ($rowIndex * $PixelSize)

            if (-not $TransparentBackground) {
                $Graphics.FillRectangle($outlineBrush, $x + $outlineOffset, $y + $outlineOffset, $PixelSize, $PixelSize)
            }

            switch ($cell) {
                '1' { $Graphics.FillRectangle($leafBrush, $x, $y, $PixelSize, $PixelSize) }
                '2' { $Graphics.FillRectangle($shellBrush, $x, $y, $PixelSize, $PixelSize) }
                '3' { $Graphics.FillRectangle($shadowBrush, $x, $y, $PixelSize, $PixelSize) }
            }
        }
    }

    $leafBrush.Dispose()
    $shellBrush.Dispose()
    $shadowBrush.Dispose()

    if (-not $TransparentBackground) {
        $outlineBrush.Dispose()
    }
}

function New-IconImage {
    param(
        [string]$Path,
        [int]$Size,
        [switch]$Transparent,
        [switch]$Monochrome
    )

    $bitmap = New-Bitmap -Width $Size -Height $Size
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None

    if ($Transparent) {
        $graphics.Clear($palette.Transparent)
    }
    else {
        Draw-Backdrop -Graphics $graphics -Size $Size
    }

    $pixelSize = [Math]::Floor(($Size * 0.68) / $iconArt[0].Length)
    $artWidth = $pixelSize * $iconArt[0].Length
    $artHeight = $pixelSize * $iconArt.Length
    $offsetX = [Math]::Floor(($Size - $artWidth) / 2)
    $offsetY = [Math]::Floor(($Size - $artHeight) / 2)

    Draw-PixelArt -Graphics $graphics -Art $iconArt -PixelSize $pixelSize -OffsetX $offsetX -OffsetY $offsetY -Monochrome:$Monochrome -TransparentBackground:$Transparent

    $graphics.Dispose()
    Save-Png -Bitmap $bitmap -Path $Path
}

function New-WavTone {
    param(
        [string]$Path,
        [double]$Frequency = 880,
        [double]$DurationSeconds = 0.28,
        [int]$SampleRate = 22050
    )

    $sampleCount = [int]($SampleRate * $DurationSeconds)
    $bytesPerSample = 2
    $channelCount = 1
    $dataSize = $sampleCount * $bytesPerSample * $channelCount

    $stream = [System.IO.File]::Open($Path, [System.IO.FileMode]::Create)
    $writer = New-Object System.IO.BinaryWriter($stream)

    $writer.Write([System.Text.Encoding]::ASCII.GetBytes('RIFF'))
    $writer.Write([int](36 + $dataSize))
    $writer.Write([System.Text.Encoding]::ASCII.GetBytes('WAVE'))
    $writer.Write([System.Text.Encoding]::ASCII.GetBytes('fmt '))
    $writer.Write([int]16)
    $writer.Write([int16]1)
    $writer.Write([int16]$channelCount)
    $writer.Write([int]$SampleRate)
    $writer.Write([int]($SampleRate * $channelCount * $bytesPerSample))
    $writer.Write([int16]($channelCount * $bytesPerSample))
    $writer.Write([int16]($bytesPerSample * 8))
    $writer.Write([System.Text.Encoding]::ASCII.GetBytes('data'))
    $writer.Write([int]$dataSize)

    for ($sampleIndex = 0; $sampleIndex -lt $sampleCount; $sampleIndex++) {
        $time = $sampleIndex / $SampleRate
        $attack = [Math]::Min($time / 0.03, 1)
        $release = [Math]::Min(($DurationSeconds - $time) / 0.08, 1)
        $envelope = [Math]::Max([Math]::Min($attack, $release), 0)
        $toneA = [Math]::Sin(2 * [Math]::PI * $Frequency * $time)
        $toneB = [Math]::Sin(2 * [Math]::PI * ($Frequency * 1.5) * $time) * 0.35
        $value = ($toneA + $toneB) * $envelope * 12000
        $writer.Write([int16][Math]::Round($value))
    }

    $writer.Dispose()
    $stream.Dispose()
}

New-IconImage -Path (Join-Path $assetRoot 'icon.png') -Size 1024
New-IconImage -Path (Join-Path $assetRoot 'splash-icon.png') -Size 1024
New-IconImage -Path (Join-Path $assetRoot 'favicon.png') -Size 48
New-IconImage -Path (Join-Path $assetRoot 'android-icon-foreground.png') -Size 432 -Transparent
New-IconImage -Path (Join-Path $assetRoot 'android-icon-monochrome.png') -Size 432 -Transparent -Monochrome
New-IconImage -Path (Join-Path $assetRoot 'android-icon-background.png') -Size 432
New-WavTone -Path (Join-Path $assetRoot 'rest-done.wav')