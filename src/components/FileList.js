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
    const closeInput = () => {
        setEditStatus(false)
        setValue('')
    }
    useEffect(() => {
        if(enterPressed && editStatus){
            const editItem = files.find(file => file.id === editStatus)
            onSaveEdit(editItem.id, value)
            closeInput()
        }else if(escPressed && editStatus){
            closeInput()
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
                            {(file.id !== editStatus) &&
                                // 遇到报错要用<></>包裹起来
                                <>
                                    <span className='col-2'>
                                        <FontAwesomeIcon icon={faMarkdown} size="lg"></FontAwesomeIcon>
                                    </span>
                                    <span className='col-8 c-link' onClick={() => { onFileClick(file.id) }}>{file.title}</span>
                                    <button type="button" className='icon-button col-1 ' onClick={() => { setEditStatus(file.id); setValue(file.title) }}>
                                        <FontAwesomeIcon icon={faEdit} size="lg"></FontAwesomeIcon>
                                    </button>
                                    <button type="button" className='icon-button col-1' onClick={() => { onFileDelete(file.id) }}>
                                        <FontAwesomeIcon icon={faTrash} size="lg"></FontAwesomeIcon>
                                    </button>
                                </>
                            }
                            {
                                (file.id === editStatus) &&
                                <>
                                    <input className='form-control col-10' value={value} onChange={e => { setValue(e.target.value) }} />
                                    <button type="button" className='icon-button col-2' onClick={closeInput}>
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

