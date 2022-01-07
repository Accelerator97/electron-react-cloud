import React from 'react'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const BottomBtn = ({text,colorClass,icon,onBtnClick}) =>{
    return (
        <button
           type="button"
           className={`btn btn-block no-border ${colorClass}`}
           onClick={onBtnClick}
        >
            <FontAwesomeIcon
               className="mr-2"
               size="lg"
               icon={icon}
            >   
            </FontAwesomeIcon>
            {text}
        </button>
    )
}
BottomBtn.prototype ={
    text:PropTypes.string,
    colorClass:PropTypes.string,
    icon:PropTypes.element.isRequired,
    onBtnClick:PropTypes.func
}

export default BottomBtn