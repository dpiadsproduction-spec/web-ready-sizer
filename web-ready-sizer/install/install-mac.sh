#!/usr/bin/env bash
#
# Web-Ready Sizer - macOS installer
# Copies the extension into ~/Library/Application Support/Adobe/CEP/extensions
# and enables PlayerDebugMode for CSXS 9/10/11 (Illustrator 2020-2023).
#

set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXT_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions/com.webready.sizer"

echo
echo " Web-Ready Sizer - installer (macOS)"
echo " ===================================="
echo

if [ ! -f "$SRC/CSXS/manifest.xml" ]; then
    echo "[ERROR] manifest.xml not found. Run this script from the install folder."
    exit 1
fi

echo "Extension source : $SRC"
echo "Install target   : $EXT_DIR"
echo

if [ -d "$EXT_DIR" ]; then
    echo "[WARN] An existing installation was found."
    read -r -p "Replace it? [y/N] " reply
    if [[ ! "$reply" =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
    rm -rf "$EXT_DIR"
fi

echo "[1/4] Creating extensions folder..."
mkdir -p "$HOME/Library/Application Support/Adobe/CEP/extensions"

echo "[2/4] Copying extension files..."
mkdir -p "$EXT_DIR"
cp -R "$SRC/CSXS" "$EXT_DIR/CSXS"
cp -R "$SRC/client" "$EXT_DIR/client"
cp -R "$SRC/jsx" "$EXT_DIR/jsx"
[ -d "$SRC/locale" ] && cp -R "$SRC/locale" "$EXT_DIR/locale"
[ -d "$SRC/resources" ] && cp -R "$SRC/resources" "$EXT_DIR/resources"
[ -f "$SRC/.debug" ] && cp "$SRC/.debug" "$EXT_DIR/.debug"

echo "[3/4] Enabling PlayerDebugMode for CSXS 9, 10 and 11..."
for version in 9 10 11; do
    defaults write "com.adobe.CSXS.$version" PlayerDebugMode 1 2>/dev/null || true
done

echo "[4/4] Verifying installation..."
if [ -f "$EXT_DIR/CSXS/manifest.xml" ]; then
    echo "      manifest.xml present"
else
    echo "[ERROR] Installation failed - manifest.xml missing."
    exit 1
fi

# macOS may quarantine copied files; clear the flag if xattr is available.
if command -v xattr >/dev/null 2>&1; then
    xattr -dr com.apple.quarantine "$EXT_DIR" 2>/dev/null || true
fi

echo
echo " Done."
echo
echo " Next steps:"
echo "   1. Fully quit and restart Adobe Illustrator."
echo "   2. Open  Window > Extensions > Web-Ready Sizer"
echo "      (on Illustrator 2020 look under Window > Extensions (Legacy))."
echo
echo " If the panel does not appear, make sure Illustrator was closed"
echo " while running this script and that PlayerDebugMode is set."
echo
