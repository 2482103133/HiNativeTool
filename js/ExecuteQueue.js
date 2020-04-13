//该锁用于限制某方法执行的时间间隔
//handler执行的方法
//interval 执行的最小时间间隔
//immediate是否在调用Request的时候立即执行一次
$.IntervalLocker = function (interval) {
    this.queue=[]
}

$.IntervalLocker.prototype = {
    Stop: function () { this.timer.Stop() },
    Start: function () {
        // this.timer.Start()
    }
    , Func: function (args) {
        // .apply(this,)
        this.handler.apply(this,args);
        this.last_time = new Date().getTime()

    },
    //请求一次
    Request: function (...args) {
        
        var args=args
        var now = new Date().getTime()
        var lag = now - this.last_time
        var that = this
        // console.log("request,lag:"+lag +"this.is_waiting:"+this.is_waiting)
        if (this.is_waiting)
            return true
       

        if (lag >= this.Interval) {
            // console.log("immediate")
            this.last_time = now
            this.Func(args)
            this.is_waiting = false
        }
         //如果是立即模式,则直接判断间隔是否大于要求间隔,而且对失败的request忽略
        else if(this.immediate!=true){
            this.is_waiting = true
           
            //将失败的request用waiting挂起来
            setTimeout(function () {
                // console.log("timeout")
                
                that.Func(args)
                that.last_time = new Date().getTime()    
                that.is_waiting = false
            }, this.Interval - lag)
        }
       
    }
}

$.IntervalLocker.prototype.constructor = $.IntervalLocker