#!/bin/bash

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    DOWNLOAD_PATH="$HOME/.cache/electron/"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    DOWNLOAD_PATH="$HOME/Library/Caches/electron/"
elif [[ "$OSTYPE" == "msys" ]]; then
    DOWNLOAD_PATH="$HOME/AppData/Local/electron/Cache/"
else
    echo "Unsupported operating system."
    exit 1
fi

mkdir -p "$DOWNLOAD_PATH"

FILE_PATH="$DOWNLOAD_PATH/electron-v29.1.2-darwin-arm64.zip"

if [ -f "$FILE_PATH" ]; then
    echo "File already exists. Skipping download."
else
    # 文件不存在时才下载
    curl -L -o "$FILE_PATH" "https://npmmirror.com/mirrors/electron/29.1.2/electron-v29.1.2-darwin-arm64.zip"
fi
