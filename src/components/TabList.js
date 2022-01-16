import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import './TabList.scss'

const TabList = ({ files, activeId, unSaveIds, onTabClick, onCloseTab }) => {
    return (
        <ul className='nav nav-pills tablist-wrapper'>
            {
                files.map(file => {
                    //unSaveIds是一个字符串数组,用来存储未保存的文章id
                    const withUnsavemMark = unSaveIds.includes(file.id)
                    const finalClassNames = classNames({
                        'nav-link': true,
                        'active': file.id === activeId,
                        'withUnsave': withUnsavemMark
                    })
                    return (
                        <li className='nav-item' key={file.id} >
                            <a href="#"
                                className={finalClassNames}
                                onClick={(e) => { e.preventDefault(); onTabClick(file.id) }}
                            >
                                {file.title}
                                {/* 阻止冒泡,不然会触发a标签上的点击事件 */}
                                <span
                                    className='ml-2 close-icon'
                                    onClick={(e) => { e.stopPropagation(); onCloseTab(file.id) }}
                                >
                                    <FontAwesomeIcon icon={faTimes}></FontAwesomeIcon>
                                </span>
                                {/* 未保存文件时显示的小红点 */}
                                {withUnsavemMark &&
                                    <span className='rounded-circle unsaved-icon ml-2'></span>
                                }
                            </a>
                        </li>
                    )
                })
            }
        </ul>
    )
}
TabList.propTypes = {
    files: PropTypes.array,
    activeId: PropTypes.string,
    unSaveId: PropTypes.array,
    onTabClick: PropTypes.func,
    onCloseTab: PropTypes.func
}
TabList.defaultProps = {
    unSaveId: []
}
export default TabList