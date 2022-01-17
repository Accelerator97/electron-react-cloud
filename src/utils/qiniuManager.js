const qiniu = require('qiniu')
const axios = require('axios')
const fs = require('fs');
const { resolve } = require('path');

class QiniuManager {
    constructor(accessKey, secretKey, bucket) {
        //生成鉴权对象
        this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
        this.bucket = bucket
        //配置类
        this.config = new qiniu.conf.Config();
        // 空间对应的机房
        this.config.zone = qiniu.zone.Zone_z0; //华东
        this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);

    }
    //上传文件，key是要上传的文件 
    upLoadFile(key, localFilePath) {
        //简单的上传凭证
        var options = {
            scope: this.bucket + ':' + key, //储存空间的名称
        };
        var putPolicy = new qiniu.rs.PutPolicy(options);
        var uploadToken = putPolicy.uploadToken(this.mac);

        var formUploader = new qiniu.form_up.FormUploader(this.config);
        var putExtra = new qiniu.form_up.PutExtra();

        return new Promise((resolve, reject) => {
            formUploader.putFile(uploadToken, key, localFilePath, putExtra, this._handleCallback(resolve, reject));
        })
    }
    //删除云空间中的文件
    deleteFile(key) {
        return new Promise((resolve, reject) => {
            this.bucketManager.delete(this.bucket, key, this._handleCallback(resolve, reject));
        })
    }
    //更新文件名
    updateName(key){
        //强制覆盖已有同名文件
        var options = {
            force: true
          }
        return new Promise((resolve,reject)=>{
            this.bucketManager.move(this.bucket,key.oldName,this.bucket,key.newName,options,this._handleCallback(resolve,reject))
        })
    }
    getBucketDomain() {
        const reqURL = `http://uc.qbox.me/v2/domains?tbl=${this.bucket}`
        const token = qiniu.util.generateAccessToken(this.mac, reqURL)
        console.log('1')
        return new Promise((resolve, reject) => {
            qiniu.rpc.postWithoutForm(reqURL, token, this._handleCallback(resolve, reject))
        })
    }
    async generateDownLoadLink(key) {
        //缓存URL 避免每次生成下载地址都要发起请求
        const domainPromise = this.publicBucketDomain ? Promise.resolve([this.publicBucketDomain]) : this.getBucketDomain()
        const data = await domainPromise;
        if (Array.isArray(data) && data.length > 0) {
            //判断是否已经加上http前缀
            const pattern = /^http?/;
            this.publicBucketDomain = pattern.test(data[0]) ? data[0] : `http://${data[0]}`;
            return this.bucketManager.publicDownloadUrl(this.publicBucketDomain, key);
        } else {
            throw Error('域名未找到，请查看储存空间是否过期');
        }
    }
    downLoadFile(key, downloadPath) {
        //1.获取下载链接
        //2.向下载链接发送请求，返回一个可读流
        //3.创造一个可写流，可读流通过pipe方法写入到可写流中
        //4.返回一个promise
        return this.generateDownLoadLink(key).then(link => {
            const timeStamp = new Date().getTime() //避免URL被缓存
            const url = `${link}?timeStamp=${timeStamp}`
            return axios({
                url,
                method: 'GET',
                responseType: 'stream',
                headers: { 'Cache-Control': 'no-cache' }
            }).then(res => {
                const writer = fs.createWriteStream(downloadPath)
                res.data.pipe(writer)
                return new Promise((resolve, reject) => {
                    writer.on('finish', resolve)
                    writer.on('error', reject)
                })
            })
        }).catch(err => {//整个链条最后捕获axios错误
            return Promise.reject({ err: err.response })
        })
    }
    getStat(key){
        return new Promise((resolve,reject)=>{
            this.bucketManager.stat(this.bucket,key,this._handleCallback(resolve,reject))
        })
    }
    //接受两个参数(resolve,reject)，然后返回接受三个参数的函数，这个函数可以调用resolve和reject
    _handleCallback(resolve, reject) {
        return (err, respBody, respInfo) => {
            if (err) {
                throw err;
            }
            if (respInfo.statusCode == 200) {
                resolve(respBody)
            } else {
                reject({
                    statusCode: respInfo.statusCode,
                    body: respBody

                })
            }
        }
    }
}

module.exports = QiniuManager