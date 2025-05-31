param (
    [string]$RootPath = "."
)

# check if ffmpeg.zip exists
if (Test-Path (Join-Path $RootPath "ffmpeg.zip")) {
    Write-Output "FFmpeg ZIP already exists. Skipping download."
    return
}

# Normalize path and set up variables
$RootPath = Resolve-Path $RootPath
$binPath = Join-Path $RootPath "bin"
$ffmpegZipUrl = "https://github.com/BtbN/FFmpeg-Builds/releases/download/autobuild-2025-05-31-14-01/ffmpeg-N-119779-g6c291232cf-win64-gpl-shared.zip"
$zipFile = Join-Path $RootPath "ffmpeg.zip"

# Create bin directory if it doesn't exist
if (!(Test-Path $binPath)) {
    New-Item -ItemType Directory -Path $binPath | Out-Null
}

# Download FFmpeg .zip
Write-Output "Downloading FFmpeg ZIP..."
Invoke-WebRequest -Uri $ffmpegZipUrl -OutFile $zipFile

# Extract ZIP to bin
Write-Output "Extracting FFmpeg to bin..."
Expand-Archive -Path $zipFile -DestinationPath $binPath -Force

# Move contents from subfolder to bin root (optional)
#$extractedSubfolder = Get-ChildItem -Path $binPath -Directory | Select-Object -First 1
#if ($extractedSubfolder) {
#    Write-Output "Moving FFmpeg files to bin root..."
#    Move-Item -Path "$($extractedSubfolder.FullName)\*" -Destination $binPath -Force
#    Remove-Item $extractedSubfolder.FullName -Recurse -Force
#}

Remove-Item $zipFile

Write-Output "✅ FFmpeg is ready in '$binPath'."
