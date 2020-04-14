
/* 
    这个文件用于将项目导出成Tampermonkey脚本
*/
const base_url = ".."
const fs = require('fs')
const btoa = require('../node_modules/btoa')
const minify = require('./node_modules/html-minifier').minify;

jsdom = require("./node_modules/jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;
$ = jQuery = require('./node_modules/jquery')(window);

popup_uri = "html/popup.html"
js = []
requires = []
let config=JSON.parse(fs.readFileSync("manifest.json","utf8"))

result = String.raw`
// ==UserScript==
// @name         ${config["name"]}
// @namespace    http://tampermonkey.net/
// @version      ${config["version"]}
// @description  ${config["description"]}
// @author       ${config["author"]}
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
    console.log("Hinative tool is running!")
    window. gm_get = GM_getValue
    window. gm_set = GM_setValue
    function toggle_setting(){
            let visible=$('#popup').is(':visible')
            var pop_up=$(window.popuphtml)
            if(visible)
            pop_up.hide()
            else{
            pop_up.show()
            }
            $('#popup').replaceWith(pop_up)
            setup_popup()
            
    }
    
    let s=$("<span></span>")
    let ts=$("<span id='setting' title='sript settings' style='font-size: 22px;cursor: pointer;'  >⚙️</span>")
    ts.click(toggle_setting)
    s.append(ts)
    $(".nav_activity").after(s)
`
console.log(process.cwd())
function generate() {
    let to_url = "temp/tampermonkey-adaption.js"
    fs.writeFileSync("temp/tmp.txt", include_scripts(popup_uri))
    result += inject("js/common.js")
    result += inject("js/background.js")
    result += inject("js/script.js")
    result += "window.popuphtml=String.raw`<div id='popup' style='padding:10px;display: inline-block;position: absolute;z-index: 100;background: white;transform: translate(0, 100%);border-style: double;bottom: 0;left: 0;'>" + fs.readFileSync(popup_uri, "utf8") + "</div>`\n"
    result += "s.append(window.popuphtml)\n"
    result += inject("js/popup.js")
    result += String.raw
        `
    $('#popup').hide()
    })();
`
    fs.writeFileSync(to_url, result);
}
function inject(src) {
    let data = fs.readFileSync(src, "utf8")
    return data + "\n"

    return "$(document.body).append(String.raw`" + $("<script>").text(data).get(0).outerHTML + "`)\n"
}
function pac_sript_tag(src, tag = "script", type = "text/javascript") {


    window.s = $("<" + tag + ">")
    s.attr("src", pack_to_data_url(src, type))

    s.attr("src-origin", src)
    return s.get(0).outerHTML
}

function pack_to_data_url(src, type) {
    // return URL.createObjectURL(fs.readFileSync(src, "utf-8"))
    // return "data:"+type+"," + encodeURI(fs.readFileSync(src, "utf-8"))
    return "data:" + type + ",base64," + btoa(fs.readFileSync(src, "utf-8"))
}
function include_scripts(html_src) {
    let html = fs.readFileSync(html_src, "utf8")
    
    let doms = $("<html>").append(html)
    
    doms.find("script").each(function () {
        if (typeof this.src === "undefined" || this.src == "")
            return
        let src = this.src
        let packed = pack_to_data_url("./" + src)
        
        this.src = packed
    })

    let result = minify(doms.get(0).outerHTML, {
        removeAttributeQuotes: true
    })

    return result
}

generate()

