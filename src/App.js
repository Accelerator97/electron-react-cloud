import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import {faPlus,faFileImport} from '@fortawesome/free-solid-svg-icons'
import FileSearch from './components/FileSearch'
import FileList from './components/FileList';
import defaultFiles from './utils/defaultFiles';
import BottomBtn from './components/BottomBtn'; 

function App() {
  return (
    <div className="App container-fluid px-0">
      <div className="row no-gutters">
        <div className="col left-panel">
          <FileSearch title="我的云文档" onFileSearch={(value) => { console.log(value) }}></FileSearch>
          <FileList 
             files={defaultFiles} 
             onFileClick={(id) => { console.log(id) }} 
             onFileDelete={(id) => { console.log('delete', id) }}
             onSaveEdit={(id,newValue)=>{console.log(id,newValue)}}
          >
          </FileList>
          <div className="row no-gutters">
            <div className="col">
              <BottomBtn text="新建" colorClass="btn-primary" icon={faPlus}></BottomBtn>
            </div>
            <div className="col">
              <BottomBtn text="导入" colorClass="btn-success" icon={faFileImport}></BottomBtn>
            </div>
          </div>
        </div>
        <div className="col bg-primary right-panel">
          <h1>this is a panel</h1>
        </div>
      </div>
    </div>
  );
}

export default App;
