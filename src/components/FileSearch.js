import React, { useEffect, useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'
import useIpcRenderer from '../hooks/useIpcRender'

//onFileSearch是按下回车键触发搜索的回调函数
const FileSearch = ({ title, onFileSearch }) => {
    const [inputActive, setInputActive] = useState(false)
    const [value, setValue] = useState('')
    const enterPressed = useKeyPress(13) //回车键
    const escPressed = useKeyPress(27) //esc键位
    const node = useRef(null)
    const startSearch = () => {
        setInputActive(true)
    }
    const closeSearch = () => {
        setInputActive(false)
        setValue('')
        //点击关闭按钮，重置List，展示全部文档 
        onFileSearch(false)
    }
    //监听键盘回车和esc按下
    useEffect(() => {
        if(enterPressed && inputActive){
            onFileSearch(value)
        }
        if(escPressed && inputActive){
            closeSearch()
        }
    })
    //自动获取焦点
    useEffect(() => {
        if (inputActive) {
            node.current.focus()
        }
    }, [inputActive])
    useIpcRenderer({
        'search-file':startSearch
    })
    return (
        <div className='alert alert-primary d-flex justify-content-between align-items-center mb-0 file-search'>
            {!inputActive &&
                <>
                    <span className='col-8' style={{ height: "35px" ,lineHeight:"35px" }}>{title}</span>
                    <button type="button" className='icon-button' onClick={() => { setInputActive(true) }}>
                        <FontAwesomeIcon title="搜索" icon={faSearch} size="lg"></FontAwesomeIcon>
                    </button>
                </>
            }
            {
                inputActive &&
                <>
                    <input className='form-control' value={value} onChange={e => { setValue(e.target.value) } }  ref={node} />
                    <button type="button" className='icon-button' onClick={closeSearch}>
                        <FontAwesomeIcon title="搜索" icon={faTimes} size="lg"></FontAwesomeIcon>
                    </button>
                </>
            }
        </div>
    )
}


//类型检查
FileSearch.propTypes = {
    title: PropTypes.string,
    onFileSearch: PropTypes.func.isRequired,
}

FileSearch.defaultProps = {
    title: '我的云文档'
}

export default FileSearch
