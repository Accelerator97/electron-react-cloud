import React, { useCallback, useState, useMemo, useEffect } from 'react';
import './App.scss';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-quill/dist/quill.snow.css';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons'
import { v4 as uuidv4 } from 'uuid';
import { flattenArr, objToArr, timeStampToString } from './utils/helper'
import { fileHelper } from './utils/fileHelper'
import useIpcRenderer from './hooks/useIpcRender';
import FileSearch from './components/FileSearch'
import FileList from './components/FileList';
import BottomBtn from './components/BottomBtn';
import TabList from './components/TabList';
import useKeyPress from './hooks/useKeyPress'
import Loader from './components/Loading'

const { join, basename, extname, dirname } = window.require('path')
const { remote, ipcRenderer } = window.require('electron')
//electron-store
const Store = window.require('electron-store')
const fileStore = new Store({ name: 'Files Data' })
const settingsStore = new Store({ name: 'Settings' })

//只有当新建，删除，重命名的时候才进行持久化操作
const saveFilesToStore = (files) => {
  //不用把files的所有信息存储到store，只需要id,path,title,createdAt
  const filesStoreObj = objToArr(files).reduce((result, file) => {
    const { id, path, title, createdAt, isSynced, updatedAt } = file
    result[id] = {
      id,
      path,
      title,
      createdAt,
      isSynced,
      updatedAt
    }
    return result
  }, {})
  fileStore.set('files', filesStoreObj)
}

//判断是否设置了七牛云自动上传的参数 以及勾选了自动上传的按钮
//!!表示取布尔值 
const getAutoSync = () => ['accessKey', 'secretKey', 'bucketName', 'enableAutoSync'].every(key => !!settingsStore.get(key))

