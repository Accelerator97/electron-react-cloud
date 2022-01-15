export default function debounce(fn,time,triggerNow){
  var t = null,
      res //fn执行的返回值

  var debounced =  function(){
    var _self = this,
        args = arguments
    if(t){
      clearTimeout(t)
    }
    if(triggerNow){ //第一次加载的时候不需要延迟执行，立即执行回调
      var exec = !t
      //在time的时间内进来，t为setTimeout的id,然后exec为false，不会执行fn，在time时间外进来，t=null,exec为true，执行fn
      t = setTimeout(() => { 
        t = null
      }, time);
      if(exec){ 
        res = fn.apply(_self,args)
      }
    }else{ //第一次加载需要延迟执行
      t = setTimeout(() => { 
        res = fn.apply(_self,args)
      }, time);
    }
    return res
  }

  //有防抖还要清除防抖
  debounced.remove = function(){
    clearTimeout(t)
    t = null
  }
  return debounced
}