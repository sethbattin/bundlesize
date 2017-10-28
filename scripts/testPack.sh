#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
# take the result of `npm pack` and install it in a test npm project

#TODO: extract from package.json
PACKAGE_NAME="bundlereport"
PACKAGE_VERSION="1.0.0"
PACK_TGZ=${PACKAGE_NAME}-${PACKAGE_VERSION}.tgz
echo "testing $PACK_TGZ"

mkdir tmp
cp $PACK_TGZ tmp
cd tmp
printf '{
  "bundlereport": {
    "files": [
      { "path": "package.json", "size": "3kb" }
    ]
  },
  "scripts": {
    "test": "bundlereport"
  }
}
' > package.json
( HOME=`pwd` npm init -y )
npm i $PACK_TGZ
npm test
