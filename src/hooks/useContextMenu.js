import { useEffect, useRef } from 'react'
const { remote } = window.require('electron')
const { Menu, MenuItem } = remote

const useContextMenu = (itemArr, targetSelector,dep) => {
    //向外暴露点击的元素
    let clickedElement = useRef(null)
    useEffect(() => {
        const menu = new Menu()
        itemArr.forEach(item => {
            menu.append(new MenuItem(item))
        })
        const handleContextMenu = (e) => {
            //只有在目标元素之内才显示上下文菜单
            if (document.querySelector(targetSelector).contains(e.target)) {
                clickedElement.current = e.target
                //在当前window弹出
                menu.popup({ window: remote.getCurrentWindow() })
            }
        }
        window.addEventListener('contextmenu', handleContextMenu)
        return () => {
            window.removeEventListener('contextmenu', handleContextMenu)
        }
    },dep)
    return clickedElement
}

export default useContextMenu