const { app, BrowserWindow } = require('electron')
const isDev = require('electron-is-dev')

let mainWindow
app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 680,
        webPreferences: {
            nodeIntegration: true
        }
    })
    //判断是否在生产环境
    const urlLocation = isDev ? 'http://localhost:3000' : 'dummyurl'
    mainWindow.loadURL(urlLocation)
    mainWindow.webContents.openDevTools()

})