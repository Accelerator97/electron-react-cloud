import React, { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons'
import { faMarkdown } from '@fortawesome/free-brands-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'


const FileList = ({ files, onFileClick, onSaveEdit, onFileDelete }) => {
    //数组形式，传入编辑文章的id
    const [editStatus, setEditStatus] = useState(false)
    //编辑文章的title
    const [value, setValue] = useState('')
    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)
    const closeInput = (editItem) => {
        setEditStatus(false)
        setValue('')
        //加入编辑的文章有isNew属性，说明是新建的
        if(editItem.isNew){
            onFileDelete(editItem.id)
        }

    }
    //新建文件之后，要改变editStatus 和value，所以用到useEffect钩子
    useEffect(() => {
        const newFile = files.find(file => file.isNew)
        if(newFile){
            setEditStatus(newFile.id)
            setValue(newFile.title)
        }
    }, [files])
    useEffect(() => {
        const editItem = files.find(file => file.id === editStatus)
        if (enterPressed && editStatus && value.trim() !== '') {
            //保存之后重置状态
            onSaveEdit(editItem.id, value)
            setEditStatus(false)
            setValue('')
        } 
        if (escPressed && editStatus) {
            //关闭input框
            closeInput(editItem)
        }

        // const handleInputEvent = (e) => {
        //     const { keyCode } = e
        //     if (keyCode === 13 && editStatus) {//按下回车键
        //         const editItem = files.find(file => file.id === editStatus)
        //         onSaveEdit(editItem.id, value)
        //         setEditStatus(false)
        //         setValue('')
        //     } else if (keyCode === 27 && editStatus) {
        //         closeInput()
        //     }
        // }
        // document.addEventListener('keyup', handleInputEvent)
        // return () => {
        //     document.removeEventListener('keyup', handleInputEvent)
        // }
    })
    return (
        <ul className="list-group list-group-flush file-list" >
            {
                files.map((file) => {
                    return (
                        <li className="list-group-item bg-light d-flex  align-items-center file-item row no-gutters" key={file.id}>
                            {((file.id !== editStatus) && !file.isNew) &&
                                // 遇到报错要用<></>包裹起来
                                <>
                                    <span className='col-2'>
                                        <FontAwesomeIcon icon={faMarkdown} size="lg"></FontAwesomeIcon>
                                    </span>
                                    <span className='col-8 c-link' onClick={() => { onFileClick(file.id) }}>{file.title}</span>
                                    <button 
                                       type="button" 
                                       className='icon-button col-1 ' 
                                       onClick={() => { setEditStatus(file.id); setValue(file.title) }}
                                    >
                                        <FontAwesomeIcon icon={faEdit} size="lg"></FontAwesomeIcon>
                                    </button>
                                    <button 
                                       type="button" 
                                       className='icon-button col-1' 
                                       onClick={() => { onFileDelete(file.id) }}
                                    >
                                        <FontAwesomeIcon icon={faTrash} size="lg"></FontAwesomeIcon>
                                    </button>
                                </>
                            }
                            {
                                ((file.id === editStatus) || file.isNew) &&
                                <>
                                    <input 
                                      className='form-control col-10' 
                                      value={value} onChange={e => { setValue(e.target.value) }} placeholder="请输入文件名称"
                                    />
                                    <button type="button" className='icon-button col-2' onClick={()=>{closeInput(file)}}>
                                        <FontAwesomeIcon icon={faTimes} size="lg"></FontAwesomeIcon>
                                    </button>
                                </>
                            }
                        </li>
                    )

                })
            }
        </ul>
    )
}

FileList.propTypes = {
    files: PropTypes.array,
    onFileClick: PropTypes.func,
    onFileDelete: PropTypes.func,
    onSaveEdit: PropTypes.func,
}

export default FileList

