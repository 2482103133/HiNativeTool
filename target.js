
// ==UserScript==
// @name         HinativeTool
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Handy Hinative tool!
// @author       Collen Zhou
// @match        *://hinative.com/*
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_listValues
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==
//The file is auto created with script, changes might get lost!
(function() {
    'use strict';
    console.log("running")
    window. gm_get = GM_getValue
    window. gm_set = GM_setValue
    function toggle_setting(){
            let visible=$('#popup').is(':visible')
            var pop_up=$(window.popuphtml)
            $('#popup').replaceWith(pop_up)
            setup_popup()
            if(visible)
            pop_up.hide()
            else{
            pop_up.show()
            }
    }
    
    let s=$("<span></span>")
    let ts=$("<span id='setting' title='sript settings' style='font-size: 22px;cursor: pointer;'  >⚙️</span>")
    ts.click(toggle_setting)
    s.append(ts)
    $(".nav_activity").after(s)

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


// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';
mode.OnInstalled(function () {
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
})
// execute_script("window.need_featured_answer=true")

mode.OnPageUpdated(function (tabId, changeInfo, tab) {
  execute_script("window.data_loaded=false")
  //在这里初始化变量
  let obj={
    "show_log": false,
    "extension_enabled": true,
    "auto_block": false,
    "need_featured_answer": true,
    "cache_new_users": false,
    "block_rate_below": 0.3,
    "validity_duration": 7,
    "blocked_users": [],
    "result_buffer": {},
    "white_list": []
  }
  //数据加载完后添加全局变量data_loaded
  preload(obj).then(function(){
    // alert("preloaded")
    execute_script("window.data_loaded=true")
  })
})

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
      
      

      if (typeof result[key] == "undefined") {
        let obj = {}
        obj[key] = dflt
        
        // storage.set(obj)
        result[key] = dflt
      }

      let code = "window."+key + ' = ' +JSON.stringify(result[key])
      
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
    mode.ExecuteScript({
      code: script1
    },()=>{
      
      let e=chrome.runtime.lastError 
      resolve()
    })
  })
}


$(document).ready(function () {
    // https://hinative.com/en-US 只监听qeustions路径
    if (!window.location.pathname.match(/^\/[^\/]*$/))
        return
    //缓存的结果，减少xhr次数
    // result_buffer
    //数据是否加载完
    // data_loaded = false
    //用来填充的个数
    //被屏蔽的用户列表
    // blocked_users = []
    
    window.last_blocks_count = 0
    //现在是否正在blocking过程中
    window.blocking = false
    //新用户最大提问数
    window. new_user_qustion_count = 3
    //自动屏蔽的用户数组
    window. auto_blocked_users = []
    //已经被屏蔽的问题块
    window. blocked_blocks = new Set()
    //已经用于填充的问题块数
    window. filling_blocks_count = 0

    //监听blocks变化
    setInterval(() => {
        
        
        if ((!(typeof data_loaded==="undefined"))&&data_loaded&&extension_enabled )
            handler()
    }, 200);

    $("main").append("<div style='text-align:center'>如果需要新的提问,请下滑刷新~~ <br/>scroll down to refresh</div>")
    // mode.AddPopup()
})



