#!/bin/bash

rm -rf node_modules && rm -rf yarn.lock && rm -rf dist
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
yarn cache clean --all && yarn install && ./electron-download-mac-arm64
