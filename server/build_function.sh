#!/bin/bash
# rules.js + sync_core.js + http_handler.js 를 Deno(Edge Function)가 읽는 ESM 한 파일로 묶어요.
cd "$(dirname "$0")"; ESB=${ESBUILD:-$(command -v esbuild || echo /opt/npm-tools/node_modules/@esbuild/linux-x64/bin/esbuild)}
echo "export {handle} from './http_handler.js'" > /tmp/_entry.mjs; cp /tmp/_entry.mjs ./_entry.mjs
"$ESB" _entry.mjs --bundle --format=esm --platform=neutral --main-fields=main --outfile=functions/sync-events/core.mjs --log-level=warning; rm -f _entry.mjs; ls -la functions/sync-events/core.mjs
