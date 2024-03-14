import {ipcMain, dialog, BrowserWindow, app, net} from 'electron'
import Server from '../server'
import {winURL} from '../config/StaticPath'
import {updater} from './HotUpdater'
import DownloadFile from './downloadFile'
import Update from './checkupdate'
import {join} from 'path'
import path from 'path'
import config from '@config/index'
import fs from 'fs'
import os from 'os'
import {
    configAudio2,
    configAudio4, configChannel1, configChannel3,
    configNet1,
    configNet2, configNet3, configNet4, configNet5, configStorage1, configStorage2, configVideo1, configVideo2,
    getStorageStatus,
    login,
    sessionHeartbeat
} from "../utils/nvrApi";
import {Account} from "@renderer/model/Account"
import {response} from "express";
import {j} from "vite/dist/node/types.d-FdqQ54oU";

export default {
    Mainfunc: function () {
        const allUpdater = new Update()
        ipcMain.handle('IsUseSysTitle', async () => {
            return config.IsUseSysTitle
        })
        ipcMain.handle('app-close', (event, args) => {
            app.quit()
        })
        ipcMain.handle('check-update', (event) => {
            allUpdater.checkUpdate(BrowserWindow.fromWebContents(event.sender))
        })
        ipcMain.handle('confirm-update', () => {
            allUpdater.quitAndInstall()
        })
        ipcMain.handle('open-messagebox', async (event, arg) => {
            const res = await dialog.showMessageBox(BrowserWindow.fromWebContents(event.sender), {
                type: arg.type || 'info',
                title: arg.title || '',
                buttons: arg.buttons || [],
                message: arg.message || '',
                noLink: arg.noLink || true
            })
            return res
        })
        ipcMain.handle('open-errorbox', (event, arg) => {
            dialog.showErrorBox(
                arg.title,
                arg.message
            )
        })
        ipcMain.handle('start-server', async () => {
            try {
                const serveStatus = await Server.StatrServer()
                console.log(serveStatus)
                return serveStatus
            } catch (error) {
                dialog.showErrorBox(
                    '错误',
                    error
                )
            }
        })
        ipcMain.handle('stop-server', async (event, arg) => {
            try {
                const serveStatus = await Server.StopServer()
                return serveStatus
            } catch (error) {
                dialog.showErrorBox(
                    '错误',
                    error
                )
            }
        })
        ipcMain.handle('hot-update', (event, arg) => {
            updater(BrowserWindow.fromWebContents(event.sender))
        })
        ipcMain.handle('start-download', (event, msg) => {
            new DownloadFile(BrowserWindow.fromWebContents(event.sender), msg.downloadUrl).start()
        })
        ipcMain.handle('open-win', (event, arg) => {
            const ChildWin = new BrowserWindow({
                titleBarStyle: config.IsUseSysTitle ? 'default' : 'hidden',
                height: 595,
                useContentSize: true,
                width: 1140,
                autoHideMenuBar: true,
                minWidth: 842,
                frame: config.IsUseSysTitle,
                show: false,
                webPreferences: {
                    sandbox: false,
                    webSecurity: false,
                    // 如果是开发模式可以使用devTools
                    devTools: process.env.NODE_ENV === 'development',
                    // 在macos中启用橡皮动画
                    scrollBounce: process.platform === 'darwin',
                    preload: process.env.NODE_ENV === 'development'
                        ? join(app.getAppPath(), 'preload.js')
                        : join(app.getAppPath(), 'dist', 'electron', 'main', 'preload.js')
                }
            })
            // 开发模式下自动开启devtools
            if (process.env.NODE_ENV === 'development') {
                ChildWin.webContents.openDevTools({mode: 'undocked', activate: true})
            }
            ChildWin.loadURL(winURL + `#${arg.url}`)
            ChildWin.once('ready-to-show', () => {
                ChildWin.show()
                if (arg.IsPay) {
                    // 检查支付时候自动关闭小窗口
                    const testUrl = setInterval(() => {
                        const Url = ChildWin.webContents.getURL()
                        if (Url.includes(arg.PayUrl)) {
                            ChildWin.close()
                        }
                    }, 1200)
                    ChildWin.on('close', () => {
                        clearInterval(testUrl)
                    })
                }
            })
            // 渲染进程显示时触发
            ChildWin.once("show", () => {
                ChildWin.webContents.send('send-data', arg.sendData)
            })
        })

        ipcMain.handle('save-account-list', async (event, args) => {
            console.log(`进入保存账号列表${JSON.stringify(args)}`);
            // 获取用户目录路径
            const userHomeDir = os.homedir();

            // 在 Windows 下，将数据保存到 AppData 目录中
            if (process.platform === 'win32') {
                const appDataDir = path.join(userHomeDir, 'AppData', 'Roaming', app.getName());
                // 确保目录存在
                if (!fs.existsSync(appDataDir)) {
                    fs.mkdirSync(appDataDir);
                }
                // 将数据保存到 AppData 目录中
                fs.writeFileSync(path.join(appDataDir, 'account.json'), JSON.stringify(args));
            } else if (process.platform === 'darwin' || process.platform === 'linux') {
                // 在 macOS 和 Linux 下，将数据保存到用户目录中
                const userDataDir = path.join(userHomeDir, '.config', app.getName());
                // 确保目录存在
                if (!fs.existsSync(userDataDir)) {
                    fs.mkdirSync(userDataDir);
                }
                // 将数据保存到用户目录中
                fs.writeFileSync(path.join(userDataDir, 'account.json'), JSON.stringify(args));
            }
            return true;
        })

        ipcMain.handle('get-account-list', async () => {
            // 获取用户目录路径
            const userHomeDir = os.homedir();

            // 定义用于读取文件内容的 Promise 函数
            const readFilePromise = (filePath: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    fs.readFile(filePath, 'utf8', (err, fileContent) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(fileContent);
                    });
                });
            };

            // 在 Windows 下，将数据保存到 AppData 目录中
            if (process.platform === 'win32') {
                const appDataDir = path.join(userHomeDir, 'AppData', 'Roaming', app.getName());
                // 确保目录存在
                if (!fs.existsSync(appDataDir)) {
                    fs.mkdirSync(appDataDir);
                }
                // 将数据保存到 AppData 目录中
                let txtFile = path.join(appDataDir, 'account.json');
                try {
                    const filedata = await readFilePromise(txtFile);
                    return filedata;
                } catch (err) {
                    console.error(`读取文件 ${txtFile} 时出错：`, err);
                    return null;
                }
            } else if (process.platform === 'darwin' || process.platform === 'linux') {
                // 在 macOS 和 Linux 下，将数据保存到用户目录中
                const userDataDir = path.join(userHomeDir, '.config', app.getName());
                // 确保目录存在
                if (!fs.existsSync(userDataDir)) {
                    fs.mkdirSync(userDataDir);
                }
                // 将数据保存到用户目录中
                let txtFile = path.join(userDataDir, 'account.json');
                fs.readFile(txtFile, 'utf8', (err, filedata) => {
                    if (err) {
                        console.error(`读取文件 ${txtFile} 时出错：`, err);
                        return;
                    }
                    return filedata;
                });

                try {
                    const filedata = await readFilePromise(txtFile);
                    return filedata;
                } catch (err) {
                    console.error(`读取文件 ${txtFile} 时出错：`, err);
                    return null;
                }
            }
        });

        /**
         * 获取cookies.只能使用nodejs，渲染页面会出现跨域问题
         */
        ipcMain.handle('get-cookies', async (req, res) => {

            const account: Account = res as Account;

            return login(account.username, account.password, account.ip);

        });

        /**
         * 心跳，维持cookie
         */
        ipcMain.handle('session-heartbeat', async (event, args) => {
            const ip = args.ip;
            const cookie = args.cookie;
            setInterval(() => {
                sessionHeartbeat(ip, cookie);
            }, 2000);
        });

        /**
         * 查询硬盘信息
         */
        ipcMain.handle('getStorageStatus', async (event, args) => {
            const ip = args.ip;
            const cookie = args.cookie;
            console.log(`查询硬盘信息参数：${JSON.stringify(args)}`);
            return configStorage2(ip, cookie).then(response => {
                return response
            });
        });

        /**
         * 配置视频
         */
        ipcMain.handle('configVideo', async (event, args) => {
            const ip = args.ip;
            const cookie = args.cookie;

            return configVideo1(ip, cookie)
                .then(response => {
                    return configVideo2(ip, cookie);
                });
        })

        /**
         * 配置混音
         */
        ipcMain.handle('configAudio', async (event, args) => {
            const ip = args.ip;
            const cookie = args.cookie;
            console.log(`配置混音参数：${JSON.stringify(args)}`);
            configAudio2(ip, cookie).then(response => {
                console.log(`配置混音返回值：${response}`);
                return response
            })
            return configAudio4(ip, cookie).then(response => {
                console.log(`配置混音返回值：${response}`);
                return response
            });
        });

        /**
         * 配置网络
         */
        ipcMain.handle("configNetwork", async (event, args) => {
            const ip = args.ip;
            const cookie = args.cookie;
            const account = args.account;

            // 网络配置-第三步（TCP/IP提交Bond）
            configNet3(ip, cookie, account);

            return configNet2(ip, cookie).then(response => {
                const net4Data = response[0];
                const net5Data = response[0];
                configNet4(ip, cookie, account, net4Data);
                configNet5(ip, cookie, net5Data);
                return "配置成功！";
            });
        });

        /**
         * NVR硬盘格式化
         */
        ipcMain.handle("configStorage", async (event, args) => {
            const ip = args.ip;
            const cookie = args.cookie;

            return configStorage1(ip, cookie);
        });

        /**
         * NVR配置通道
         */
        ipcMain.handle("configChannel", async (event, args) => {
            const ip = args.ip;
            const cookie = args.cookie;

            configChannel1(ip, cookie);
            return configChannel3(ip, cookie);
        })
    }
}
