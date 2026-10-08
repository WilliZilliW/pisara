#!/bin/sh
# Takes the Play Store phone screenshots (1080x2160) in Finnish and English into kauppa/kuvakaappaukset/fi/ and en/.
# Builds a screenshot page on top of the app version of the game (www/), posing as the Android app so the
# texts match it, then tools/kuvakaappaukset.mjs
# opens each scene (set up by tools/kuvakaappaukset.js) in headless Chrome emulating a phone.
# Needs Node.js and Chrome (set CHROME=<path> if Chrome is not in the default location).
set -e
cd "$(dirname "$0")/.."

sh tools/sovellus.sh
# example progress for the menu shot: first 22 levels cleared, level 23 open
PROGRESS='{"unlocked":23,"best":{},"stars":{"1":3,"2":3,"3":3,"4":3,"5":3,"6":2,"7":3,"8":3,"9":2,"10":3,"11":3,"12":3,"13":3,"14":2,"15":3,"16":3,"17":3,"18":3,"19":2,"20":3,"21":3,"22":2}}'
{
  echo "<script>window.PISARA_TEST = true; window.Capacitor = { isNativePlatform: () => true, Plugins: {} }; try { localStorage.setItem('pisara-progress-v2', '$PROGRESS'); localStorage.setItem('pisara-kieli', new URLSearchParams(location.search).get('kieli') || 'fi'); } catch (e) {}</script>"
  cat www/index.html
  echo '<script>'
  cat tools/ohjeet.js tools/kuvakaappaukset.js
  echo '</script>'
} > www/_kuvat.html

node tools/kuvakaappaukset.mjs
rm -f www/_kuvat.html
