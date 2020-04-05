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



chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  add_script_value("extension_enabled",true)
  add_script_value("auto_block",false)

});



function add_script_value(key,dflt){
  var key=key
  var dflt=dflt
  chrome.storage.sync.get([key], function (result) {

    if(typeof result[key] ==="undefined")
    {
      var obj={}
      obj[key]=dflt
      chrome.storage.sync.set(obj)
      result[key]=dflt
    }
    console.log(key+'=' + result[key])
    chrome.tabs.executeScript({
      code: key+'=' + result[key]
    },() => chrome.runtime.lastError);
  });
}

