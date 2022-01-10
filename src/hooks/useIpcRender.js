import { useEffect } from 'react'
const { ipcRenderer } = window.require('electron')

//const obj  = {
//     'create':()=>{},
//     'remove':()=>{}
// }
const useIpcRenderer = (keyCallbackMap) => {
    useEffect(() => {
        Object.keys(keyCallbackMap).forEach(key => {
            ipcRenderer.on(key, keyCallbackMap[key])
        })
        return () => {
            Object.keys(keyCallbackMap).forEach(key => {
                ipcRenderer.removeListener(key, keyCallbackMap[key])
            })
        }
    })
}

export default useIpcRenderer
