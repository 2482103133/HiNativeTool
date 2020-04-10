
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
  ExecuteScript: function (script, callback) { }
}
Mode.prototype.constructor = Mode

//添加TM支持
window. TMMode = function () {
  Mode.call(this)
  this.Mode = "TM"
  this.Storage = new TMStorage()

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

