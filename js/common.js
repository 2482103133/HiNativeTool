
window. TMStorage = function () {
}
//添加TM支持
TMStorage.prototype = {
  get: function (keys, callback) {
    let count = 0;
    let sum = keys.length
    let obj = {}

    for (let key of keys) {
      let key1 = key
      window. result = gm_get(key1)
      
      if (result == "undefined")
      {
        
        continue
      }
        
      else
      {
        
        obj[key1] = gm_get(key1)
      }
        
    }

    callback(obj)
  },
  set: function (obj1, callback) {
    let count = 0;
    let sum = Object.keys(obj1).length
    let obj = obj1
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        gm_set(key, value)
      }
    }
    if (typeof callback === "undefined")
      return
    else {
      callback(obj)
    }
  }
}
TMStorage.prototype.constructor = TMStorage

window. Mode = function () {
}

Mode.prototype = {
  Mode: null,
  Storage: null,
  OnInstalled: function (callback) { },
  OnPageUpdate: function (callback) { },
  ExecuteScript: function (script, callback) { },
  unsafeWindow:window
}
Mode.prototype.constructor = Mode

//添加TM支持
window. TMMode = function () {
  Mode.call(this)
  this.Mode = "TM"
  this.Storage = new TMStorage()
  this.unsafeWindow=unsafeWindow
  this.OnPageUpdated = function (callback) {
    callback.call(this)
  }
  this.ExecuteScript = function (obj, callback) {
   
    eval(obj.code)
    
    
    callback.call(this)
  }

}
TMMode.prototype = new Mode()
TMMode.prototype.constructor = new TMMode()

window. ExtensionMode = function () {
  Mode.call(this)
  this.Mode = "extension"
  this.Storage = chrome.storage.local
  this.OnPageUpdated = function (callback) {
    chrome.tabs.onUpdated.addListener(callback)
  }
  this.OnInstalled = function (callback) {
    chrome.runtime.onInstalled.addListener(callback)
  }
  this.ExecuteScript = function (script, callback) {
    chrome.tabs.executeScript(script, callback)
  }
}
ExtensionMode.prototype = new Mode()
ExtensionMode.prototype.constructor = ExtensionMode

window. mode = new TMMode()
window. storage = mode.Storage

function log(obj) {
  if (show_log)
      console.log(obj)
}


//执行一个字典里所有的脚本，并在所有脚本都执行完后调用resolve
function preload(dict) {
  let len = Object.keys(dict).length
  let count = 0;
  return new Promise(resolve=>{
    for (let key in dict) {
      if (dict.hasOwnProperty(key)) {
        let val = dict[key];
        let key1 = key
         add_script_value(key1, val).then(function () {
          if (++count == len) {
            resolve()
          }
        })
      }
    }
  })
}

//添加一个页面变量值，如果不存在则创建并设置默认值
function add_script_value(key1, dflt1) {
  let key = key1
  let dflt = dflt1
  return new Promise(resolve => {
    storage.get([key], function (result) {
      
      if (typeof result[key] === "undefined") {
        let obj = {}
        obj[key] = dflt
        result[key] = dflt
        // log("undefined key:"+key)
        storage.set(obj)
      }

      set_variable(key,result[key]).then(function () {
        resolve()
      });
      
    });
  })
}

function set_variable(key,value)
{
  let code = "window."+key + ' = ' +JSON.stringify(value)
  return execute_script(code);
}



//执行一个脚本返回resolve
function execute_script(script) {
  let script1=script
  return new Promise(resolve=>{
    mode.ExecuteScript({
      code: script1
    },()=>{
      let e=chrome.runtime.lastError 
      resolve()
    })
  })
}

function parse_to_querystring(obj){
  //转换成query url
  var esc = encodeURIComponent;
  
  var qry = Object.keys(obj)
    .map((k) => esc(k.toString().replace(/\/\d+$/,"")) + "=" + esc(obj[k]))
    .join("&");

  return qry
}


function add_loading(ele){
  let loading = null;
  //添加loading图片
  if ($(ele).find(".script_loading").length == 0) {
    loading = String.raw`<div class="script_loading" style="width: 16px;height: 16px;display: inline-block;background: url(//cdn.hinative.com/packs/media/loadings/default-091d6e81.gif) no-repeat;background-size: 16px 16px;"> </div>`;
    loading = $(loading);
    ele.append(loading);
  }
  function ok() {
    loading.remove();
  }
  return ok;
}

