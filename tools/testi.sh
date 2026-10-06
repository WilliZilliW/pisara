#!/bin/sh
# Builds _testi.html: the game in test mode with the bot loaded. Open it in a browser and run
#   await pisaraBot.runAll()          (all levels)
#   await pisaraBot.runLevel(11)      (one level, numbered from 0)
set -e
cd "$(dirname "$0")/.."
{
  echo '<script>window.PISARA_TEST = true;</script>'
  cat pisara.html
  echo '<script>'
  cat tools/botti.js
  echo '</script>'
} > _testi.html
