import {useState,useEffect} from 'react'
import debounce from '../utils/debounce'

const useKeyPress = (targetKeyCode)=>{
    const [keyPressed,setKeyPressed] = useState(false)//确认键盘是否被按下

    const keyDownHandler = (e) =>{
        if(e.keyCode === targetKeyCode){
            setKeyPressed(true)  //按下时设置为true
        } 
    }
    const keyUpHandler = (e) =>{
        if(e.keyCode === targetKeyCode){
            setKeyPressed(false) //弹起时设置为false
        }
    }
    useEffect(()=>{
        document.addEventListener('keydown',keyDownHandler)
        document.addEventListener('keyup',keyUpHandler)

        return ()=>{
            document.removeEventListener('keydown',keyDownHandler)
            document.removeEventListener('keyup',keyUpHandler)
        }
    },[])//在加载的时候监听，卸载的时候解除监听
    return keyPressed
}

export default useKeyPress
