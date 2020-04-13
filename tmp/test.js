

let request_queue=[]
//每秒一次请求
setInterval(function(){
    if(request_queue.length>0)
    {
    console.log("do")
    }
},1000)

function request_get(url, callback, async = true) {
    
}