$(document).ready(function () {
  // https://hinative.com/en-US 只监听qeustions路径
  if (!window.location.pathname.match(/^\/[^\/]*$/)) return;

  //缓存的结果，减少xhr次数
  // result_buffer
  //数据是否加载完
  // data_loaded = false
  //用来填充的个数
  //被屏蔽的用户列表
  // blocked_users = []

  //现在是否正在blocking过程中
  window.blocking = false;
  //新用户最大提问数
  window.new_user_qustion_count = 3;
  //自动屏蔽的用户数组
  window.auto_blocked_users = [];
  //已经被屏蔽的问题块
  window.blocked_blocks = new Set();
  //已经用于填充的问题块数
  window.filling_blocks_count = 0;
  //存放请求的队列
  window.request_queue = [];

  window.appending = false;

  window.only_answered = $("input[data-questions-not-answered-only]").is(
    ":checked"
  );
  //请求最小间隔，以免给hinative服务器造成负担
  // request_interval
  //开启请求循环
  start_request_interval();

  get_info();

  window.first_loaded = true;
  //监听blocks变化
  setInterval(() => {
    if (
      !(typeof data_loaded === "undefined") &&
      data_loaded &&
      extension_enabled
    ) {
      process_multilanguage();
      process_blocking();
      process_scroll();

      let dqf = $(".body[data-questions-feed]");
      var sorted = dqf.find(".d_block").sort(function (a, b) {
        return (
          new Date($(b).find(".timeago").attr("title")).getTime() -
          new Date($(a).find(".timeago").attr("title")).getTime()
        );
      });
      var arr = dqf.find(".d_block").toArray();
      var equal = true;
      for (let i = 0; i < sorted.length; i++) {
        const a = sorted[i];
        const b = arr[i];
        if (a !== b) {
          equal = false;
          break;
        }
      }
      if (!equal) {
        sorted.prependTo(dqf);
        $("#time_line").remove();
        for (const ele of sorted) {
          //七天前的消息线
          if (
            $("#time_line").length == 0 &&
            $(".body[data-questions-feed]").has(ele) &&
            new Date().getTime() -
              new Date(jq_must_find(ele, ".timeago").get(0).title).getTime() >
              86400 * 1000 * validity_duration
          ) {
            window.time_line = $(
              "<div id='time_line'><div style='height:1px;background-color:black'></div><div style='text-align:center'>接下来是" +
                validity_duration +
                "天前的消息</div></div>"
            );
            $(ele).before(time_line);
          }
        }
      }
    }
  }, 200);

  if (rearrange) {
    $("main").append(
      "<div style='text-align:center'>如果需要新的提问,请下滑刷新~~ <br/>scroll down to refresh</div>"
    );

    let q = $(
      "<li><a  title='my questions' href='" +
        window.self_url +
        "/questions' style='font-size: 22px;cursor: pointer;'  >❔</a></li>"
    );
    let a = $(
      "<li><a  title='my answers' href='" +
        window.self_url +
        "/answers' style='font-size: 22px;cursor: pointer;'  >💡</a></li>"
    );

    $(".nav_activity").after(q);
    $(".nav_activity").after(a);

    $(".l_sidebar_container").empty();
    while (!data_loaded) {}
    let container=$(".l_sidebar_container")
    container.append("<div class='feedback_modal'>我未被回答的问题</div>")

    if (typeof self_url !== "undefined") {
      let ctr=$(".l_sidebar_container")
      ctr.append()
      traverse_user_questions(
        self_url,
        0,
        ":has(.has_no_answer)",
        function (txt, block) {
          let page=to_jq(txt)
          //如果没有回答 也没有人选择回答,就继续
          if(page.find(".div[data-answer-id]").length==0)
          {
            let has_answer=false
           
            $(page.find(".count")).each(function(){
              if($(this).find("p").find("span").text().trim()!="0")
              has_answer=true
            })
            if(!has_answer)
            {
              return
            }
          }
          console.log("find!");
          let ele=$(block).clone()
          let href=$(block).attr("href")
          let wrapper=$("<div class='wrapper wrapper_fukidashi' style='border: solid;border-width: 1px;margin-bottom: 20px;border-radius: 10px;'></div>")
          let ques=jq_must_find(ele,".mod_question_content_decorated")
          let word=jq_must_find(ques,".keyword")
          
          ques.append(jq_must_find(ele,".timeago"))
          word.css("cursor","pointer")
        
          word.click(function(){
            location.href=href
          })
          wrapper.css("borderColor","#2c2d30")
          wrapper.append(ques)
          $(".l_sidebar_container").append(wrapper);
        }
      );
    }
  }

  //每三分钟不活动刷新一次
  // var timeout;
  // document.onmousemove = function () {
  //   clearTimeout(timeout);
  //   timeout = setTimeout(function () {
  //     location.reload();
  //   }, 60 * 1000 * 3);
  // };
});

