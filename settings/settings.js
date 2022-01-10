const { remote, ipcRenderer } = require('electron')
const Store = require('electron-store')
const settingsStore = new Store({name: 'Settings'})
//对应的是四个input选择器
const qiniuConfigArr = ['#savedFileLocation','#accessKey', '#secretKey', '#bucketName']

const $ = (selector) => {
  const result = document.querySelectorAll(selector)
  return result.length > 1 ? result : result[0]
}

//模拟DOM加载完毕的过程
document.addEventListener('DOMContentLoaded', () => {
  //文件路径存储到electron.store
  let savedLocation = settingsStore.get('savedFileLocation')
  if (savedLocation) {
    $('#savedFileLocation').value = savedLocation
  }
  // 如果之前已经设置，那么从electron store取值填充到input框
  qiniuConfigArr.forEach(selector => {
    //第一项是#savedFileLocation，从第二项开始取值
    const savedValue = settingsStore.get(selector.substr(1))
    if (savedValue) {
      $(selector).value = savedValue
    }
  })
  //点击保存新路径的按钮 弹出消息框
  $('#select-new-location').addEventListener('click', () => {
    remote.dialog.showOpenDialog({
      properties: ['openDirectory'],
      message: '选择文件的存储路径',
    }, (path) => { //回调函数能获得设置的路径
      if (Array.isArray(path)) {
        $('#savedFileLocation').value = path[0]
      }
    })
  })
  //表单提交的时候，从四个input遍历取value值
  $('#settings-form').addEventListener('submit', (e) => {
    e.preventDefault()
    qiniuConfigArr.forEach(selector => {
      if ($(selector)) {
        let { id, value } = $(selector)
        settingsStore.set(id, value ? value : '')
      }
    })
    // sent a event back to main process to enable menu items if qiniu is configed
    ipcRenderer.send('config-is-saved')
    remote.getCurrentWindow().close()
  })

  //点击tab实现切换
  //思路把每个tab-link的active样式移除，再根据当前点击的tab-link添加active样式
  //每个item显示的区块先设置为none,点击的时候再展示
  $('.nav-tabs').addEventListener('click', (e) => {
    e.preventDefault()
    $('.nav-link').forEach(element => {
      element.classList.remove('active')
    })
    e.target.classList.add('active')
    $('.config-area').forEach(element => {
      element.style.display = 'none'
    })
    //每个tab-link上有个data-tab属性，对应的是对应区块的选择器
    $(e.target.dataset.tab).style.display = 'block'
  })
})