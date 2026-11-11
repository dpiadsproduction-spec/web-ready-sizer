#!/usr/bin/env bash
#
# uninstall.sh - remove Web-Ready Sizer from the CEP extensions folder.
# Keeps PlayerDebugMode enabled (other extensions may rely on it).

set -euo pipefail

EXT_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions/com.webready.sizer"

if [ ! -d "$EXT_DIR" ]; then
    echo "Web-Ready Sizer is not installed at:"
    echo "  $EXT_DIR"
    exit 0
fi

read -r -p "Remove $EXT_DIR ? [y/N] " reply
if [[ ! "$reply" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

rm -rf "$EXT_DIR"
echo "Removed. Restart Illustrator to complete the uninstall."
