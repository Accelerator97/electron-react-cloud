const qiniu = require('qiniu')
const QiniuManager = require('./src/utils/qiniuManager')
const path = require('path')

//生成鉴权对象
var accessKey = 'MueDKdq4GWBggPK4gY6fC1psZV_lEdCip8TpHehY';
var secretKey = 'QKf6I-HNU6Efg2ZyzNx9Fu4sxjzrwvfUdI0Nqp6x';
var mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

var localFile = 'C:/Users/Administrator/Documents/7.md'
var key = '9.md'
var downLoadPath = path.join(__dirname,key)

const publicBucketDomain = 'http://r5hvoqzzo.hd-bkt.clouddn.com'

const manager = new QiniuManager(accessKey,secretKey,'react-cloud')
// manager.upLoadFile(key,localFile).then((data)=>{
//     console.log('上传成功',data)
//     return manager.generateDownLoadLink(key)
// }).then(()=>{
//     return manager.generateDownLoadLink(key)
// }).then(data=>{
//     console.log(data)
// })
// manager.getBucketDomain().then(data=>{
//     console.log(data)
// })
manager.downLoadFile(key,downLoadPath).catch(err=>{
    console.log(err)
})
