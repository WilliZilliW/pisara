#!/bin/sh
# Builds index.html (a full web page for GitHub Pages) from pisara.html (the game, without the <html>/<head> shell).
set -e
cd "$(dirname "$0")"
{
  printf '<!doctype html>\n<html lang="fi">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  sed -n '1,/^<\/style>$/p' pisara.html
  printf '</head>\n<body>\n'
  sed -n '/^<\/style>$/,$p' pisara.html | tail -n +2
  printf '</body>\n</html>\n'
} > index.html