//主要的执行过程
function handler() {
    if ($(".d_block").length == last_blocks_count) {
        //每两百毫秒执行一次,判断是否需要新的查询
        return
    }
    if (blocking) {
        log("blokcing")
        return
    }
    //阻塞标示，以免两个interval同时运行，造成多次paint
    blocking = true
    last_blocks_count = $(".d_block").length

    try {
        //遍历每个回答
        $(".d_block").each(function () {
            let href = $(this).attr("href")
            let b_block = $(this).get(0)
            let usr = $(this).find(".username").text()

            //如果是屏蔽用户则不用画
            if (!check_block(b_block)) {
                //log("return:" + usr)
                return
            }

            //如果已经画过了也不用画
            if (b_block.painted == true) {
                return
            }

            //如果该用户没加载过,或者用户数据过期了就继续加载数据，否则重画
            if (typeof result_buffer[usr] === "undefined") {
                //没有加载过就继续
                log("usr not in buffer:" + usr)
            }
            else if (!(typeof validity_duration === "undefined")) {
                let duration = (new Date().getTime() - result_buffer[usr].time) / (86400*1000)
                log("validity_duration:" + validity_duration + "duration:" + duration)
                if (duration >= validity_duration) {
                    log(usr+" data expired!")
                } else {
                    //已经加载过了
                    //如果是新的方块则重新画一遍
                    do_painting(b_block, result_buffer[usr].txt)
                    return
                }
            }

            //发送请求
            let oReq = new XMLHttpRequest();
            oReq.addEventListener("load", function (evt) {

                //得到用户页面
                let txt = evt.srcElement.response
                let page = to_jq(txt)
                let wrp = $(page.find(".chat_content_wrapper").get(0))
                //获得用户profileurl
                let p_url = wrp.find("a").get(0).href
                let usr1 = usr

                get_user_info(p_url, usr1).then(function (buffer) {
                    let b_block1 = b_block
                    let buffer1 = buffer

                    if (b_block1.painted == true) {
                        return
                    }
                    //保存了基本信息和用户地址
                    result_buffer[buffer.usr] = buffer1

                    if (!need_featured_answer)
                        update_result_buffer()

                    do_painting(b_block1)

                    if (need_featured_answer == true) {
                        get_user_feartured_answer(p_url, buffer1).then(function (buffer) {

                            log("featrued loaded:" + buffer.usr)

                            result_buffer[buffer.usr] = buffer
                            //将所有同名的block都加上rate
                            $(".d_block").each(function () {
                                if (this.featrued_painted != true) {
                                    let a_usr = $(this).find(".username")
                                    if (a_usr.text() == buffer.usr) {
                                        do_featrued_painting(this)
                                    }
                                }
                            })

                            //更新数据到本地
                            update_result_buffer()
                        })
                    }
                })

            });

            oReq.open("GET", href);
            oReq.send();
        })

    } finally {
        blocking = false
    }
}

function update_result_buffer() {
    let clone = result_buffer
    //如果选择不缓冲新人，则不将新人数据上传
    if (!cache_new_users) {
        clone = Object.assign({}, result_buffer)
        let not_recording = []
        for (const usr in clone) {

            if (result_buffer[usr].info.q_n.replace("K", "000").replace(".", "") <= new_user_qustion_count) {
                //如果是新人则不缓存数据
                not_recording.push(usr)
            }
        }
        for (const usr of not_recording) {
            delete clone[usr]
        }
    }

    storage.set({ "result_buffer": clone })
}

function block_user(user_name, auto_blocked = true) {
    if (auto_blocked)
        auto_blocked_users.push(user_name)

    blocked_users.push(user_name)
    blocked_users = Array.from(new Set(blocked_users))
    let clone = Array.from(blocked_users)

    //自动生成的block将不被储存到本地
    for (const usr of auto_blocked_users) {

        if (clone.indexOf(usr) > -1)
            clone.splice(clone.indexOf(usr), 1)
    }

    storage.set({ "blocked_users": clone })
}

//添加用户到白名单
function add_white_list(user_name) {
    white_list.push(user_name)
    storage.set({ "white_list": Array.from(new Set(white_list)) })
}



