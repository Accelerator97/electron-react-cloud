const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const isDev = require('electron-is-dev')
const menuTemplate = require('./src/menuTemplate')
const AppWindow = require('./src/AppWindow')
const path = require('path')
const Store = require('electron-store')
const QiniuManager = require('./src/utils/QiniuManager')
const settingsStore = new Store({ name: 'Settings' })
const fileStore = new Store({ name: 'Files Data' })

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

    ipcMain.on('download-file', (event, data) => {
        const manager = createManager()
        const filesObj = fileStore.get('files')
        const { key, path, id } = data
        manager.getStat(data.key).then((res) => {
            //普及下TimeStamp 从1970年1月1日到现在的秒数
            //1秒=1000毫秒 1毫秒 = 1000微秒  1微秒 = 1000 纳秒
            //puttime是七牛云文档中提示的文件创建时间，单位是100纳秒
            //所以1毫秒 = 10000 * 100 纳秒
            const serverUpdatedTIme = Math.round(res.putTime / 10000)
            const localUpdatedTime = filesObj[id].updatedAt
            if (serverUpdatedTIme > localUpdatedTime || !localUpdatedTime) {
                console.log('new File')
                manager.downLoadFile(key, path).then(() => {
                    mainWindow.webContents.send('file-downloaded', { status: 'downloaed-success', id })
                })
            } else {
                console.log('no new file')
                mainWindow.webContents.send('file-downloaded', { status: 'no-new-file', id })
            }
        }, (err) => {
            if (err.status === 612) {
                mainWindow.webContents.send('file-downloaded', { status: 'no-file', id })
            }
            console.log(err)
        })
    })

    ipcMain.on('upload-all-to-qiniu', () => {
        mainWindow.webContents.send('loading-status', true)
        //从本地store中拿到所有的files
        const filesObj = fileStore.get('files') || {}
        const manager = createManager()
        //上传filesObj中的每一个对象到七牛云
        const uploadPromiseArr = Object.keys(filesObj).map(key => {
            const file = filesObj[key]
            return manager.upLoadFile(`${file.title}.md`, file.path)
        })
        Promise.all(uploadPromiseArr).then(result => {
            //上传成功弹出提示
            dialog.showMessageBox({
                type: 'info',
                title: `成功上传了${result.length}个文件`,
                message: `成功上传了${result.length}个文件`
            })
            //发送事件给渲染进程 要更新state和本地store中关于文件的状态
            mainWindow.webContents.send('files-uploaded')
        }).catch(err => {
            //上传失败弹出提示
            dialog.showErrorBox('同步失败', '请检查七牛云参数是否正确')
            console.log(err)
        }).finally(() => {
            mainWindow.webContents.send('loading-status', false)
        })
    })

    ipcMain.on('delete-file', (event, data) => {
        const manager = createManager()
        console.log('data',data)
        manager.deleteFile(data).then((res) => {
            console.log(res)
            mainWindow.webContents.send('delete-file', { status: 'delete-file-success', id })
        }, (err) => {
            dialog.showErrorBox('同步失败', '请检查七牛云参数是否正确')
            console.log(err)
        })
    })
})