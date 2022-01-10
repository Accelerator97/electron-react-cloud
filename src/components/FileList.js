import React, { useContext, useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons'
import { faMarkdown } from '@fortawesome/free-brands-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'
import useContextMenu from '../hooks/useContextMenu'
import { getParentNode } from '../utils/helper'

//引入nodejs 
const { remote } = window.require('electron')
const { Menu, MenuItem } = remote

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
        if (editItem.isNew) {
            onFileDelete(editItem.id)
        }
    }
    //判断是否重名
    const isSameName = (newTitle) => {
        //现有title组成的数组
        let existedTitleArr = files.map(item => item.title)
        return existedTitleArr.indexOf(newTitle) >= 0 ? true : false
    }
    //上下文菜单
    const clickedItem = useContextMenu([
        {
            label: '打开',
            click: () => {
                const parentElement = getParentNode(clickedItem.current, 'file-item')
                if (parentElement) {
                    onFileClick(parentElement.dataset.id)
                }
            }
        },
        {
            label: '重命名',
            click: () => {
                const parentElement = getParentNode(clickedItem.current, 'file-item')
                if (parentElement) {
                    const { id, title } = parentElement.dataset
                    setEditStatus(id)
                    setValue(title)
                }
            }
        },
        {
            label: '删除',
            click: () => {
                const parentElement = getParentNode(clickedItem.current, 'file-item')
                if (parentElement) {
                    onFileDelete(parentElement.dataset.id)
                }
            }
        }
    ], '.file-list')
    //新建文件之后，要改变editStatus 和value，所以用到useEffect钩子
    useEffect(() => {
        const newFile = files.find(file => file.isNew)
        if (newFile) {
            setEditStatus(newFile.id)
            setValue(newFile.title)
        }
    }, [files])
    useEffect(() => {
        const editItem = files.find(file => file.id === editStatus)
        if (enterPressed && editStatus && value.trim() !== '') { //按下回车键保存
            if (isSameName(value) === false) {
                //保存之后重置状态 
                //加上isNew是为了区分是新建文件的命名还是对已有文件的重命名
                onSaveEdit(editItem.id, value, editItem.isNew)
                setEditStatus(false)
                setValue('')
            } else {
                remote.dialog.showMessageBox({
                    type: 'warning',
                    title: '重复命名',
                    message: '与已有文档名字重复',
                    button: ['确定']
                })
            }
        }
        if (escPressed && editStatus) {
            //关闭input框
            closeInput(editItem)
        }
    })
    return (
        <ul className="list-group list-group-flush file-list" >
            {
                files.map((file) => {
                    return (
                        <li
                            className="list-group-item bg-light d-flex  align-items-center file-item row no-gutters"
                            key={file.id}
                            data-id={file.id}
                            data-title={file.title}
                        >
                            {((file.id !== editStatus) && !file.isNew) &&
                                // 遇到报错要用<></>包裹起来
                                <>
                                    <span className='col-2'>
                                        <FontAwesomeIcon icon={faMarkdown} size="lg"></FontAwesomeIcon>
                                    </span>
                                    <span className='col-8 c-link' onClick={() => { onFileClick(file.id) }}>{file.title}</span>
                                </>
                            }
                            {
                                ((file.id === editStatus) || file.isNew) &&
                                <>
                                    <input
                                        className='form-control col-10'
                                        value={value}
                                        onChange={e => { setValue(e.target.value) }}
                                        placeholder="请输入文件名称"
                                    />
                                    <button type="button" className='icon-button col-2' onClick={() => { closeInput(file) }}>
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