function get_paint_info(txt) {

    //获得反应率以及其他信息
    let matches = txt.match(/level_\d/)
    let info = {}

    let color = "white"
    if (matches != null) {
        //获得用户profile rate
        info.rate = matches[0]
    }

    //获得questions number
    let numbers = txt.match(/(?<=font_numbers_large['"]>)[^<]+/g)
    // log(txt)
    info.q_n = numbers[0]
    info.a_n = numbers[1]

    return info
}
//对需要框框上色
function do_painting(ele) {

    //设置一个painted属性
    ele.painted = true
    let usr = $(ele).find(".username")
    let wrp = $(ele).find(".username_wrapper")
    let buffer = result_buffer[usr.text()]
    let info = buffer.info

    //确认是否需要自动隐藏
    let is_auto_blocked = false

    let color = "white"

    //获得用户profile rate
    let rate = info.rate

    switch (rate) {
        case "level_1":
            color = "red"
            is_auto_blocked = true
            break;
        case "level_2":
            color = "orange"
            is_auto_blocked = true
            break;
        case "level_3":
            color = "#ffff80"
            break;
        case "level_4":
            color = "green"
            break;
    }


    //添加色彩显示
    wrp.append("<span class='rate_badge' style=\"display:inline-block;width:16px;height:16px;border: darkblue;border-style: dotted;border-width: 1px;border-radius:8px;background-color:" + color + "\"></span>")

    let q_n = info.q_n
    let a_n = info.a_n

    usr.get(0).style.fontWeight = "bold"
    usr.get(0).style.color = "black"
    usr.get(0).style.fontSize = "25"
    wrp.append($("<span>" + " Q:" + q_n + " A:" + a_n + "</span>"))


    //如果没有划过feture answer则画一次
    if (ele.featrued_painted != true && typeof result_buffer[usr.text()].featured_answers != "undefined") {
        do_featrued_painting(ele)
    }

    //自动屏蔽
    if (is_auto_blocked && auto_block)
        block_user(usr.text())
    let in_white_list = white_list.indexOf(usr.text()) != -1
    //添加屏蔽选项
    let a = null
    //如果不存在于白名单则添加屏蔽选项
    if (!in_white_list) {
        a = $("<a class='block' title='block this user'>❌</a>")
        a.before("&nbsp;")
        a.click(function (e) {
            e.preventDefault()
            block_user(usr.text(), false)
            each_user_blocks(usr.text(), function () {
                do_painting(this)
            })

        })
        wrp.append(a)
    }

    //添加白名单选项
    a = $("<a class='white' title='add this user to white list'>" + (in_white_list ? "💗" : "💚") + "</a>")
    a.before("&nbsp;")
    a.click(function (e) {
        e.preventDefault()
        add_white_list(usr.text())
        //将用户的问题去除白名单和黑名单选项
        each_user_blocks(usr.text(), function () {
            $(this).find(".block").remove()
        })
        a.text("💗")
    })
    wrp.append(a)

    check_block(ele)
}

//添加采纳率
function do_featrued_painting(ele) {
    ele.featrued_painted = true
    let usr = $(ele).find(".username")
    let wrp = $(ele).find(".username_wrapper")
    // log("result_buffer[" + usr.text() + "]:")
    // log(result_buffer[usr.text()])
    let a = result_buffer[usr.text()].answers
    let f = result_buffer[usr.text()].featured_answers

    let rate = (f / a).toFixed(2)
    wrp.append("<span class='rate_badage'> rate:" + ((a != 0) ? rate : "NO ANSWERS") + "</span>")
    if (rate <= block_rate_below) {
        //如果采纳率为0，则标红
        $(ele).find(".rate_badge").css("background-color", "red")
        if (auto_block) {
            block_user(usr.text())
            check_block(ele)
        }
        return false
    }

    //采纳率大于0.6则标绿
    if (rate > 0.6) {
        $(ele).find(".rate_badge").css("background-color", "green")
    }

    return true

}
//判断是否块块是否需要重绘
function check_block(ele, why) {

    //如果已经屏蔽，则不用画了
    if (blocked_blocks.has(ele))
        return false

    let usr = $(ele).find(".username")
    //如果在白名单里则不必屏蔽
    if (white_list.indexOf(usr.text()) >= 0) {
        return true
    }

    if (blocked_users.indexOf(usr.text()) > -1) {
        //如果用户被屏蔽，则隐藏这个提问
        blocked_blocks.add(ele)

        if ($("#blocked_blocks").length == 0)
            $(".country_selector").append("<span id='blocked_blocks'> blocked quesions count:" + blocked_blocks.length + "</span>")
        else {
            $("#blocked_blocks").text("blocked quesions count:" + blocked_blocks.size)
        }

        log("已隐藏用户问题:" + usr.text())

        //把隐藏的blocks作为填充放在main后以便翻滚加载新提问
        if (filling_blocks_count < 5) {
            filling_blocks_count++
            ele.style.visibility = "hidden"
            $("body").after($(ele).detach())
        }
        else {
            ele.style.display = "none"
        }
        return false
    }

    return true
}

function each_user_blocks(username, handler) {
    $(".d_block").each(function () {
        if ($(this).find(".username").text() == username) {
            handler.call(this)
        }
    })
}

//获得用户提问，回应率，回答数
function get_user_info(p_url, usr) {
    let p_url1 = p_url
    let usr1 = usr
    return new Promise(resolve => {
        let req = new XMLHttpRequest();
        req.addEventListener("load", function (evt1) {
            let txt = evt1.srcElement.response
            let buffer = { info: get_paint_info(txt), profile_url: p_url1, usr: usr1, time: new Date().getTime() }
            resolve(buffer)
            return
        })
        req.open("GET", p_url);
        req.send()
    })
}

// 获得用户采纳情况信息
function get_user_feartured_answer(p_url, buffer) {
    let buffer1 = buffer
    let p_url1 = p_url
    return new Promise(resolve => {
        let buffer = buffer1
        //第一回答页面
        //在这里获得采纳的回答数
        let q_url = p_url1 + "/questions"
        let req = new XMLHttpRequest();

        //请求该用户的提问页，用于得到问题的采纳率
        req.addEventListener("load", function (evt) {

            let qtxt = evt.srcElement.response
            let page = to_jq(qtxt)

            //获得第一页回答的问题
            let blocks = page.find(".d_block")
            let blocks_count = 0

            //初始化总的有回复的提问数
            buffer.answers = 0
            blocks.each(function () {
                let badge = $($(this).find(".badge").get(0)).text().trim()
                //log("usr:" + usr + " badge:" + badge)
                //如果无人回答则不计入
                if (badge == "0") {
                    //log("skipped quesition")
                    return
                }

                blocks_count++;
                let fq_url = this.href
                let req = new XMLHttpRequest();

                //请求某一个问题的页面
                req.addEventListener("load", function (evt) {
                    // let buffer = result_buffer[usr1]
                    let qtxt1 = evt.srcElement.response
                    if (typeof buffer.featured_answers === "undefined") {
                        buffer.featured_answers = 0
                    }
                    //该问题已被采纳
                    if (qtxt1.indexOf("featured_answer_label") > -1) {
                        buffer.featured_answers++
                    }
                    else {
                        //未被采纳
                    }

                    buffer.answers++

                    //当所有的问题都加载完，统计结果，并添加到缓存中
                    if (blocks_count == buffer.answers) {
                        //更新时间
                        buffer.time = new Date().getTime()
                        log("usr:" + buffer.usr + " blocks_count:" + blocks_count + " buffer.answers:" + buffer.answers + " buffer.featured_answers:" + buffer.featured_answers)
                        resolve(buffer)
                        return
                    }
                })

                req.open("GET", fq_url);
                req.send();

            })
        })

        req.open("GET", q_url);
        req.send();
    })

}
function to_jq(html_text) {
    let qtxt = html_text
    let html = $.parseHTML(qtxt)
    let page = $("<div>").append(html)
    return page
}

//更新缓存
function update_cache() {
    log("current result_buffer:")
    log(result_buffer)
    new Promise(resolve => {
        storage.get(["result_buffer"], function (rslt) {
            const result_buffer = typeof rslt.result_buffer === "undefined" ? {} : rslt.result_buffer
            let resolved = 0
            const count = Object.keys(result_buffer).length
            log("count:" + count)
            log("result_buffer:")
            log(result_buffer)

            for (const usr in result_buffer) {


                let p_url = result_buffer[usr].profile_url
                let usr1 = usr
                get_user_info(p_url, usr1).then(function (buffer1) {

                    let buffer2 = buffer1
                    //保存了基本信息和用户地址
                    result_buffer[buffer2.usr] = buffer2

                    if (need_featured_answer == true) {
                        get_user_feartured_answer(p_url, buffer2).then(function (buffer3) {
                            // let buffer = buffer
                            log("featrued loaded:")
                            log(buffer3)
                            result_buffer[buffer3.usr] = buffer3

                            if (++resolved == count)
                                resolve(result_buffer)
                            log("resolved:" + resolved)
                        })
                    } else {
                        result_buffer[buffer1.usr] = buffer1
                        if (++resolved == count)
                            resolve(result_buffer)
                        log("resolved:" + resolved)
                    }
                })

            }
        })

    }).then(rb => {
        log("resovled buffer:")
        log(rb)

        alert("用户信息更新完成！")
    })
}








window.popuphtml=String.raw`<div id='popup' style='display: inline-block;position: absolute;z-index: 100;background: white;transform: translate(0, 100%);border-style: double;bottom: 0;left: 0;'><!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8">
</head>

<body style="width: 300px;height: 500px;">
  <table style="text-align: right;">
    <thead>
      <tr>Options</tr>
    </thead>
    <tbody>
      <tr>
        <td>Turn on:</td>
        <td><input id="switch" type="checkbox" title="Check to allow this extension to function" /><br /></td>
      </tr>
      <tr>
        <td>Auto block:</td>
        <td><input id="auto" type="checkbox" title="Allow this script to block users automatically" /><br /></td>
      </tr>
      <tr>
        <td>Featured answer:</td>
        <td><input id="featured" type="checkbox" title="Check to buffer and show user answer-featuring rate" /><br />
        </td>
      </tr>
      <tr>
        <td>Cache new users:</td>
        <td><input id="cache_new_users" type="checkbox"
            title="Check to cache new user's data,this option can be reverted." /><br /></td>
      </tr>
      <tr>
        <td>Show log:</td>
        <td><input id="show_log" type="checkbox" title="Show developer log" /><br /></td>
      </tr>
      <tr>
        <td>Block rate:</td>
        <td><input id="block_rate_below" type="range" style="width: 120px;" title="Block rate below" min="0" max="1" step="0.1" /><br /></td>
      </tr>
      <tr>
        <td>Data validity duration(d):</td>
        <td><input id="validity_duration" type="number" style="text-align: right;width: 120px;"  min="0" step="1" pattern="\d*" title="interval of auto updateing data which has expired:" /><br /></td>
      </tr>
      <tr>
        <td> Clear cached data:</td>
        <td><input id="cached" type="button" value="🚮"
            title="Clear buffered responses,you might need to re-reqeust those data!"
            style="border-style: outset;padding: 0%;"></input><br /></td>
      </tr>
      <tr>
        <td> Update Chached Data:</td>
        <td><input id="update" type="button" value="🆕" title="Update Chached Data,might take some time."
            style="border-style: outset;padding: 0%;"></input><br /></td>
      </tr>
      <tr >
        <td style="text-align: left;border-style: double;">
          <table >
            <thead>
              <tr>Blocked Users</tr>
            </thead>
            <tbody id="blocked_users" style="display: inline-block;height: 300px;overflow: scroll;">
            </tbody>
          </table>
        </td>
        <td style="text-align: left;border-style: double;">
          <table>
            <thead>
              <tr>White List</tr>
            </thead>
            <tbody id="white_list" style="display: inline-block;height: 300px;overflow: scroll;">
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
  <script >
    var i=0;
  </script>

  <script src="/js/jquery-3.4.1.min.js"></script>
  <script src="/js/common.js"></script>
  <script src="/js/popup.js"></script>
</body>
</html></div>`
s.append(window.popuphtml)


function setup_popup(){
//清空缓存的用户数据
$("#cached").click(function () {
    clear_cache()
})
//更新缓存的用户数据
$("#update").click(function () {
    popup_update_cache()
})

//设置title为value
$("#block_rate_below").change(function () {
    
    this.title = $(this).val()
})

$("#featured").click(function (e) {

    if ($(this).is(":checked")) {
        if (confirm("Warning:Cache will be cleared,continue?")) {
            clear_cache()
        }
        else {
            e.preventDefault()
        }
    }
})

set_binding("extension_enabled", $("#switch").get(0))
set_binding("auto_block", $("#auto").get(0))
set_binding("need_featured_answer", $("#featured").get(0))
set_binding("cache_new_users", $("#cache_new_users").get(0))
set_binding("block_rate_below", $("#block_rate_below").get(0))
set_binding("show_log", $("#show_log").get(0))
set_binding("validity_duration", $("#validity_duration").get(0))
binding_list("blocked_users", $("#blocked_users").get(0))
binding_list("white_list", $("#white_list").get(0))
}



function binding_list(key, tbody) {

    ((key, tbody) => {
        let list = []

        storage.get([key], function (rslt) {

            list = typeof rslt[key] === "undefined" ? [] : rslt[key]

            show_list()
            

            function remove_block(username) {
                while (list.indexOf(username) > -1) {
                    list.splice(list.indexOf(username), 1)
                }
                window. obj={  }
                obj[key]=list
                storage.set(obj)
            }

            function show_list() {
                $(tbody).empty()
                for (const u of list) {

                    let tr = $("<tr>")
                    tr.append($("<td>" + u + "</td>"))
                    let a = $("<a href='#'' style='text-decoration: none' title='Remove this user from the list'>❌</a>")
                    a.click(function () {
                        $(this).closest("tr").hide()

                        remove_block(u)

                    })
                    let db = $("<td></td>")
                    db.append(a)
                    tr.append(db)
                    $(tbody).append(tr)

                }
            }
        })

    })(key, tbody)
}

function set_binding(key1, check1) {
    let key = key1
    let check = check1
    $(check).change(function () {
        set_status()
    })
    
    storage.get([key], function (result) {
        switch (check.type) {
            case "checkbox":
                $(check).attr("checked", result[key])
                break
            default:
                $(check).val(result[key])
        }
        $(check).trigger("change");
        set_status()
    })

    function set_status() {
        let value = (function () {
            switch (check.type) {
                case "checkbox":
                    return $(check).is(":checked")
                default:
                    return $(check).val()
            }
        })()
        

        mode.ExecuteScript({
            code: key + '=' + value
        }, () => chrome.runtime.lastError);
        let obj = {}
        obj[key] = value
        storage.set(obj)
    }
}


function clear_cache() {
    storage.set({ "result_buffer": {} }, function () {
        log("cache cleared!")
    })
}

function popup_update_cache() {
    mode.ExecuteScript({
        code: "update_cache()"
    }, () => chrome.runtime.lastError);
}




    $('#popup').hide()
    })();
