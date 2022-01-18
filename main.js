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
    const urlLocation = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname,'./build/index.html')}`
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

    ipcMain.on('download-all-to-local',()=>{
        mainWindow.webContents.send('loading-status',true)

        //获取本地文件名
        const filesObj = fileStore.get('files') || {}
        const localFiles = Object.keys(filesObj).reduce((result,fileKey)=>{
            const title = filesObj[fileKey].title + `.md`
            result[title] = filesObj[fileKey]
            return result
        },{})

        console.log('本地文件',localFiles)
          
        //获取本地文件存放路径
        const savedLocation = settingsStore.get('savedFileLocation') || app.getPath('documents')

        //获取云端文件
        const manager = createManager()
        manager
        .getFilesList()
        .then(({ items }) => {
          // console.log('返回', items)
          // 和本地列表进行对比，下载文件应该是比本地新的或本地没有的
          //filter()对数组中的每个元素都执行一次指定的函数（callback），并且创建一个新的数组，该数组元素是所有回调函数执行时返回值为 true(return true) 的原数组元素，返回值为false(return false)的原数组元素过滤掉
          downloadFiles = items.filter(item => {
            if (localFiles[item.key]) {
              console.log('本地存在', item.key)
              return item.putTime / 10000 > localFiles[item.key].updatedAt
            } else {
              console.log('本地不存在', item.key)
              return true
            }
          })
          console.log('需要下载的文件列表', downloadFiles)
  
          const downloadPromiseArr = downloadFiles.map(item => {
            // 本地存在的按原路径下载，不存在的按设置路径下载
            if (localFiles[item.key]) {
              return manager.downLoadFile(item.key, localFiles[item.key].path)
            } else {
              return manager.downLoadFile(
                item.key,
                path.join(savedLocation, item.key)
              )
            }
          })
  
          return Promise.all(downloadPromiseArr)
        })
        .then(arr => {
          dialog.showMessageBox({
            type: 'info',
            title: `本地下载更新完毕！`,
            message: `本地下载更新完毕！`
          })
  
          // 生成一个新的key为id, value为文件详情的object
          // 本地存在的对象覆盖掉，不存在的新建一个文件对象
          const finalFilesObj = downloadFiles.reduce(
            (newFilesObj, qiniuFile) => {
              const currentFile = localFiles[qiniuFile.key]
              if (currentFile) {
                const updateItem = {
                  ...currentFile,
                  isSynced: true,
                  updatedAt: new Date().getTime()
                }
                return {
                  ...newFilesObj,
                  [currentFile.id]: updateItem
                }
              } else {
                const newId = uuidv4()
                const title = qiniuFile.key.split('.')[0]
                const newItem = {
                  id: newId,
                  title,
                  body: '## 请输出 Markdown',
                  createdAt: new Date().getTime(),
                  path: path.join(savedLocation, `${title}.md`),
                  isSynced: true,
                  updatedAt: new Date().getTime()
                }
                return {
                  ...newFilesObj,
                  [newId]: newItem
                }
              }
            },
            { ...filesObj }
          )
          console.log('更新本地数据', finalFilesObj)
          mainWindow.webContents.send('files-downLoaded', {
            newFiles: finalFilesObj
          })
        })
        .catch((err) => {
          dialog.showErrorBox('下载失败', '下载失败')
          console.log(err)
        })
        .finally(() => {
          mainWindow.webContents.send('loading-status', false)
        })
    })
  

    //删除文件
    ipcMain.on('delete-file', (event, data) => {
        const manager = createManager()
        console.log('data', data)
        manager.deleteFile(data).then((res) => {
            console.log('删除云端文件成功',res)
            mainWindow.webContents.send('delete-file', { status: 'delete-file-success', id })
        }, (err) => {
            dialog.showErrorBox('同步失败', '请检查七牛云参数是否正确')
            console.log(err)
        })
    })

    //文件重命名
    ipcMain.on('update-file-name', (event, data) => {
        const {newName,oldName} = data
        const manager = createManager()
        manager.updateName(newName,oldName).then(res=>{
            console.log(res)
            console.log('更新云端文件名成功')
        }).catch(err=>{
            dialog.showErrorBox('同步失败', '请检查七牛云参数是否正确')
            console.log('更新云端文件名失败',err)
        })
    })
})