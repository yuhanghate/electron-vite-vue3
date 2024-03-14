# Electron-Vite-template

### 1. 安装nodejs

版本必须 >= 20

```shell
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
nvm install 20
nvm use
node -v
```

### 2. 安装yarn 4.0版本

```shell
npm install -g corepack
corepack install -g yarn@4.1.1
yarn -v
```

### 3. 运行yarn

```shell
sh yarn_install.sh
```

### 4. 打包windows/macos

```shell
yarn run build:win64 // 打包windows 64位
yarn run build:win32 // 打包windows 32位
yarn run build:mac   // 打包mac
```
