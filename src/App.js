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



function App() {
  const [files, setFiles] = useState(defaultFiles)
  //当前激活文件的id
  const [activeFileId, setActiveFileId] = useState('')
  //已打开文件的id构成的数组
  const [openFileIds, setOpenFileIds] = useState([])
  //未保存文件的id构成的数组
  const [unSaveFileIds, setUnSaveFileIds] = useState([])

  //已经打开的文件组成的数据
  const openFiles = openFileIds.map(openId => {
    return files.find(file => file.id === openId) //通过find方法 匹配file.id === openId 然后返回一个数组
  })
  //当前激活的的文件
  const activeFile = files.find(file => file.id === activeFileId)

  return (
    <div className="App container-fluid px-0">
      <div className="row no-gutters">
        <div className="col-3 left-panel">
          <FileSearch title="我的云文档" onFileSearch={(value) => { console.log(value) }}></FileSearch>
          <FileList
            files={defaultFiles}
            onFileClick={(id) => { console.log(id) }}
            onFileDelete={(id) => { console.log('delete', id) }}
            onSaveEdit={(id, newValue) => { console.log(id, newValue) }}
          >
          </FileList>
          <div className="row no-gutters button-group no-border">
            <div className="col">
              <BottomBtn text="新建" colorClass="btn-primary" icon={faPlus}></BottomBtn>
            </div>
            <div className="col">
              <BottomBtn text="导入" colorClass="btn-success" icon={faFileImport}></BottomBtn>
            </div>
          </div>
        </div>
        <div className="col-9  right-panel">
          {!activeFile &&
            <div className='start-page'>
              选择或者新建markdown文档
            </div>
          }
          { activeFile &&
            <>
              <TabList files={openFiles} onTabClick={(id) => { console.log(id) }} activeId={activeFileId} onCloseTab={id => console.log('closetab', id)} unSaveIds={unSaveFileIds}></TabList>
              <SimpleMDE value={activeFile && activeFile.body} onChange={(value) => { console.log(value) }} options={{ minHeight: '515px' }} />
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