function process_multilanguage() {
  if (first_loaded && $("li[data-next-page]>a").length > 0) {
    intercept();
    get_questions().remove();

    $("li[data-next-page]>a").attr(
      "href",
      $("li[data-next-page]>a")
        .get(0)
        .href.replace(/page=\d+/g, "page=1")
    );
    first_loaded = false;
  }
}
//拦截请求,并添加请求
function intercept() {
  let origin = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (...args) {
    let url = args[1];
    this.__url = url;

    return origin.apply(this, args);
  };
  var accessor = Object.getOwnPropertyDescriptor(
    XMLHttpRequest.prototype,
    "response"
  );

  Object.defineProperty(XMLHttpRequest.prototype, "response", {
    get: function () {
      let response = accessor.get.call(this);

      if (
        typeof this.__auto === "undefined" &&
        this.__url.indexOf("questions?") > 0
      ) {
        window.appending = true;
        let url = this.__url.split("?")[0];
        let params = this.__url.split("?")[1];
        let page = params.match(/(?<=page=)\d+/)[0];
        let lang_id = params.match(/(?<=language_id=)\d+/)[0];

        let append = "";
        for (const lang of selected_languages) {
          if (lang == lang_id) continue;

          let url1 = url + "?language_id=" + lang + "&page=" + page;
          console.log("appended request:" + url1);
          let req = request_get(url1, null, false, true);
          append = append + req.responseText;
        }
        let apd = to_jq(append);
        apd.find(".hide").remove();
        $(response.body).append(apd);

        apd = $(response.body);
        //把已经回答的问题去掉
        if (only_answered) {
          jq_must_find(apd, ".d_block").each(function () {
            let no_anser = $(this).find(".has_no_answer");
            if (no_anser.length == 0) {
              $(this).remove();
            }
          });
        }
        window.appending = false;
      }

      return response;
    },
    set: function (str) {
      return accessor.set.call(this, str);
    },
    configurable: true,
  });
}
//自动下拉以刷新提问
function process_scroll() {
  if (window.appending == true) return;
  if (typeof scroll_bar === "undefined") {
    window.scroll_bar = $(
      "<div class='scroll_bar' style='display:block;height:" +
        0 +
        "px;width:20px'>❀</div>"
    );
    $("body").append(scroll_bar);
  }
  let bh = scroll_bar.css("height").replace("px", "");
  var remain =
    window.innerHeight - ($("html").get(0).getClientRects()[0].height - bh);

  if (remain > 0) {
    let tmp = $("html").get(0).scrollTop;
    console.log("scroll");
    $("html").get(0).scrollTop = 0;
    $("html").get(0).scrollTop = $("html").get(0).scrollHeight;
    $("html").get(0).scrollTop = tmp;
  }

  scroll_bar.css("height", new Number(remain) + 100);
}

//获得所有问题块
function get_questions() {
  return $(".l_main_container .d_block");
}

function get_info() {
  //得到自身信息
  (function get_self_username() {
    if (typeof self_name === "undefined") {
      let p_url = $(".spec_nav_profile>a").get(0).href;
      let req = request_get(p_url, null, false);
      let name = to_jq(req.responseText).find(".owner_name>span").text().trim();
      storage.set({
        self_name: name,
      });
      storage.set({
        self_url: p_url,
      });
      log("get self name:" + name + " self url:" + p_url);
    }
  })();

  if (typeof languages === "undefined" || languages.length == 0) {
    let req = request_get(self_url + "/edit", null, false);
    // console.log(req.responseText)
    let options = to_jq(req.responseText).find(
      ".native_language_select>option"
    );
    let langs = {};
    options.each(function () {
      langs[$(this).val()] = $(this).text();
    });

    storage.set({
      languages: langs,
    });

    log("get languages:");
    log(langs);
  }
}