function App() {
  //从filesStore中读取,生成默认的files数组
  const [files, setFiles] = useState(fileStore.get('files') || {})
  //当前激活文件的id,数量只为一个
  const [activeFileId, setActiveFileId] = useState('')
  //已打开文件的id构成的数组
  const [openFileIds, setOpenFileIds] = useState([])
  //未保存文件的id构成的数组
  const [unSaveFileIds, setUnSaveFileIds] = useState([])
  //搜索文件形成的数组
  const [searchFiles, setSearchFiles] = useState([])
  //控制loading组件显示
  const [loading,setLoading] = useState(false)

  //还得把files从obj转为数组
  const filesObjtoArr = objToArr(files)

  //根据openId生成已经打开的文件组成的数组
  const openFiles = openFileIds.map(openId => {
    return files[openId]
  })
  //根据activeFileId获取当前激活的的文件
  const activeFile = files[activeFileId]
  //如果记录搜索文件的数组有内容就用这个数组，否则就用filesObjtoArr
  const filesArr = (searchFiles.length > 0) ? searchFiles : filesObjtoArr

  //通过remote模块从electron的主进程拿到getPath API  即文件存放的地方
  const savedLocation = settingsStore.get('saveFileLocation') || remote.app.getPath('documents')

  //按下左右箭头
  const leftArrowPressed = useKeyPress(37)
  const rightArrowPressed = useKeyPress(39)

  //查找activeFileId对应的index
  const activeFileIndex = openFileIds.findIndex(item => item === activeFileId)

  //点击文件
  const fileClick = (fileId) => {
    setActiveFileId(fileId)
    const currentFile = files[fileId]
    const {id,title,path,isLoaded}= currentFile
    //第一次打开文件 状态设置为isLoaded:true，下一次打开isLoaded为true,就不用调用fs读取文件
    if (!isLoaded) {
      if (getAutoSync) { //如果配置了七牛参数并且开启自动同步，则先从云端下载最新文件
        ipcRenderer.send('download-file', { key: `${title}.md`, path, id })
      } else {
        fileHelper.readFile(path).then((value) => {
          const newFile = { ...files[fileId], body: value, isLoaded: true }
          setFiles({ ...files, [fileId]: newFile })
        }, (err) => {
          remote.dialog.showMessageBox({
            type: 'info',
            title: `文件读取错误`,
            message: `文件读取错误`
          })
          //如果读取不到，可能是用户本地已经删除，要更新列表
          const { [fileId]: value, ...afterDelete } = files
          setFiles(afterDelete)
          saveFilesToStore(afterDelete)
          return
        })
      }

    }

    //先判断openFileId是否包括fileId，然后tab打开file
    if (!openFileIds.includes(fileId)) {
      setOpenFileIds([...openFileIds, fileId])
    }
  }

  //鼠标点击tab
  const tabClick = (fileId) => {
    setActiveFileId(fileId)
  }

  // //左箭头切换tab
  const activeFileIndexDecreased = () => {
    //查找activeFileId对应的index
    const newActiveFileIndex = activeFileIndex - 1
    const newActiveFileId = openFileIds[newActiveFileIndex]
    setTimeout(() => {
      tabClick(newActiveFileId)
    }, 200);
  }
  // //右箭头切换tab
  const activeFileIndexIncreased = () => {
    if (activeFileIndex === openFileIds.length - 1) { return }
    const newActiveFileIndex = activeFileIndex + 1
    const newActiveFileId = openFileIds[newActiveFileIndex]
    setTimeout(() => {
      tabClick(newActiveFileId)
    }, 200);
  }

  // 点击tab的关闭icon 把id从openFileId中删除,同时高亮第一项
  const tabClose = (id) => {
    const tabsWithout = openFileIds.filter(fileId => fileId !== id)
    setOpenFileIds(tabsWithout)
    if (tabsWithout.length > 0) {
      setActiveFileId(tabsWithout[0])
    } else {
      setActiveFileId('')
    }
  }
  //要接受两个参数，所以html部分事件绑定也和之前的事件绑定稍微不同
  //前面的事件绑定onClick={xxx} onClick={(value)=>{fileChange(id,value)}}
  //fileChange做两件事情 1.更新file的body  2.显示未保存的小红点
  const fileChange = ((id, value) => {
    if (value !== files[id].body) {
      //不要直接通过files[id].body =value 修改files 要通过setFiles修改
      const newFiles = { ...files[id], body: value }
      setFiles({ ...files, [id]: newFiles })
      //更新unSaveFileIds
      if (!unSaveFileIds.includes(id)) {
        setUnSaveFileIds([...unSaveFileIds, id])
      }
    }
  })

  const deleteFile = (id) => {
    if (files[id].isNew) { //只是刚刚创建还没存到electron-store中
      //排除对应的id，剩下的id集合成一个对象
      const { [id]: value, ...afterDelete } = files
      setFiles(afterDelete)
    } else { //文件已经存到了electron-store中
      fileHelper.deleteFile(files[id].path).then(() => {
        const { [id]: value, ...afterDelete } = files
        setFiles(afterDelete)
        saveFilesToStore(afterDelete)
        //如果file已经在tab打开 
        tabClose(id)
      })
    }
  }

  const updateFileName = (id, title, isNew) => {
    //如果是新创建的文件，路径就是savaLocation+title.md
    //如果不是新文件，路径是old dirname + new title
    const newPath = isNew ? join(savedLocation, `${title}.md`) : join(dirname(files[id].path), `${title}.md`)
    const modifiledFile = { ...files[id], title, isNew: false, path: newPath }
    const newFiles = { ...files, [id]: modifiledFile }
    //如果是新建立的文件
    if (isNew) {
      fileHelper.writeFile(newPath, files[id].body).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    } else { //对已有的文件重命名
      const oldPath = files[id].path
      fileHelper.renameFile(oldPath, newPath).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    }
  }

  const fileSearch = (keyword) => {
    //字符串和数组都有include方法
    const newFiles = filesArr.filter(file => file.title.includes(keyword))
    //因为更新的是files,所以其他依赖files的地方也会变化，比如说文件已经在tab打开了，search完之后就会清空tab
    //所以要创造一个新的数组，记录搜索文件
    setSearchFiles(newFiles)
  }

  //点击新建文件按钮，创造文件
  const createFiles = () => {
    const newId = uuidv4()
    const newFile =
    {
      id: newId,
      title: '',
      body: '##请输入markdown',
      createdAt: new Date().getTime(),
      //控制是否直接显示input框
      isNew: true
    }
    setFiles({ ...files, [newId]: newFile })
  }

  //保存文件
  const saveCurrentFile = () => {
    const { path, body, title } = activeFile
    fileHelper.writeFile(path, body).then(() => {
      setUnSaveFileIds(unSaveFileIds.filter(id => id !== activeFile.id))
      if (getAutoSync) {
        ipcRenderer.send('upload-file', { key: `${title}.md`, path })
      }
    })
  }

  const importFiles = () => {
    //第二个参数是回调函数，获取导入文件的路径
    //electron 6.0以上可以选用promise API写法
    remote.dialog.showOpenDialog({
      title: '选择导入的MarkDown文件',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Markdown files', extensions: ['md'] }
      ]
    }, (paths) => {
      //["C:\Users\Administrator\Desktop\面试押题\JS\JS模块化.md"]
      //如果已经导入的，就用filter过滤掉,不再导入
      if (Array.isArray(paths)) {
        const filteredPaths = paths.filter(path => {
          const alreadyAdded = Object.values(files).find(file => { //Object.values把values组成一个数组
            return file.path === path
            //find() 方法返回数组中满足提供的测试函数的第一个元素的值。否则返回 undefined
          })
          return !alreadyAdded
        })
        //扩展成[{id:'1',path:'',title:''}]这种形式
        const importFilesArr = filteredPaths.map(path => {
          return {
            id: uuidv4(),
            //basename第二个参数是后缀名，返回的结果会去掉这个后缀名
            title: basename(path, extname(path)),
            path
          }
        })
        // console.log(importFilesArr)


        //获得flatten结构的state
        const newFiles = { ...files, ...flattenArr(importFilesArr) }
        // console.log(newFiles)

        //更新state 和 electron store
        setFiles(newFiles)
        saveFilesToStore(newFiles)
        if (importFilesArr.length > 0) {
          remote.dialog.showMessageBox({
            type: 'info',
            title: `成功导入了${importFilesArr.length}个文件`,
            message: `成功导入了${importFilesArr.length}个文件`
          })
        }
      }
    })
  }

  //上传成功之后更新状态 然后更新state和本地store
  const activeFileUploaded = () => {
    const { id } = activeFile
    const modifiledFile = { ...files[id], isSynced: true, updatedAt: new Date().getTime() }
    const newFiles = { ...files, [id]: modifiledFile }
    console.log('更新本地')
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }
  //下载文件到本地之后更新state和本地store
  const activeFileDownLoaded =(event,message)=>{
    const currentFile = files[message.id]
    const {id,path } = currentFile
    fileHelper.readFile(path).then((value)=>{
      let newFile
      if(message.status === 'downloaed-success'){
        newFile = {...files[id],body:value,isLoaded:true,isSynced:true,updatedAt:new Date().gettime()}
      }else{
        newFile = {...files[id],body:value,isLoaded:true}
      }
      const newFiles= {...files,[id]:newFile}
      setFiles(newFiles)
      saveFilesToStore(newFiles)
    })
  }
  //改变loading状态
  const changeLoadingStatus = (event,message) => {
    setLoading(message)
  }
 
  //全部文件同步到七牛云后更新本地文件状态
  const filesUploaded = (event,message) => {
    const newFiles = objToArr(files).reduce((result,file)=>{
      const currentTime = new Date().getTime()
      result[file.id] = {
        ...files[file.id],
        isSynced:true,
        updatedAt:currentTime
      }
      return result
    },{})
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }

  useIpcRenderer({
    'create-new-file': createFiles,
    'import-file': importFiles,
    'save-edit-file': saveCurrentFile,
    'active-file-uploaded': activeFileUploaded,
    'file-downloaded':activeFileDownLoaded,
    'loading-status':changeLoadingStatus,
    'files-uploaded':filesUploaded
  })

  //监听键盘事件
  useEffect(() => {
    if (leftArrowPressed && openFiles.length > 0 && activeFileIndex !== 0) {
      activeFileIndexDecreased(activeFileId)
    }
    if (rightArrowPressed && openFiles.length > 0 && activeFileIndex < openFiles.length) {
      activeFileIndexIncreased(activeFileId)
    }
  })

  return (
    <div className="App container-fluid px-0">
      {loading && 
        <Loader></Loader>
      }
      <div className="row no-gutters">
        <div className="col-3 left-panel">
          <FileSearch title="我的云文档" onFileSearch={fileSearch}></FileSearch>
          <FileList
            files={filesArr}
            onFileClick={fileClick}
            onFileDelete={deleteFile}
            onSaveEdit={updateFileName}
          >
          </FileList>
          <div className="row no-gutters button-group no-border mb-0">
            <div className="col mb-0">
              <BottomBtn
                text="新建"
                colorClass="btn-primary"
                icon={faPlus}
                onBtnClick={createFiles}
              >
              </BottomBtn>
            </div>
            <div className="col mb-0">
              <BottomBtn
                text="导入"
                colorClass="btn-success"
                icon={faFileImport}
                onBtnClick={importFiles}
              >
              </BottomBtn>
            </div>
          </div>
        </div>
        <div className="col-9  right-panel">
          {!activeFile &&
            <div className="start-page">
              <span className="start-page-word">选择或者新建markdown文档</span>
            </div>
          }
          {activeFile &&
            <>
              <div className="tab-list">
                <TabList
                  files={openFiles}
                  onTabClick={tabClick}
                  activeId={activeFileId}
                  onCloseTab={tabClose}
                  unSaveIds={unSaveFileIds}
                  onTabIndexDecreased={activeFileIndexDecreased}
                  onTabIndexIncreased={activeFileIndexIncreased}
                ></TabList>
              </div>
              <div className="editor-container">
                <ReactQuill
                  theme="snow"
                  value={activeFile && activeFile.body || ''}
                  onChange={(value) => fileChange(activeFile.id, value)}
                  key={activeFile && activeFileId}
                />
              </div>
              {activeFile.isSynced &&
                <div className='sync-status'>
                  <span >已经同步，上次同步时间为{timeStampToString(activeFile.updatedAt)}</span>
                </div>
              }
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
