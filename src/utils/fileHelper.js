const fs = window.require('fs').promises

export const fileHelper = {
    readFile:(path) => {
        //第一个参数文件路径，第二个参数是options，第三个参数是callback
        return fs.readFile(path,{encoding:'utf8'})
    },
    writeFile:(path,content)=>{
         //第一个参数文件路径，第二个参数是内容，第三个参数是options，第四个参数是callback
        return fs.writeFile(path,content,{encoding:'utf8'})
    },
    //重命名文件
    renameFile:(path,newPath) =>{
        return fs.rename(path,newPath)
    },
    deleteFile:(path)=>{
        return fs.unlink(path)
    }
}
//path.join 第一个参数是文件目录的路径，第二个参数是文件名
// const testPath = path.join(__dirname,'helper.js')
// const testWritePath = path.join(__dirname,'hello.md')
// const renamePath = path.join(__dirname,'hello2.md')
// fileHelper.readFile(testPath).then((data)=>{
//     console.log(data)
// })

// fileHelper.writeFile(testWritePath,'## hello world').then(()=>{console.log('写入成功')})
// fileHelper.renameFile(testWritePath,renamePath)
// fileHelper.deleteFile(renamePath).then(()=>{console.log('删除成功')})
