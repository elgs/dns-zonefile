#!/bin/sh
DENO_DIR=dist/deno/
rm -r ${DENO_DIR}
mkdir -p ${DENO_DIR}
#
#echo '{
#    "deno.enable": true,
#    "deno.lint": true,
#    "deno.unstable": true,
#    "deno.suggest.imports.hosts": {
#        "https://deno.land": true
#    }
#}
#' > ${DENO_DIR}.vscode/settings.json
cp -r src/ ${DENO_DIR}


find ${DENO_DIR} -type f -exec sed -i "s|.js\";|.ts\";|g" {} \;
