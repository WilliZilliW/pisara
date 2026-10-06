#!/bin/sh
# Builds www/: the game for the Android app (Capacitor's webDir). Same game as index.html, but fonts are
# packaged with the app instead of loaded from Google, so it runs without a network connection, and
# browser-only instructions (marked data-vain-selain: keyboard, mouse) are left out.
# Run before every `npx cap sync`.
set -e
cd "$(dirname "$0")/.."
sh build.sh
rm -rf www
mkdir -p www/fonts
cp app/fonts/*.woff2 app/fonts/OFL-*.txt www/fonts/
FONTS='<style>@font-face { font-family: "Fredoka"; src: url(fonts/fredoka.woff2) format("woff2"); font-weight: 300 700; font-display: swap; } @font-face { font-family: "Figtree"; src: url(fonts/figtree.woff2) format("woff2"); font-weight: 300 900; font-display: swap; }</style>'
sed -e '/fonts.googleapis.com\|fonts.gstatic.com/d' \
    -e "s|^<title>Pisara</title>\$|<title>Pisara</title>\n$FONTS|" \
    -e '/<li data-vain-selain>/d' \
    -e 's|<span data-vain-selain>[^<]*</span>||g' \
    index.html > www/index.html
if grep -q 'fonts.googleapis.com' www/index.html; then echo "Google-fontteja jäi www/index.html-tiedostoon" >&2; exit 1; fi
if grep -q 'data-vain-selain' www/index.html; then echo "Selaimen ohjeita jäi www/index.html-tiedostoon" >&2; exit 1; fi
echo "www/ valmis"