//主要的执行过程
function process_blocking() {
  if (blocking) {
    log("blokcing");
    return;
  }
  //阻塞标示，以免两个interval同时运行，造成多次paint
  blocking = true;

  try {
    //遍历每个回答
    get_questions().each(function () {
      if (this.processed != true) process(this);
    });
  } finally {
    blocking = false;
  }
}

function process(ele) {
  let b_block = $(ele).get(0);
  //用 div替换a
  if (b_block.outerHTML.startsWith("<a")) {
    let newDiv = $(
      b_block.outerHTML.replace(/^<a/, "<div").replace("/a>$/", "/div>")
    );
    $(b_block).replaceWith(newDiv);
    b_block = newDiv.get(0);
    ele = b_block;
  }
  let href = get_href(ele);
  let usr = jq_must_find(ele, ".username").text();
  let wrapper = jq_must_find(ele, ".username_wrapper");
  ele.processed = true;

  //更新问题信息到本地
  let q_info = questions_info[href];
  if (typeof q_info === "undefined") {
    q_info = {
      url: href,
      blocked: false,
      select_urls: [],
    };
    questions_info[href] = q_info;
    storage.set({
      questions_info: questions_info,
    });
  }

  // //如果该问题已经被屏蔽,就不用画
  // if (q_info.blocked) {
  //     add_block(b_block, false)
  //     return
  // }

  //如果是屏蔽用户则不用画
  if (!check_block(b_block)) {
    //log("return:" + usr)
    return;
  }

  //如果已经画过了也不用画
  if (b_block.painted == true) {
    return;
  }

  let block = b_block;

  //判断是不是选择型问题
  if (
    $(block).find("*:contains('does this sound natural')").length > 0 ||
    $(block).find("*:contains('听起来自然吗？')").length > 0
  ) {
    let c_url = href + "/choice_result";
    let c_req = request_get(c_url, null, false);
    //如果已经投过票了,则跳过这个问题
    if (c_req.responseText.indexOf(self_name) > -1) {
      log("usr:" + usr + " skip quesion because I have selected");
      add_block(block);
      return;
    }
  }

  //如果该用户没加载过,或者用户数据过期了就继续加载数据，否则重画
  if (typeof result_buffer[usr] === "undefined") {
    //没有加载过就继续
    log("usr not in buffer:" + usr);
  } else if (!(typeof validity_duration === "undefined")) {
    let duration =
      (new Date().getTime() - result_buffer[usr].time) / (86400 * 1000);

    //判断数据是否过期,单位为天
    if (duration >= validity_duration) {
      log("validity_duration:" + validity_duration + "duration:" + duration);
      log(usr + " data expired!");
    } else {
      //已经加载过了
      //如果是新的方块则重新画一遍
      do_painting(b_block, result_buffer[usr].txt);
      return;
    }
  }

  let loading = null;
  //添加loading图片
  if ($(b_block).find(".script_loading").length == 0) {
    loading = String.raw`<div class="script_loading" style="width: 16px;height: 16px;display: inline-block;background: url(//cdn.hinative.com/packs/media/loadings/default-091d6e81.gif) no-repeat;background-size: 16px 16px;"> </div>`;
    loading = $(loading);
    wrapper.append(loading);
  }

  function success() {
    //更新数据到本地
    update_result_buffer();
    loading.remove();
  }

  //发送请求
  request_get(href, function (evt) {
    let q_url = href;

    //得到用户页面
    let txt = evt.srcElement.response;
    let page = to_jq(txt);
    let vote = page.find("#js-choice_vote");
    let select_urls = [];

    //保存选择项
    if (vote.length > 0) {
      let div = $("<div>");

      //获得投票选项
      vote.find(".list-group-item").each(function () {
        // let clone = $(this).clone()
        // clone.css("display", "inline-block")
        // div.append(clone)
        let link = jq_must_find(this, "a");
        let url = link.attr("href");
        if (url == "") {
          //设置keyword
          jq_must_find(page, "#question_keyword_id").val(
            link.attr("data-url").match(/\d+$/)
          );
          let form = jq_must_find(page, "form[data-text-correction-form]");
          url =
            q_url +
            "/content_corrections?" +
            form.serialize() +
            "&commit=Submit%20correction";
          log("href:" + href);
        }
        select_urls.push(url);
      });
    }

    let wrp = $(page.find(".chat_content_wrapper").get(0));
    //https://hinative.com/en-US/questions/15939889/choice_result

    q_info.select_urls = select_urls;
    storage.set({
      questions_info: questions_info,
    });

    //获得用户profileurl,如果没有则不继续了
    if (wrp.find(".username").length == 0) return;

    let p_url = wrp.find("a").get(0).href;
    let usr1 = usr;

    get_user_info(p_url, usr1).then(function (buffer) {
      let b_block1 = b_block;
      let buffer1 = buffer;

      if (b_block1.painted == true) {
        return;
      }

      //保存了基本信息和用户地址
      result_buffer[buffer.usr] = buffer1;
      do_painting(b_block1);

      if (!need_featured_answer) {
        success();
      } else {
        get_user_featured_answer(p_url, buffer1).then(function (buffer) {
          success();
          log("featrued loaded:" + buffer.usr);
          result_buffer[buffer.usr] = buffer;
          //将所有同名的block都加上rate
          get_questions().each(function () {
            if (this.featrued_painted != true) {
              let a_usr = jq_must_find(this, ".username");
              if (a_usr.text() == buffer.usr) {
                do_featrued_painting(this);
              }
            }
          });
        });
      }
    });
  });
}

