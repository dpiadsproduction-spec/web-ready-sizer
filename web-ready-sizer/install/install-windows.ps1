# Web-Ready Sizer - Windows PowerShell installer
#
# Copies the extension into %APPDATA%\Adobe\CEP\extensions and enables
# PlayerDebugMode for CSXS 9/10/11 (Illustrator 2020-2023).
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File install-windows.ps1

[CmdletBinding()]
param(
    [switch]$Force,
    [switch]$NoDebugMode
)

$ErrorActionPreference = "Stop"

$Source = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Target = Join-Path $env:APPDATA "Adobe\CEP\extensions\com.webready.sizer"

Write-Host ""
Write-Host " Web-Ready Sizer - installer (Windows / PowerShell)" -ForegroundColor Cyan
Write-Host " ==================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path (Join-Path $Source "CSXS\manifest.xml"))) {
    Write-Host "[ERROR] manifest.xml not found next to the install folder." -ForegroundColor Red
    exit 1
}

Write-Host "Extension source : $Source"
Write-Host "Install target   : $Target"
Write-Host ""

if (Test-Path $Target) {
    if (-not $Force) {
        $reply = Read-Host "An existing installation was found. Replace it? [y/N]"
        if ($reply -notmatch '^[Yy]') {
            Write-Host "Aborted."
            exit 1
        }
    }
    Write-Host "[0/4] Removing the previous installation..."
    Remove-Item -Recurse -Force $Target
}

Write-Host "[1/4] Creating extensions folder..."
New-Item -ItemType Directory -Force -Path (Split-Path $Target) | Out-Null

Write-Host "[2/4] Copying extension files..."
New-Item -ItemType Directory -Force -Path $Target | Out-Null
foreach ($folder in @("CSXS", "client", "jsx", "locale", "resources")) {
    $from = Join-Path $Source $folder
    if (Test-Path $from) {
        Copy-Item -Recurse -Force $from $Target
    }
}
$debugFile = Join-Path $Source ".debug"
if (Test-Path $debugFile) {
    Copy-Item -Force $debugFile $Target
}

if (-not $NoDebugMode) {
    Write-Host "[3/4] Enabling PlayerDebugMode for CSXS 9, 10 and 11..."
    foreach ($version in 9, 10, 11) {
        $path = "HKCU:\Software\Adobe\CSXS.$version"
        if (-not (Test-Path $path)) {
            New-Item -Path $path -Force | Out-Null
        }
        New-ItemProperty -Path $path -Name "PlayerDebugMode" -Value "1" -PropertyType String -Force | Out-Null
    }
} else {
    Write-Host "[3/4] Skipping PlayerDebugMode (as requested)."
}

Write-Host "[4/4] Verifying installation..."
if (Test-Path (Join-Path $Target "CSXS\manifest.xml")) {
    Write-Host "      manifest.xml present" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Installation failed - manifest.xml missing." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host " Done." -ForegroundColor Green
Write-Host ""
Write-Host " Next steps:"
Write-Host "   1. Fully quit and restart Adobe Illustrator."
Write-Host "   2. Open  Window > Extensions > Web-Ready Sizer"
Write-Host "      (on Illustrator 2020 it may be under Window > Extensions (Legacy))."
Write-Host ""
