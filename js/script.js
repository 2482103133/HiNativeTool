$(document).ready(function () {
    // https://hinative.com/en-US 只监听qeustions路径
    if (!window.location.pathname.match(/^\/[^\/]*$/))
        return

    //监听blocks变化
    setInterval(() => {
        if (extension_enabled || date_loaded)
            handler()
    }, 200);

    $("main").append("<div style='text-align:center'>如果需要新的提问,请下滑刷新~~ <br/>scroll down to refresh</div>")
})


var result_buffer = {}
var last_blocks_count = 0
var blocking = false
var date_loaded = false
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

    try {
        //遍历每个回答
        $(".d_block").each(function () {
            var href = $(this).attr("href")
            var b_block = $(this).get(0)
            var usr = $(this).find(".username").text()

            //如果是屏蔽用户则不用画
            if (!check_block(b_block)) {
                //console.log("return:" + usr)
                return
            }

            //如果已经画过了也不用画
            if (b_block.painted == true) {
                return
            }

            //如果该用户已经加载过了就不用了
            if (typeof result_buffer[usr] === "undefined") {
                //没有加载过就继续
                console.log("usr not in buffer:" + usr)

            }

            else {
                //已经加载过了
                //如果是新的方块则重新画一遍
                do_painting(b_block, result_buffer[usr].txt)
                return
            }

            //发送请求
            var oReq = new XMLHttpRequest();
            oReq.addEventListener("load", function (evt) {
                var evt = evt;
                //得到用户页面
                var txt = evt.srcElement.response
                var matches = txt.match(/\/.*\/profiles\/\d+/g)
                if (matches.length > 0) {
                    var i = 1
                    var p_url = null
                    //获得用户profileurl
                    do {
                        if (i >= matches.length) {
                            //未能找到matches,暂时认为是自己本人
                            console.log("can't find another user profile link!")
                            break
                        }
                        var p_url = matches[i]

                        i++
                    }
                    //判断不是自己的主页
                    while (p_url == matches[0])

                    var req = new XMLHttpRequest();
                    req.addEventListener("load", function (evt1) {
                        var p_url1 = p_url
                        var txt = evt1.srcElement.response

                        if (b_block.painted == true) {
                            return
                        }

                        result_buffer[usr] = { info: get_paint_info(txt) }

                        if (!need_featured_answer)
                            update_result_buffer()

                        do_painting(b_block)

                        if (need_featured_answer == true) {
                            //第一回答页面
                            //在这里获得采纳的回答数
                            var q_url = p_url1 + "/questions"
                            var req = new XMLHttpRequest();


                            req.addEventListener("load", function (evt) {

                                var b_block1 = b_block

                                //console.log("quesions page:" + usr)
                                //console.log("url:" + q_url)
                                var qtxt = evt.srcElement.response

                                var html = $.parseHTML(qtxt)
                                var page = $("<div>").append(html)
                                // console.log(qtxt)
                                //获得第一页回答的问题
                                var blocks = page.find(".d_block")
                                //console.log("parsed blocks count:" + blocks.length)
                                var blocks_count = 0
                                result_buffer[usr].answers = 0

                                blocks.each(function () {

                                    var badge = $($(this).find(".badge").get(0)).text().trim()
                                    //console.log("usr:" + usr + " badge:" + badge)
                                    //如果无人回答则不计入
                                    if (badge == "0") {
                                        //console.log("skipped quesition")
                                        return
                                    }

                                    blocks_count++;
                                    var fq_url = this.href
                                    var req = new XMLHttpRequest();

                                    //console.log("loading question:" + fq_url)
                                    req.addEventListener("load", function (evt) {
                                        var b_block2 = b_block1
                                        // var q_url=q_url
                                        var usr1 = usr
                                        var buffer = result_buffer[usr1]
                                        //console.log("loaded question:" + fq_url)
                                        var qtxt1 = evt.srcElement.response
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

                                        //当所有的都加载完
                                        if (blocks_count == buffer.answers) {
                                            console.log("usr:" + usr1 + " blocks_count:" + blocks_count + " buffer.answers:" + buffer.answers + " buffer.featured_answers:" + buffer.featured_answers)

                                            //将所有同名的block都加上rate
                                            $(".d_block").each(function () {
                                                if (this.featrued_painted != true) {
                                                    var a_usr = $(this).find(".username")
                                                    if (a_usr.text() == usr1) {
                                                        do_featrued_painting(this)
                                                    }
                                                }
                                            })
                                            update_result_buffer()
                                        }
                                    })
                                    req.open("GET", fq_url);
                                    req.send();

                                })
                            })
                            req.open("GET", q_url);
                            req.send();

                        }
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
    }
}

var blocking_user = false
var blocked_users = []
// chrome.storage.local.set({ blocked_users: [] })
// chrome.storage.local.set({ result_buffer: {} })


chrome.storage.local.get(["blocked_users", "result_buffer"], function (rslt) {
    blocked_users = typeof rslt.blocked_users === "undefined" ? [] : rslt.blocked_users
    result_buffer = typeof rslt.result_buffer === "undefined" ? {} : rslt.result_buffer

    console.log("read result_buffer count:" + Object.keys(result_buffer).length)
    console.log(result_buffer)
    date_loaded = true
})

function update_result_buffer() {
    chrome.storage.local.set({ "result_buffer": result_buffer })
}

function block_user(user_name) {
    blocked_users.push(user_name)
    blocked_users = Array.from(new Set(blocked_users))
    chrome.storage.local.set({ "blocked_users": blocked_users })
}

var blocked_blocks = new Set()
var filling_blocks_count = 0

function get_paint_info(txt) {

    //获得反应率以及其他信息
    var matches = txt.match(/level_\d/)
    var info = {}

    var color = "white"
    if (matches != null) {
        //获得用户profile rate
        info.rate = matches[0]
    }

    //获得questions number
    var numbers = txt.match(/(?<=font_numbers_large['"]>)[^<]+/g)
    // console.log(txt)
    info.q_n = numbers[0]
    info.a_n = numbers[1]

    return info
}
//对需要框框上色
function do_painting(ele) {

    //设置一个painted属性
    ele.painted = true
    var usr = $(ele).find(".username")
    var wrp = $(ele).find(".username_wrapper")
    var buffer = result_buffer[usr.text()]
    var info = buffer.info

    //确认是否需要自动隐藏
    var is_auto_blocked = false

    var color = "white"

    //获得用户profile rate
    var rate = info.rate

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

    var q_n = info.q_n
    var a_n = info.a_n

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

    //添加屏蔽选项
    var a = $("<a title='block this user'>❌</a>")
    a.before("&nbsp;")
    a.click(function (e) {
        e.preventDefault()
        block_user(usr.text())
        do_painting(ele)
    })
    wrp.append(a)

    check_block(ele)
}

function do_featrued_painting(ele) {
    ele.featrued_painted = true
    var usr = $(ele).find(".username")
    var wrp = $(ele).find(".username_wrapper")


    var a = result_buffer[usr.text()].answers
    var f = result_buffer[usr.text()].featured_answers
    var rate = (f / a).toFixed(2)
    wrp.append("<span class='rate_badage'> rate:" + rate + "</span>")
    if (rate == 0) {
        $(ele).find(".rate_badge").css("background-color", "red")
        if (auto_block) {
            block_user(usr.text())
            check_block(ele)
        }
        return false
    }

    if (rate > 0.6) {
        $(ele).find(".rate_badge").css("background-color", "green")
    }

    return true

}
//判断是否块块是否需要重绘
function check_block(ele) {
    if (blocked_blocks.has(ele))
        return false

    var usr = $(ele).find(".username")

    if (blocked_users.indexOf(usr.text()) > -1) {
        blocked_blocks.add(ele)

        if ($("#blocked_blocks").length == 0)
            $(".country_selector").append("<span id='blocked_blocks'> blocked quesions count:" + blocked_blocks.length + "</span>")
        else {
            $("#blocked_blocks").text("blocked quesions count:" + blocked_blocks.size)
        }

        console.log("已隐藏用户问题:" + usr.text())

        //把隐藏的blocks作为填充放在main后以便翻滚加载新提问
        if (filling_blocks_count < 5) {
            // console.log("hide")
            filling_blocks_count++
            ele.style.visibility = "hidden"
            $("body").after($(ele).detach())
            // $(ele).appendTo("body");
        }
        else {
            ele.style.display = "none"
        }
        return false
    }

    return true
}