function create_question_info(url) {
  return {
    url: url,
    blocked: false,
  };
}

//更新缓存到本地
function update_result_buffer() {
  let clone = result_buffer;
  //如果选择不缓冲新人，则不将新人数据上传
  if (!cache_new_users) {
    clone = Object.assign({}, result_buffer);
    let not_recording = [];
    for (const usr in clone) {
      if (
        result_buffer[usr].info.q_n.replace("K", "000").replace(".", "") <=
        new_user_qustion_count
      ) {
        //如果是新人则不缓存数据
        not_recording.push(usr);
      }
    }
    for (const usr of not_recording) {
      delete clone[usr];
    }
  }

  storage.set({
    result_buffer: clone,
  });
}

function block_user(user_name, auto_blocked = true) {
  if (auto_blocked) auto_blocked_users.push(user_name);

  blocked_users.push(user_name);
  blocked_users = Array.from(new Set(blocked_users));
  let clone = Array.from(blocked_users);

  //自动生成的block将不被储存到本地
  for (const usr of auto_blocked_users) {
    if (clone.indexOf(usr) > -1) clone.splice(clone.indexOf(usr), 1);
  }

  storage.set({
    blocked_users: clone,
  });
}

//将block屏蔽掉
//update代表是否更新本次操作到本地
function add_block(ele, update = true, is_auto = true) {
  let usr = jq_must_find(ele, ".username");

  //如果用户被屏蔽，则隐藏这个提问
  blocked_blocks.add(ele);
  if (update) {
    let href = get_href(ele);
    questions_info[href].blocked = true;
    questions_info[href].is_auto = is_auto;
    storage.set({
      questions_info: questions_info,
    });
  }

  if ($("#blocked_blocks").length == 0)
    $(".country_selector").append(
      "<span style='cursor: pointer;' > blocked questions count:<b id='blocked_blocks'>" +
        blocked_blocks.length +
        "</b></span>"
    );
  else {
    $("#blocked_blocks").text(blocked_blocks.size);
  }

  log("已隐藏用户问题:" + usr.text());
  ele.style.display = "none";
}

