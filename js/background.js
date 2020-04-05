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

chrome.storage.sync.set( {"extension_enabled":false})
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  
  chrome.storage.sync.get(["extension_enabled"], function (result) {
    chrome.tabs.executeScript({
      code: 'extension_enabled=' + result.extension_enabled
    },() => chrome.runtime.lastError);
  });

});

