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
        //得到自身信息
        (function get_self_username(){

            if(typeof self_name==="undefined")
            {
                let p_url=$(".spec_nav_profile>a").get(0).href
                let req=request_get(p_url,null,false)
                let name=to_jq(req.responseText).find(".owner_name>span").text().trim()
                storage.set({"self_name":name})
                storage.set({"self_url":p_url})
                log("get self name:"+name+" self url:"+p_url)
            }

        })()

        //遍历每个回答
        $(".d_block").each(function () {
            let href = $(this).attr("href")
            let b_block = $(this).get(0)
            let usr = jq_must_find(this,".username").text()

            //如果该问题已经被屏蔽,就不用画
            if(blocked_quesions[href])
            {
                log("blocked question:"+href)
                add_block(b_block)
                return
            }

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
                //判断数据是否过期,单位为天
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
            request_get(href,function (evt) {
                let q_url=href

                //得到用户页面
                let txt = evt.srcElement.response
                let page = to_jq(txt)
                let block=b_block
                //判断是不是选择型问题
                if(page.find(".box_question_choice").length>0)
                {
                    let c_url=q_url+"/choice_result"
                    let c_req = request_get(c_url,null,false);
                    //如果已经投过票了,则跳过这个问题
                    if(c_req.responseText.indexOf(self_name)>-1)
                    {
                        log("skip quesion because usr has selected")
                        add_block(block)
                        blocked_quesions[q_url]=true
                        storage.set({"blocked_quesions":blocked_quesions})
                        return
                    }
                }

                let wrp = $(page.find(".chat_content_wrapper").get(0))
                //https://hinative.com/en-US/questions/15939889/choice_result


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
                                    let a_usr = jq_must_find(this,".username")
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

            })
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

//将block屏蔽掉
function add_block(ele)
{
    let usr=jq_must_find(ele,".username")

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
    let usr = jq_must_find(ele,".username")
    let wrp = jq_must_find(ele,".username_wrapper")
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
    let usr = jq_must_find(ele,".username")
    let wrp = jq_must_find(ele,".username_wrapper")
    // log("result_buffer[" + usr.text() + "]:")
    // log(result_buffer[usr.text()])
    let a = result_buffer[usr.text()].answers
    let f = result_buffer[usr.text()].featured_answers

    let rate = (f / a).toFixed(2)
    wrp.append("<span class='rate_badage'> rate:" + ((a != 0) ? rate : "NO ANSWERS") + "</span>")
    if (rate <= block_rate_below) {
        //如果采纳率为0，则标红
        jq_must_find(ele,".rate_badge",false).css("background-color", "red")
        if (auto_block) {
            block_user(usr.text())
            check_block(ele)
        }
        return false
    }

    //采纳率大于0.6则标绿
    if (rate > 0.6) {
        jq_must_find(ele,".rate_badge",false).css("background-color", "green")
    }

    return true

}
//判断是否块块是否好好的,需要被屏蔽
function check_block(ele, why) {

    //如果已经屏蔽，则不用画了
    if (blocked_blocks.has(ele))
        return false

    let usr = jq_must_find(ele,".username")
    //如果在白名单里则不必屏蔽
    if (white_list.indexOf(usr.text()) >= 0) {
        return true
    }

    if (blocked_users.indexOf(usr.text()) > -1) {
        
        add_block(ele)
        return false
    }

    return true
}

function each_user_blocks(username, handler) {
    
    $(".d_block").each(function () {
        if (jq_must_find(this,".username").text() == username) {
            handler.call(this)
        }
    })
}

//获得用户提问，回应率，回答数
function get_user_info(p_url, usr) {
    let p_url1 = p_url
    let usr1 = usr
    return new Promise(resolve => {
        request_get(p_url,function (evt1) {
            let txt = evt1.srcElement.response
            let buffer = { info: get_paint_info(txt), profile_url: p_url1, usr: usr1, time: new Date().getTime() }
            resolve(buffer)
            return
        })
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

        //请求该用户的提问页，用于得到问题的采纳率
        request_get(q_url, function (evt) {

            let qtxt = evt.srcElement.response
            let page = to_jq(qtxt)

            //获得第一页回答的问题
            let blocks = page.find(".d_block")
            let blocks_count = 0

            //初始化总的有回复的提问数
            buffer.answers = 0
            blocks.each(function () {
              
                
                let badge = $(jq_must_find(this,".badge_item").get(0)).text().trim()
                log("usr-question:" + buffer.usr + " badge:" + badge)
                //如果无人回答则不计入
                if (badge == "0") {
                    // log("skipped quesition")
                    return
                }

                blocks_count++;
                let fq_url = this.href

                //请求某一个问题的页面
                request_get(fq_url, function (evt) {
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

            })
        })
    })

}
function to_jq(html_text) {
    let qtxt = html_text
    let html = $.parseHTML(qtxt)
    let page = $("<div>").append(html)
    return page
}

function jq_must_find(ele,selector,force=true){
    let find=$(ele).find(selector)
    if(force&&find.length==0)
    {
        alert("未能找到关键样式:"+selector+" 请联系作者解决!,程序将被暂停运行~~")
        extension_enabled=false
    }
    return find
}

function request_get(url,callback,async=true){
    let req=new XMLHttpRequest()
    if(callback)
    req.addEventListener("load",callback)
    req.open("GET",url,async)
    req.send()
    return req
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







