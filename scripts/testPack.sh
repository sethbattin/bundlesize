#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
# take the result of `npm pack` and install it in a test npm project

PACKAGE_NAME=`node -p "require(\"./package.json\").name"`
PACKAGE_VERSION=`node -p "require(\"./package.json\").version"`
PACK_TGZ=${PACKAGE_NAME}-${PACKAGE_VERSION}.tgz
echo "testing $PACK_TGZ"

TEST_DIR=tmp/test_pack_$PACKAGE_VERSION
mkdir -p $TEST_DIR
cp $PACK_TGZ $TEST_DIR
cd $TEST_DIR
printf '{
  "bundleReport": {
    "files": [
      { "path": "package.json", "size": "3kb" }
    ]
  },
  "scripts": {
    "test": "npm run main && npm run pipe",
    "main": "bundle-report",
    "pipe": "echo blah | bundle-report-pipe --name testpipe.js --max-size=1kb"
  }
}
' > package.json
( HOME=`pwd` npm init -y )
npm i $PACK_TGZ
npm test

echo "PASS npm-pack functional tests"
