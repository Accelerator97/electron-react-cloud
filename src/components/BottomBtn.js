import React from 'react'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const BottomBtn = ({text,colorClass,icon,onBtnClick}) =>{
    return (
        <button
           type="button"
           className={`btn btn-block no-border ${colorClass} h-100` }
           onClick={onBtnClick}
        >
            <FontAwesomeIcon
               className="mr-2"
               icon={icon}
            >   
            </FontAwesomeIcon>
            {text}
        </button>
    )
}
BottomBtn.propTypes ={
    text:PropTypes.string,
    colorClass:PropTypes.string,
    icon:PropTypes.object.isRequired,
    onBtnClick:PropTypes.func
}

export default BottomBtn