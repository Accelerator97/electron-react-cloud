import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import FileSearch from './components/FileSearch'

function App() {
  return (
    <div className="App container-fluid px-0">
        <div className="row">
           <div className="col left-panel">
             <FileSearch title="我的云文档" onFileSearch={(value)=>{console.log(value)}}></FileSearch>
           </div>
           <div className="col bg-primary right-panel">
             <h1>this is a panel</h1>
           </div>
        </div>
    </div>
  );
}

export default App;
