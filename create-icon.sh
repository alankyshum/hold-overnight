#!/bin/bash
# Create a simple placeholder icon for the Raycast extension
# This creates a 512x512 PNG with a shield symbol using ImageMagick
# If ImageMagick is not available, you can create this icon manually

# Check if ImageMagick is available
if command -v convert &> /dev/null; then
    echo "Creating placeholder icon using ImageMagick..."
    convert -size 512x512 xc:lightblue \
        -fill darkblue \
        -draw "roundrectangle 100,100 412,412 50,50" \
        -fill white \
        -pointsize 200 \
        -gravity center \
        -annotate +0+0 "🛡" \
        assets/command-icon.png
    echo "Icon created at assets/command-icon.png"
else
    echo "ImageMagick not found. Please manually create an icon file:"
    echo "- File: assets/command-icon.png"
    echo "- Size: 512x512 pixels"
    echo "- Content: A shield or financial protection symbol"
    echo ""
    echo "You can also download a free icon from:"
    echo "- https://www.flaticon.com (search for 'shield' or 'protection')"
    echo "- https://heroicons.com"
    echo "- https://feathericons.com"
fi
