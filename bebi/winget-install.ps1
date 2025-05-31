# install-winget.ps1
# This script attempts to install the latest version of Winget (Windows Package Manager)
# by downloading the official MSIX bundle from GitHub and installing it.

# --- Prerequisites ---
# 1. PowerShell 5.1 or PowerShell 7+
# 2. Internet Connection
# 3. RUN THIS SCRIPT AS ADMINISTRATOR!

Write-Host "--- Winget Installation Script ---"

# --- Check for Administrator Privileges ---
$isElevated = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isElevated) {
    Write-Host "ERROR: This script requires administrator privileges to install Winget system-wide."
    Write-Host "Please right-click on PowerShell and select 'Run as administrator', then run this script again."
    exit 1
}
Write-Host "Running with administrator privileges. Good."

# --- Check if Winget is already installed ---
Write-Host "Checking if Winget is already installed..."
try {
    # Try to get the version or command info; if successful, Winget is likely installed
    winget --version | Out-Null # Use a simple command that outputs something
    # Get-Command winget -ErrorAction Stop | Out-Null # Alternative check
    Write-Host "Winget appears to be already installed."
    Write-Host "You can verify by typing 'winget --version' in a new terminal window."
    Write-Host "Exiting script."
    exit 0 # Exit successfully as it's already installed
} catch {
    Write-Host "Winget command not found. Proceeding with installation..."
}

# --- Define Variables ---
$githubApiUrl = "https://api.github.com/repos/microsoft/winget-cli/releases/latest"
$tempDownloadPath = Join-Path ([System.IO.Path]::GetTempPath()) "Microsoft.DesktopAppInstaller.msixbundle"

# Ensure the temp file doesn't exist from a previous failed run
if (Test-Path $tempDownloadPath) {
    Write-Host "Removing pre-existing temporary file: $tempDownloadPath"
    Remove-Item $tempDownloadPath -Force -ErrorAction SilentlyContinue
}

# --- Find and Download the Latest Winget Release ---
Write-Host "Fetching latest release information from GitHub..."
try {
    $releaseInfo = Invoke-RestMethod -Uri $githubApiUrl -ErrorAction Stop

    # Find the .msixbundle asset
    # Filter for assets that are files and end with .msixbundle (case-insensitive)
    $asset = $releaseInfo.assets | Where-Object { $_.name -ieq "Microsoft.DesktopAppInstaller.msixbundle" }
    # Fallback if the exact name doesn't match (e.g., future naming changes)
    if (-not $asset) {
         $asset = $releaseInfo.assets | Where-Object { $_.name -ilike "*.msixbundle" }
         Write-Host "Exact filename 'Microsoft.DesktopAppInstaller.msixbundle' not found, using pattern *.msixbundle"
    }

    if (-not $asset) {
        Write-Error "Could not find the .msixbundle asset in the latest release."
        Write-Host "You may need to download it manually from:"
        Write-Host "https://github.com/microsoft/winget-cli/releases/latest"
        exit 1
    }

    $downloadUrl = $asset.browser_download_url
    Write-Host "Found latest version asset: $($asset.name)"
    Write-Host "Downloading from: $downloadUrl"

    # Download the file with a progress bar (requires PS 5.1+)
    # Use Invoke-WebRequest for downloading, it's more robust than older alternatives
    Invoke-WebRequest -Uri $downloadUrl -OutFile $tempDownloadPath -ErrorAction Stop

    Write-Host "Download complete. Saved to: $tempDownloadPath"

} catch {
    Write-Error "Failed to download Winget package from GitHub."
    Write-Error $_.Exception.Message
    Write-Host "Please check your internet connection and ensure you can access GitHub."
    Write-Host "You may need to download it manually from:"
    Write-Host "https://github.com/microsoft/winget-cli/releases/latest"
    # Clean up the temp file if the download failed mid-way
     if (Test-Path $tempDownloadPath) {
        Write-Host "Cleaning up partial temporary file: $tempDownloadPath"
        Remove-Item $tempDownloadPath -Force -ErrorAction SilentlyContinue
    }
    exit 1
}

# --- Install the Package ---
Write-Host "Installing Winget package using Add-AppxPackage..."
try {
    # Add-AppxPackage requires the full path
    # Using -ForceApplicationShutdown might help if a process is holding the package file
    Add-AppxPackage -Path $tempDownloadPath -ErrorAction Stop # -ForceApplicationShutdown

    Write-Host "Installation command executed."
    Write-Host "Winget should now be installed or updated."
    Write-Host "IMPORTANT: You might need to open a NEW PowerShell or Command Prompt window for the 'winget' command to be recognized in your PATH."

    # Optional: Clean up the downloaded file - usually good practice
    # The finally block handles this too, but doing it here ensures success path cleanup
    if (Test-Path $tempDownloadPath) {
        Write-Host "Cleaning up temporary file: $tempDownloadPath"
        Remove-Item $tempDownloadPath -Force -ErrorAction SilentlyContinue
    }

} catch {
    Write-Error "Failed to install Winget package using Add-AppxPackage."
    Write-Error $_.Exception.Message
    Write-Error "Possible reasons: Not running as administrator, package already installed in a conflicting way, or a UAC prompt was denied."
    exit 1
} finally {
    # Ensure the temporary file is removed even if installation failed unexpectedly
    # This is a fallback in case the cleanup in the try block or catch block failed
    # Using a small delay can sometimes help if the file is still in use briefly after install attempt
    # Start-Sleep -Seconds 1
    if (Test-Path $tempDownloadPath) {
         Write-Host "Attempting final cleanup of temporary file in finally block: $tempDownloadPath"
        Remove-Item $tempDownloadPath -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "--- Winget Installation Script Finished ---"
# Final verification instruction
Write-Host "To verify the installation, open a NEW terminal window (PowerShell, CMD, or Windows Terminal) and type 'winget --version'."