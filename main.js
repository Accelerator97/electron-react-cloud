const { app, BrowserWindow,Menu,ipcMain } = require('electron')
const isDev = require('electron-is-dev')
const menuTemplate =require('./src/menuTemplate')
const AppWindow = require('./src/AppWindow')
const path = require('path')

let mainWindow,settingWindow
app.on('ready', () => {
    const mainWindowConfig = {
        width: 1024,
        height: 680,
    }
    //判断是否在生产环境
    const urlLocation = isDev ? 'http://localhost:3000' : 'dummyurl'
    mainWindow = new AppWindow(mainWindowConfig,urlLocation)
    mainWindow.on('close',()=>{
        mainWindow = null
    })
    //添加事件
    ipcMain.on('open-settings-window',()=>{
        const settingWindowConfig = {
            width:500,
            height:400,
            parent:mainWindow
        }
        //加载setting.html  如果是加载html文件用file:// 结合path.join拼接文件路径
        const settingFileLocation = `file://${path.join(__dirname,'./settings/settings.html')}` 
        settingWindow = new AppWindow(settingWindowConfig,settingFileLocation)
        settingWindow.on('closed',()=>{
            settingWindow = null
        })
    })

    //设置原生菜单
    const menu =Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)
    mainWindow.webContents.openDevTools()
})