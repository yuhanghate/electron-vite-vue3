#!/bin/bash

rm -rf node_modules && rm -rf yarn.lock && rm -rf dist
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
yarn cache clean --all && yarn install

# 获取当前操作系统类型
os_type=$(uname)

if [ "$os_type" == "Darwin" ]; then
    echo "Running on macOS"
    # 在 macOS 上执行的命令
    ./electron-download-mac-arm64
elif [ "$os_type" == "Linux" ]; then
    echo "Running on Linux"
    # 在 Linux 上执行的命令
    ./electron-download-linux-amd64
elif [ "$os_type" == "Windows" ]; then
    echo "Running on Windows"
    # 在 Windows 上执行的命令
    ./electron-download-windows-amd64.exe
else
    echo "Unsupported operating system: $os_type"
fi
