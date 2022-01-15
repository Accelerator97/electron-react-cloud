const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const isDev = require('electron-is-dev')
const menuTemplate = require('./src/menuTemplate')
const AppWindow = require('./src/AppWindow')
const path = require('path')
const Store = require('electron-store')
const QiniuManager = require('./src/utils/QiniuManager')
const settingsStore = new Store({ name: 'Settings' })

let mainWindow, settingWindow
const createManager = () => {
    const accessKey = settingsStore.get('accessKey')
    const secretKey = settingsStore.get('secretKey')
    const bucketName = settingsStore.get('bucketName')
    return new QiniuManager(accessKey, secretKey, bucketName)
}
app.on('ready', () => {
    const mainWindowConfig = {
        width: 1024,
        height: 680,
    }

    //判断是否在生产环境
    const urlLocation = isDev ? 'http://localhost:3000' : 'dummyurl'
    mainWindow = new AppWindow(mainWindowConfig, urlLocation)
    mainWindow.on('close', () => {
        mainWindow = null
    })

    //设置原生菜单
    const menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)
    mainWindow.webContents.openDevTools()

    //添加事件
    ipcMain.on('open-settings-window', () => {
        const settingWindowConfig = {
            width: 600,
            height: 600,
            parent: mainWindow
        }
        //加载setting.html  如果是加载html文件用file:// 结合path.join拼接文件路径
        const settingFileLocation = `file://${path.join(__dirname, './settings/settings.html')}`
        settingWindow = new AppWindow(settingWindowConfig, settingFileLocation)
        settingWindow.removeMenu() //移除原生菜单
        settingWindow.on('closed', () => {
            settingWindow = null
        })
    })

    //qiniu配置被设置后 激活菜单项
    ipcMain.on('config-is-saved', () => {
        //拿到qiniu菜单项，在windows和mac系统，qiniu菜单项对应的index不同
        let qiniuMenu = process.platform === 'darwin' ? menu.item[3] : menu.item[2]
        const switchItems = (toggle) => {
            [1, 2, 3].forEach(number => {
                qiniuMenu.submenu.items[number].enabled = toggle
            })
        }
        const qiniuIsConfiged = ['accessKey', 'secretKey', 'bucketName'].every(key => !!settingsStore.get(key))
        if (qiniuIsConfiged) {
            switchItems(true)
        } else {
            switchItems(false)
        }

    })

    //上传文件
    ipcMain.on('upload-file', (event, data) => {
        const manager = createManager()
        manager.upLoadFile(data.key, data.path).then(
            (data) => {
                console.log('上传成功', data)
                //主进程把上传成功的事件发送给渲染进程
                mainWindow.webContents.send('active-file-uploaded')
            }
        ).catch(err => {
            dialog.showErrorBox('同步失败', '请检查七牛云参数是否正确')
            console.log(err)
        })
    })
})