import React, { useEffect, useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'

//onFileSearch是按下回车键触发搜索的回调函数
const FileSearch = ({ title, onFileSearch }) => {
    const [inputActive, setInputActive] = useState(false)
    const [value, setValue] = useState('')
    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)
    const node = useRef(null)
    const closeSearch = () => {
        setInputActive(false)
        setValue('')
    }
    //监听键盘回车和esc按下
    useEffect(() => {
        if(enterPressed && inputActive){
            onFileSearch(value)
        }
        if(escPressed && inputActive){
            closeSearch()
        }
        // const handleInputEvent = (event) => {
        //     const { keyCode } = event
        //     if (keyCode === 13 && inputActive) { //点击搜索之后，展示input框，按下回车，调用回调函数onFileSearch
        //         onFileSearch(value)
        //     } else if (keyCode === 27 && inputActive) { //按下esc,清空输入内容，重置InputActive状态
        //         closeSearch(event)
        //     }
        // }
        // document.addEventListener('keyup', handleInputEvent) //注册监听事件
        // return () => {
        //     document.removeEventListener('keyup', handleInputEvent) //有注册就要有移除
        // }
    })
    //自动获取焦点
    useEffect(() => {
        if (inputActive) {
            node.current.focus()
        }
    }, [inputActive])
    return (
        <div className='alert alert-primary d-flex justify-content-between align-items-center mb-0'>
            {!inputActive &&
                <>
                    <span className='col-8' style={{ height: "38px" ,lineHeight:"38px" }}>{title}</span>
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
