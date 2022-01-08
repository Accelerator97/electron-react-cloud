import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import './TabList.scss'

const TabList = ({ files, activeId, unSaveId, onTabClick, onCloseTab }) => {
    return (
        <ul className='nav nav-pills tablist-component'>
            {
                files.map(file => {
                    const finalClassNames = classNames({
                        'nav-link': true,
                        'active': file.id === activeId
                    })
                    return (
                        <li className='nav-item' key={file.id} >
                            <a href="#"
                                className={finalClassNames}
                                onClick={(e) => { e.preventDefault(); onTabClick(file.id) }}
                            >
                                {file.title}
                                <span className='ml-2 close-icon' onClick={(e)=>{e.stopPropagation();onCloseTab(file.id)}}>
                                    <FontAwesomeIcon icon={faTimes} size="lg"></FontAwesomeIcon>
                                </span>
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