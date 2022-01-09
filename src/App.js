import React, { useCallback, useState, useMemo } from 'react';
import './App.scss';
import 'bootstrap/dist/css/bootstrap.min.css'
import "easymde/dist/easymde.min.css";
import { faPlus, faFileImport, faSave } from '@fortawesome/free-solid-svg-icons'
import SimpleMDE from "react-simplemde-editor";
import { v4 as uuidv4 } from 'uuid';
import { flattenArr, objToArr } from './utils/helper'
import { fileHelper } from './utils/fileHelper'

import FileSearch from './components/FileSearch'
import FileList from './components/FileList';
import defaultFiles from './utils/defaultFiles';
import BottomBtn from './components/BottomBtn';
import TabList from './components/TabList';

const path = window.require('path')
const { remote } = window.require('electron')
//electron-store
const Store = window.require('electron-store')
const fileStore = new Store({'name':'Files Data'})

//只有当新建，删除，重命名的时候才进行持久化操作
const saveFilesToStore = (files)=>{
  //不用把files的所有信息存储到store，只需要id,path,title,createdAt
  const filesStoreObj = objToArr(files).reduce((result,file)=>{
    const {id,path,title,createdAt} = file
    result[id] = {
      id,
      path,
      title,
      createdAt
    }
    return result
  },{})
  fileStore.set('files',filesStoreObj)
}


function App() {
  //根据defaultFiles生成默认的files数组
  const [files, setFiles] = useState(flattenArr(defaultFiles))
  //当前激活文件的id,数量只为一个
  const [activeFileId, setActiveFileId] = useState('')
  //已打开文件的id构成的数组
  const [openFileIds, setOpenFileIds] = useState([])
  //未保存文件的id构成的数组
  const [unSaveFileIds, setUnSaveFileIds] = useState([])
  //搜索文件形成的数组
  const [searchFiles, setSearchFiles] = useState([])

  //还得把files从obj转为数组
  const filesObjtoArr = objToArr(files)

  //根据openId生成已经打开的文件组成的数组
  const openFiles = openFileIds.map(openId => {
    return files[openId]
  })
  //当前激活的的文件
  const activeFile = files[activeFileId]
  //如果记录搜索文件的数组有内容就用这个数组，否则就用filesObjtoArr
  const filesArr = (searchFiles.length > 0) ? searchFiles : filesObjtoArr

  //通过remote模块从electron的主进程拿到getPath API  即文件存放的地方
  const savedLocation = remote.app.getPath('documents')


  const fileClick = (fileId) => {
    setActiveFileId(fileId)
    //先判断openFileId是否包括fileId，然后tab打开file
    if (!openFileIds.includes(fileId)) {
      setOpenFileIds([...openFileIds, fileId])
    }
  }

  const tabClick = (fileId) => {
    setActiveFileId(fileId)
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
  const fileChange = useCallback((id, value) => {
    // const newFiles = files.map(file => {
    //   if (file.id === id) {
    //     file.body = value
    //   }
    //   return file
    // })
    //不要直接通过files[id].body =value 修改files 要通过setFiles修改
    const newFiles = { ...files[id], body: value }
    setFiles({ ...files, [id]: newFiles })
    //更新unSaveFileId
    if (!unSaveFileIds.includes(id)) {
      setUnSaveFileIds([...unSaveFileIds, id])
    }
  }, [])
  //解决bug:当输入一个字符后，不会自动获取焦点
  const autofocusNoSpellcheckerOptions = useMemo(() => {
    return {
      autofocus: true,
      spellChecker: false,
    };
  }, []);


  const deleteFile = (id) => {
    // const newFiles = files.filter(file => file.id !== id)
    // setFiles(newFiles)
    fileHelper.deleteFile(path.join(savedLocation, `${files[id].title}.md`)
    ).then(() => {
      delete files[id]
      setFiles(files)
      //如果file已经在tab打开 
      tabClose(id)
    })
  }

  const updateFileName = (id, title, isNew) => {
    // const newFiles = files.map(file => {
    //   if (file.id === id) {
    //     file.title = title
    //     //要重置isNew 不然input框一直显示
    //     file.isNew =false
    //   }
    //   return file
    // })
    const modifiledFile = { ...files[id], title, isNew: false }
    //如果是新建立的文件
    if (isNew) {
      fileHelper.writeFile(path.join(savedLocation, `${title}.md`), files[id].body).then(() => {
        setFiles({ ...files, [id]: modifiledFile })
      })
    } else { //对已有的文件重命名
      fileHelper.renameFile(path.join(savedLocation, `${files[id].title}.md`), path.join(savedLocation, `${title}.md`)
      ).then(() => {
        setFiles({ ...files, [id]: modifiledFile })
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

  const saveCurrentFile = () => {
    fileHelper.writeFile(path.join(savedLocation, `${activeFile.title}.md`), activeFile.body
    ).then(() => {
      setUnSaveFileIds(unSaveFileIds.filter(id => id !== activeFile.id))
    })

  }
  return (
    <div className="App container-fluid px-0">
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
          <div className="row no-gutters button-group no-border">
            <div className="col">
              <BottomBtn
                text="新建"
                colorClass="btn-primary"
                icon={faPlus}
                onBtnClick={createFiles}
              >
              </BottomBtn>
            </div>
            <div className="col">
              <BottomBtn
                text="导入"
                colorClass="btn-success"
                icon={faFileImport}
              >
              </BottomBtn>
            </div>
          </div>
        </div>
        <div className="col-9  right-panel">
          {!activeFile &&
            <div className='start-page'>
              选择或者新建markdown文档
            </div>
          }
          {activeFile &&
            <>
              <TabList
                files={openFiles}
                onTabClick={tabClick}
                activeId={activeFileId}
                onCloseTab={tabClose}
                unSaveIds={unSaveFileIds}
              ></TabList>
              <SimpleMDE
                value={activeFile && activeFile.body}
                onChange={(value) => fileChange(activeFile.id, value)}
                options={{ minHeight: '515px', ...autofocusNoSpellcheckerOptions }}
                key={activeFile && activeFile.id}
              />
              <BottomBtn
                text="保存"
                colorClass="btn-success"
                icon={faSave}
                onBtnClick={saveCurrentFile}
              >
              </BottomBtn>
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
