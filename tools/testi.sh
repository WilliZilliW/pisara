#!/bin/sh
# Builds _testi.html: the game in test mode with the level tools loaded. Open it in a browser and run
#   pisaraSolver.followAll(PISARA_OHJEET)   (play every level with its walkthrough)
#   await pisaraSolver.solve(11)            (find a walkthrough for one level, numbered from 0)
#   pisaraAnalysis.all()                    (fast geometric check of every level)
set -e
cd "$(dirname "$0")/.."
{
  echo '<script>window.PISARA_TEST = true;</script>'
  cat pisara.html
  echo '<script>'
  cat tools/analyysi.js tools/ratkaisija.js tools/ohjeet.js
  echo '</script>'
} > _testi.html
