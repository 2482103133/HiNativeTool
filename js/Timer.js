//可以变速的interval
$.Timer = function Timer(func,interval) {
    this.Handler=func;
    this.Interval=interval;
    this.__timeout=null
   
 }
$.Timer.prototype = {
    // Handler:function(){},
    // Interval:100,
    __is_stopping:false,
    SetInterval: function () {

    }, Start: function () {
        this.__is_stopping=false
        this.Proc()
    },Proc:function(){
        try{
            this.Handler.call(this)
        }catch(error)
        {
            alert(error)
        }
        //停止
        if(this.__is_stopping)
        {
            console.log("timer stopped")
            this.__is_stopping=false
            return
        }
        var that=this
        this.__timeout=setTimeout(function(){that.Proc()},this.Interval)
    },SetInterval:function(interval){
        this.Interval=interval
    },Stop:function(){

        this.__is_stopping=true
        clearTimeout(this.__timeout)
    }
}
$.Timer.prototype.constructor= $.Timer


