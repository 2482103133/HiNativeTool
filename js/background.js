// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
chrome.runtime.onInstalled.addListener(function () {
  //添加popup
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostEquals: 'hinative.com' },
      })
      ],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});

// chrome.storage.local.set({"white_list":["hello"]})

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {

  //在这里初始化变量
  let obj={
    "extension_enabled": true,
    "auto_block": false,
    "need_featured_answer": false,
    "cache_new_users": false,
    "block_rate_below": 0.3,
    "show_log": false,
    "blocked_users": [],
    "result_buffer": {},
    "white_list": []
  }

  //数据加载完后添加全局变量data_loaded
  preload(obj).then(function(){
    execute_script("data_loaded=true")
  })
});

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
    chrome.storage.local.get([key], function (result) {
      if (typeof result[key] === "undefined") {
        let obj = {}
        obj[key] = dflt
        chrome.storage.local.set(obj)
        result[key] = dflt
      }

      let cmd = key + '=' +JSON.stringify(result[key])
      let code = cmd
      // console.log(code)
      execute_script(code).then(function () {
        resolve()
      });
     
    });
  })
}

//执行一个脚本返回resolve
function execute_script(script) {
  let script1=script
  return new Promise(resolve=>{
    chrome.tabs.executeScript({
      code: script1
    },()=>{
      let e=chrome.runtime.lastError 
      resolve()
    })
  })
}

