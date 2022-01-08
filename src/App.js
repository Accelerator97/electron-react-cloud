import React, { useState } from 'react';
import './App.scss';
import 'bootstrap/dist/css/bootstrap.min.css'
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons'
import FileSearch from './components/FileSearch'
import FileList from './components/FileList';
import defaultFiles from './utils/defaultFiles';
import BottomBtn from './components/BottomBtn';
import TabList from './components/TabList';
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import { v4 as uuidv4 } from 'uuid';




function App() {
  const [files, setFiles] = useState(defaultFiles)
  //当前激活文件的id,数量只为一个
  const [activeFileId, setActiveFileId] = useState('')
  //已打开文件的id构成的数组
  const [openFileIds, setOpenFileIds] = useState([])
  //未保存文件的id构成的数组
  const [unSaveFileIds, setUnSaveFileIds] = useState([])
  //搜索文件形成的数组
  const [searchFiles, setSearchFiles] = useState([])


  //根据openId生成已经打开的文件组成的数组
  const openFiles = openFileIds.map(openId => {
    return files.find(file => file.id === openId) //通过find方法 匹配file.id === openId 然后返回一个数组
  })
  //当前激活的的文件
  const activeFile = files.find(file => file.id === activeFileId)
  //如果记录搜索文件的数组有内容就用这个数组，否则就用files
  const filesArr = (searchFiles.length > 0) ? searchFiles : files

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
  //做两件事情 1.更新file的body 但是这时不要setState 不然有bug 不能自动获取焦点 2.显示未保存的小红点
  const fileChange = (id, value) => {
    files.map(file => {
      if (file.id === id) {
        file.body = value
      }
      return file
    })
    //更新unSaveFileId
    if (!unSaveFileIds.includes(id)) {
      setUnSaveFileIds([...unSaveFileIds, id])
    }
  }

  const deleteFile = (id) => {
    const newFiles = files.filter(file => file.id !== id)
    setFiles(newFiles)
    //如果file已经在tab打开 
    tabClose(id)
  }

  const updateFileName = (id, title) => {
    const newFiles = files.map(file => {
      if (file.id === id) {
        file.title = title
        //要重置isNew 不然input框一直显示
        file.isNew =false
      }
      return file
    })
    setFiles(newFiles)
  }

  const fileSearch = (keyword) => {
    //字符串和数组都有include方法
    const newFiles = files.filter(file => file.title.includes(keyword))
    //因为更新的是files,所以其他依赖files的地方也会变化，比如说文件已经在tab打开了，search完之后就会清空tab
    //所以要创造一个新的数组，记录搜索文件
    setSearchFiles(newFiles)
  }

  //点击新建文件按钮，创造文件
  const createFiles = () => {
    const newId = uuidv4()
    const newFiles = [
      ...files,
      {
        id: newId,
        title: '',
        body: '##请输入markdown',
        createdAt: new Date().getTime(),
        //控制是否直接显示input框
        isNew: true
      }
    ]
    setFiles(newFiles)
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
                options={{ minHeight: '515px' }}
                key={activeFile && activeFile.id}
              />
              {activeFile.body}
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
