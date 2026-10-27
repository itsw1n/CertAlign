#!/usr/bin/env sh
set -e
cd "$(dirname "$0")"
if [ ! -d node_modules/next ]; then npm install; fi
npm run dev