//添加用户到白名单
function add_white_list(user_name) {
  white_list.push(user_name);
  storage.set({
    white_list: Array.from(new Set(white_list)),
  });
}
//获得绘制基本信息
function get_paint_info(usr_page) {
  //获得反应率以及其他信息
  let matches = usr_page.match(/level_\d/);
  let info = {};

  let color = "white";
  if (matches != null) {
    //获得用户profile rate
    info.rate = matches[0];
  }

  //获得questions number
  let numbers = usr_page.match(/(?<=font_numbers_large['"]>)[^<]+/g);
  // log(txt)

  if (numbers == null) {
    info.q_n = 0;
    info.a_n = 0;
  } else {
    info.q_n = numbers[0];
    info.a_n = numbers[1];
  }

  return info;
}
//对需要框框上色
function do_painting(ele) {
  //设置一个painted属性
  ele.painted = true;
  let usr = jq_must_find(ele, ".username");
  let wrp = jq_must_find(ele, ".username_wrapper");
  let url = get_href(ele);
  let q_info = questions_info[url];
  let buffer = result_buffer[usr.text()];
  let info = buffer.info;
  let div = $("<div>");
  let header = $(ele).find(".img_box_question_answer");
  let fuki = jq_must_find(ele, ".wrapper_fukidashi");
  fuki.append(div);

  //设置q_block才是问题入口
  let q_block = jq_must_find(ele, ".q_block");
  q_block.css("cursor", "pointer");
  q_block.click(function () {
    location.href = url;
  });

  //添加用户页面入口
  usr.css("cursor", "pointer");
  usr.click((_) => {
    location.href = buffer.profile_url;
  });

  header.css("cursor", "pointer");
  header.click((_) => {
    location.href = buffer.profile_url;
  });

  if (q_info.select_urls.length > 0) {
    //画上是否自然选择项
    add_item(0, "Natural");
    add_item(1, "A little unnatural");
    add_item(2, "Unnatural");
    add_item(3, "Don't konw");

    function add_item(index, title) {
      let url = q_info.select_urls[index];

      let s = $(
        "<span style='border-style: solid;border-width: 1px;margin: 2px;padding: 2px;cursor: pointer;' title='" +
          title +
          "'>" +
          title +
          "</span>"
      );
      s.click(function () {
        var b = ele;
        $(b).hide();

        mode.unsafeWindow.$.post({
          url: url,
          dataType: "script",
          complete: function (xhr) {
            if (xhr.status == "302" || xhr.status == "200") process(b);
          },
        });
        console.log('$.post("' + url + '")');
      });
      div.append(s);
    }
  }

  //确认是否需要自动隐藏
  let is_auto_blocked = false;
  let color = "white";
  //获得用户profile rate
  let rate = info.rate;
  switch (rate) {
    case "level_1":
      color = "red";
      is_auto_blocked = true;
      break;
    case "level_2":
      color = "orange";
      is_auto_blocked = true;
      break;
    case "level_3":
      color = "#ffff80";
      break;
    case "level_4":
      color = "green";
      break;
  }

  let cwrp = jq_must_find(ele, ".chat_content_wrapper");
  let cls = $(
    "<span style='display: inline-block;float: right; cursor: pointer;' title='close this question'>✕</span>"
  );
  cls.click(function (e) {
    e.preventDefault();
    add_block(ele, true, false);
  });
  cwrp.prepend(cls);

  //添加色彩显示
  wrp.append(
    "<span class='rate_badge' style=\"display:inline-block;width:16px;height:16px;border: darkblue;border-style: dotted;border-width: 1px;border-radius:8px;background-color:" +
      color +
      '"></span>'
  );

  let q_n = info.q_n;
  let a_n = info.a_n;

  usr.get(0).style.fontWeight = "bold";
  usr.get(0).style.color = "black";
  usr.get(0).style.fontSize = "25";
  wrp.append(
    $("<span style='cursor: pointer;'>" + " Q:" + q_n + " A:" + a_n + "</span>")
  );

  //如果没有划过feture answer则画一次
  if (
    ele.featrued_painted != true &&
    typeof result_buffer[usr.text()].featured_answers != "undefined"
  ) {
    do_featrued_painting(ele);
  }

  //自动屏蔽
  if (is_auto_blocked && auto_block) block_user(usr.text());
  let in_white_list = white_list.indexOf(usr.text()) != -1;
  //添加屏蔽选项
  let a = null;
  //如果不存在于白名单则添加屏蔽选项
  if (!in_white_list) {
    a = $(
      "<span class='block' style='cursor:pointer' title='block this user'>❌</span>"
    );
    a.before("&nbsp;");
    a.click(function (e) {
      e.preventDefault();
      block_user(usr.text(), false);
      each_user_blocks(usr.text(), function () {
        do_painting(this);
      });
    });
    wrp.append(a);
  }

  //添加白名单选项
  a = $(
    "<span class='white'  style='cursor:pointer' title='add this user to white list'>" +
      (in_white_list ? "💗" : "💚") +
      "</span>"
  );
  a.before("&nbsp;");
  a.click(function (e) {
    e.preventDefault();
    add_white_list(usr.text());
    //将用户的问题去除白名单和黑名单选项
    each_user_blocks(usr.text(), function () {
      $(this).find(".block").remove();
      $(this).find(".white").text("💗");
    });
  });
  wrp.append(a);

  check_block(ele);
}

//添加采纳率
function do_featrued_painting(ele) {
  ele.featrued_painted = true;
  let usr = jq_must_find(ele, ".username");
  let wrp = jq_must_find(ele, ".username_wrapper");
  // log("result_buffer[" + usr.text() + "]:")
  // log(result_buffer[usr.text()])
  let a = result_buffer[usr.text()].answers;
  let f = result_buffer[usr.text()].featured_answers;

  let rate = (f / a).toFixed(2);
  wrp.append(
    "<span  style='cursor: pointer;' class='rate_badage'> rate:" +
      (a != 0 ? rate : "No data!") +
      "</span>"
  );
  if (rate <= block_rate_below) {
    //如果采纳率为0，则标红
    jq_must_find(ele, ".rate_badge", false).css("background-color", "red");
    if (auto_block) {
      block_user(usr.text());
      check_block(ele);
    }
    return false;
  }

  //采纳率大于0.6则标绿
  if (rate > 0.6) {
    jq_must_find(ele, ".rate_badge", false).css("background-color", "green");
  }

  return true;
}
//判断是否块块是否可画
function check_block(ele, why) {
  //如果已经屏蔽，则不用画了
  if (blocked_blocks.has(ele)) return false;

  let usr = jq_must_find(ele, ".username");
  //如果在白名单里则不必屏蔽
  if (white_list.indexOf(usr.text()) >= 0) {
    return true;
  }
  //如果是黑名单用户则直接屏蔽
  if (blocked_users.indexOf(usr.text()) > -1) {
    add_block(ele, false, false);
    return false;
  }

  let q_info = questions_info[get_href(ele)];
  if (typeof q_info === "undefined") {
  } else {
    var blockable = null;
    //如果开启自动屏蔽了
    if (auto_block) {
      blockable = q_info.blocked;
    } else if (q_info.blocked) {
      if (q_info.is_auto) blockable = false;
      else {
        blockable = true;
      }
    }
    if (blockable) {
      add_block(ele, false, true);
      return false;
    }
  }

  return true;
}
//便遍历某个username的所有blocks
function each_user_blocks(username, handler) {
  get_questions().each(function () {
    if (jq_must_find(this, ".username").text() == username) {
      handler.call(this);
    }
  });
}

function get_href(ele) {
  let href = $(ele).attr("href");
  return get_href_without_params(href);
}
function get_href_without_params(href){
  return href ? href.split("?")[0].trim() : {}[0];
}
//获得用户提问，回应率，回答数
function get_user_info(p_url, usr) {
  let p_url1 = p_url;
  let usr1 = usr;
  // let qi=q_info
  return new Promise((resolve) => {
    request_get(p_url, function (evt1) {
      let txt = evt1.srcElement.response;
      let buffer = {
        info: get_paint_info(txt),
        profile_url: p_url1,
        usr: usr1,
        time: new Date().getTime(),
      };
      resolve(buffer);
      return;
    });
  });
}
function link_equal(link1,link2)
{
  return get_tail_number( get_href_without_params(link1))==get_tail_number( get_href_without_params(link2))
}
function get_tail_number(str)
{
  let match=str.match(/\d+$/)
  if(match){
    return match[0]
  }
  return null
}

function traverse_user_questions(
  p_url,
  count,
  block_selector = "",
  page_loaded
) {
  log("get user_questions:" + p_url);
  let p_url1 = p_url;
  let page_count = count;
  //如果设置为0则代表遍历所有问题
  if(page_count==0)
  {
    for (const usr in result_buffer) {
      if (result_buffer.hasOwnProperty(usr)) {
        const buffer = result_buffer[usr];
        if( link_equal(buffer.profile_url,p_url) )
        {
          page_count=Math.ceil(buffer.info.q_n/10)
        }
      }
    }
  }

  return new Promise((resolve) => {
    //第一回答页面
    //在这里获得采纳的回答数
    let q_url = p_url1 + "/questions";
    let blocks_count = 0;
    let resolved = 0;
    let answers = 0;

    for (let current_page = 0; current_page < page_count; current_page++) {
      request_page(current_page);
    }

    function request_page(index) {
      let q_url1 = q_url;
      if (index > 0) {
        q_url1 = q_url + "?page=" + (index + 1);
      }
      log("page:" + q_url1);
      request_get(q_url1, function (evt) {
        let qtxt = evt.srcElement.response;
        let page = to_jq(qtxt);
        //获得第一页回答的问题
        let blocks = page.find(".d_block" + block_selector);
        
        function check_out() {
          if (resolved == page_count && blocks_count == answers) {
            resolve();
            return true;
          } else {
            return false;
          }
        }

        //最后一页了,则取消继续查询
        if (page.find(".d_block").length == 0 || blocks.length == 0) {
          resolved++;
          if (check_out()) {
            return;
          }
        }

        let resolved_blocks = 0;
        //初始化总的有回复的提问数
        blocks.each(function () {
          let badge = $(jq_must_find(this, ".badge_item").get(0)).text().trim();
          log("badge:" + badge);
          blocks_count++;
          let fq_url = get_href(this);
          let block = this;
          //请求某一个问题的页面
          request_get(fq_url, function (evt) {
            let qtxt1 = evt.srcElement.response;
            //最后一页
            if(qtxt1.indexOf("class=\"next\"")<0)

            page_loaded(qtxt1, block);
            resolved_blocks++;
            answers++;
            if (blocks.length == resolved_blocks) {
              resolved++;
            }
            if (check_out()) {
              return;
            }
          });
        });
      });
    }
  });
}

// 获得用户采纳情况信息
function get_user_featured_answer(p_url, buffer) {
  log("getting user_featured_answer:" + p_url);
  let buffer1 = buffer;
  if (typeof buffer.featured_answers === "undefined") {
    buffer.featured_answers = 0;
  }
  if (typeof buffer.answers === "undefined") {
    buffer.answers = 0;
  }
  return new Promise((resolve) => {
    traverse_user_questions(p_url, fap_count, ":has(.has_no_answer)", function (
      res
    ) {
      //该问题已被采纳
      if (res.indexOf("featured_answer_label") > -1) {
        buffer1.featured_answers++;
      } else {
        //未被采纳
      }
      buffer1.answers++;
    }).then(function () {
      buffer.time = new Date().getTime();
      resolve(buffer);
    });
  });
}
// 将文本转化为jqnodes
function to_jq(html_text) {
  let qtxt = html_text;
  let html = $.parseHTML(qtxt);
  let page = $("<div>").append(html);
  return page;
}

//在一个元素中查找关键selector,如果不存在则报错
function jq_must_find(ele, selector, force = true) {
  let find = $(ele).find(selector);
  if (force && find.length == 0) {
    if (extension_enabled) {
      alert(
        "未能找到关键样式:" + selector + " 请联系作者解决!,程序将被暂停运行~~"
      );
    }
    extension_enabled = false;
  }
  return find;
}

//发送一次get请求
function request_get(url, callback, async = true, auto = true) {
  let req = new XMLHttpRequest();

  req.__auto = auto;
  if (callback) req.addEventListener("load", callback);
  req.open("GET", url, async);
  // req.setRequestHeader('User-Agent','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36')

  if (async) request_queue.push(req);
  else {
    req.send();
  }
  return req;
}

function start_request_interval() {
  //每秒一次请求
  setInterval(function () {
    if (request_queue.length > 0) {
      var req = request_queue.shift();
      req.send();
    }
  }, request_interval);
}

//更新缓存
function update_cache() {
  log("current result_buffer:");
  log(result_buffer);
  new Promise((resolve) => {
    storage.get(["result_buffer"], function (rslt) {
      const result_buffer =
        typeof rslt.result_buffer === "undefined" ? {} : rslt.result_buffer;
      let resolved = 0;
      const count = Object.keys(result_buffer).length;
      log("count:" + count);
      log("result_buffer:");
      log(result_buffer);
      for (const usr in result_buffer) {
        let p_url = result_buffer[usr].profile_url;
        let usr1 = usr;
        get_user_info(p_url, usr1).then(function (buffer1) {
          let buffer2 = buffer1;
          //保存了基本信息和用户地址
          result_buffer[buffer2.usr] = buffer2;

          if (need_featured_answer == true) {
            get_user_featured_answer(p_url, buffer2).then(function (buffer3) {
              result_buffer[buffer3.usr] = buffer3;

              if (++resolved == count) resolve(result_buffer);
              log(
                buffer3.usr +
                  "data updated:" +
                  resolved +
                  " left:" +
                  (count - resolved)
              );
            });
          } else {
            result_buffer[buffer1.usr] = buffer1;
            if (++resolved == count) resolve(result_buffer);
            log("resolved:" + resolved + " left:" + (count - resolved));
          }
        });
      }
    });
  }).then((rb) => {
    log("resovled buffer:");
    log(rb);
    update_result_buffer();
    alert("用户信息更新完成！");
  });
}

function append_page(index) {
  let feed = jq_must_find(".question_feeds");
  feed.append;
}
