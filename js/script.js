$(document).ready(function () {
    // https://hinative.com/en-US 只监听qeustions路径
    if (!window.location.pathname.match(/^\/[^\/]*$/))
        return

    //监听blocks变化
    setInterval(() => {
        if (extension_enabled)
            handler()
    }, 200);
})

var result_buffer = {}
var last_blocks_count = 0
var blocking = false
function handler() {
    if ($(".d_block").length == last_blocks_count) {
        //每两百毫秒执行一次,判断是否需要新的查询
        return
    }
    if (blocking) {
        console.log("blokcing")
        return
    }

    blocking = true
    last_blocks_count = $(".d_block").length

    // console.log("length:" + $(".d_block").length)
    try {
        //遍历每个回答
        $(".d_block").each(function () {
            var href = $(this).attr("href")
            // $(ele).find(".username")
            // console.log(href)
            var b_block = $(this).get(0)
            var usr = $(this).find(".username").text()

            //如果该用户已经加载过了就不用了
            if (typeof result_buffer[usr] === "undefined") {

            }
            else {
                if (!b_block.painted) {

                    console.log("buffered:" + usr)
                    do_painting(b_block, result_buffer[usr].txt)
                }

                return
            }

            //发送请求
            var oReq = new XMLHttpRequest();
            oReq.addEventListener("load", function (evt) {
                var evt = evt;
                // console.log(evt)
                // var b_block=b_block
                //得到用户页面
                var txt = evt.srcElement.response
                var matches = txt.match(/\/.*\/profiles\/\d+/g)
                // console.log(txt)
                // console.log(matches.length)
                if (matches.length > 0) {
                    var i = 1
                    var p_url = null
                    //获得用户profileurl
                    do {
                        if (i >= matches.length) {
                            //未能找到matches
                            return
                        }
                        var p_url = matches[i]

                        i++
                    }
                    //判断不是自己的主页
                    while (p_url == matches[0])



                    var req = new XMLHttpRequest();
                    req.addEventListener("load", function (evt1) {
                        var p_url = p_url
                        // console.log("profile")

                        var txt = evt1.srcElement.response
                        result_buffer[usr] = { txt: txt, block: b_block }

                        do_painting(b_block, txt)
                    })

                    req.open("GET", p_url);
                    req.send()
                }
            });

            oReq.open("GET", href);
            oReq.send();
        })

    } finally {
        blocking = false
        // console.log("cancel blokcing")
    }
}
var blocking_user = false
var blocked_users = []
// chrome.storage.sync.set({ "blocked_users": []})
chrome.storage.sync.get(["blocked_users"], function (rslt) {
    blocked_users = typeof rslt.blocked_users === "undefined" ? [] : rslt.blocked_users
})

function add_block(user_name) {
    blocked_users.push(user_name)
    blocked_users=Array.from(new Set(blocked_users))
    chrome.storage.sync.set({ "blocked_users": blocked_users })
}

//对需要框框上色
function do_painting(ele, txt) {
    var usr = $(ele).find(".username")
    var wrp = $(ele).find(".username_wrapper")
    //获得反应率以及其他信息
    var matches = txt.match(/level_\d/)
    try {
        matches.length
    } catch (error) {
        console.log("发现萌新" + $(ele).find(".username").text())
        wrp.append("<b>New~</b>")
        // $(ele).find(".username")
    }

    //如果是被屏蔽的用户
    if (blocked_users.indexOf(usr.text()) > -1) {
        console.log("已隐藏用户:" + usr.text())
        ele.style.display = "none"
    }
   
   


    if (matches != null) {
        //获得用户profile rate

        var rate = matches[0]
        // console.log(rate)
        switch (rate) {
            case "level_1":
                ele.style.backgroundColor = "red"
                break;
            case "level_2":
                ele.style.backgroundColor = "orange"
                break;
            case "level_3":
                ele.style.backgroundColor = "#ffff80"
                break;
            case "level_4":
                ele.style.backgroundColor = "green"
                break;
        }
    }

    //获得featured users number to-do :not likely


    //获得questions number
    var numbers = txt.match(/(?<=font_numbers_large['"]>)[^<]+/g)
    // console.log(txt)
    var q_n = numbers[0]
    var a_n = numbers[1]

    usr.get(0).style.fontWeight = "bold"
    usr.get(0).style.color = "black"
    usr.get(0).style.fontSize = "25"
    wrp.append($("<span>" + " Q:" + q_n + " A:" + a_n + "</span>"))
    
    //添加屏蔽选项
    var a = $("<a> block</a>")
    a.before("&nbsp;")
    a.click(function (e) {
        e.preventDefault()
        add_block(usr.text())
        do_painting(ele, txt)
    })
    wrp.append(a)

    //设置一个painted属性
    ele.painted = true
    // usr.text(usr.text()+" Q:"+q_n+" A:"+a_n)
}




