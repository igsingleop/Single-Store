Add-Type -AssemblyName System.Drawing

# 1. Base Image
$img = [System.Drawing.Image]::FromFile("c:\Users\Deepak\OneDrive\Desktop\Single Store\public\favicon.jpg")
$img.Save("c:\Users\Deepak\OneDrive\Desktop\Single Store\public\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Helper function to resize and save PNG
function Save-PngScale($srcImg, $path, $w, $h) {
    $resized = New-Object System.Drawing.Bitmap($srcImg, $w, $h)
    $resized.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $resized.Dispose()
}

# Generate sizes
Save-PngScale $img "c:\Users\Deepak\OneDrive\Desktop\Single Store\public\favicon-32x32.png" 32 32
Save-PngScale $img "c:\Users\Deepak\OneDrive\Desktop\Single Store\public\favicon-48x48.png" 48 48
Save-PngScale $img "c:\Users\Deepak\OneDrive\Desktop\Single Store\public\favicon-96x96.png" 96 96
Save-PngScale $img "c:\Users\Deepak\OneDrive\Desktop\Single Store\public\favicon-144x144.png" 144 144
Save-PngScale $img "c:\Users\Deepak\OneDrive\Desktop\Single Store\public\apple-touch-icon.png" 180 180
Save-PngScale $img "c:\Users\Deepak\OneDrive\Desktop\Single Store\public\favicon-192x192.png" 192 192

$img.Dispose()

# 2. Convert to genuine 48x48 ICO
$bmp = [System.Drawing.Bitmap]::FromFile("c:\Users\Deepak\OneDrive\Desktop\Single Store\public\favicon.jpg")
$iconBmp = New-Object System.Drawing.Bitmap($bmp, 48, 48)
$hIcon = $iconBmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$stream = New-Object System.IO.FileStream("c:\Users\Deepak\OneDrive\Desktop\Single Store\public\favicon.ico", [System.IO.FileMode]::Create)
$icon.Save($stream)
$stream.Close()
$icon.Dispose()
$iconBmp.Dispose()
$bmp.Dispose()

Write-Output "ICO and PNG conversions completed successfully!"
