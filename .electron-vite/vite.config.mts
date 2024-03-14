import {join} from "path";
import path from 'path';
import {defineConfig} from "vite";
import vuePlugin from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import viteIkarosTools from "./plugin/vite-ikaros-tools";
import {getConfig} from "./utils";
import {createSvgIconsPlugin} from 'vite-plugin-svg-icons';
import { VantResolver } from "@vant/auto-import-resolver";

function resolve(dir: string) {
  return join(__dirname, "..", dir);
}

const config = getConfig();

const root = resolve("src/renderer");

export default defineConfig({
  mode: config && config.NODE_ENV,
  root,
  define: {
    __CONFIG__: config,
    __ISWEB__: Number(config && config.target),
  },
  resolve: {
    alias: {
      "@renderer": root,
      "@store": join(root, "/store/modules"),
    },
  },
  base: "./",
  build: {
    outDir:
      config && config.target
        ? resolve("dist/web")
        : resolve("dist/electron/renderer"),
    emptyOutDir: true,
    target: "esnext",
    cssCodeSplit: false,
  },
  server: {},
  plugins: [
    vueJsx(),
    vuePlugin(),
    viteIkarosTools(),
    createSvgIconsPlugin({
      // 指定需要缓存的图标文件夹
      iconDirs: [path.resolve(process.cwd(), 'src/renderer/assets/icons/svg')], // 与本地储存地址一致
      // 指定symbolId格式
      symbolId: 'icon-[name]'
    }),
  ],
  optimizeDeps: {},
});
