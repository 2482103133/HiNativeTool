function setup_popup() {
  //清空缓存的用户数据
  $("#cached").click(function () {
    clear_cache();
    mode.ExecuteScript({ code: "location.reload()" });
  });
  //更新缓存的用户数据
  $("#update").click(function () {
    popup_update_cache();
  });
  //更新用户信息
  $("#refresh_profile").click(function () {
    storage.set(
      {
        self_url: {}[0],
        self_name: {}[0],
      },
      (_) => {
        mode.ExecuteScript({ code: "get_info()" },_=>{});
        $("#username").get(0).refresh()
      }
    );
  });
  //点击添加新语言
  $("#add_language").click(function () {
    let origin = storage.get(["selected_languages"], function (res) {
      let val = $("#languages").val();
      let option = $("#languages>option[value=" + $("#languages").val() + "]");
      res.selected_languages.push(val);
      log("add language:" + val);
      storage.set(
        {
          selected_languages: Array.from(new Set(res.selected_languages)),
        },
        function () {
          binding_selected_languages();
          //刷新列表
          //   $("#selected_languages").get(0).show_list();
        }
      );
    });
  });

  //设置title为value
  $("#block_rate_below").change(function () {
    this.title = $(this).val();
  });
  //修改featured提示
  $("#featured").click(function (e) {
    if ($(this).is(":checked")) {
      if (confirm("Warning:Cache will be cleared,continue?")) {
        clear_cache();
      } else {
        e.preventDefault();
      }
    }
  });

  storage.get(["languages"], function (res) {
    // console.log(res.languages);

    for (const val in res.languages) {
      let text = res.languages[val];
      let op = $("<option>");
      op.val(val);
      op.text(text);
      $("#languages").append(op);
    }
  });

  set_binding("extension_enabled", $("#switch").get(0));
  set_binding("auto_block", $("#auto").get(0));
  set_binding("need_featured_answer", $("#featured").get(0));
  set_binding("cache_new_users", $("#cache_new_users").get(0));
  set_binding("block_rate_below", $("#block_rate_below").get(0));
  set_binding("show_log", $("#show_log").get(0));
  set_binding("rearrange", $("#rearrange").get(0));
  set_binding("validity_duration", $("#validity_duration").get(0));
  set_binding("self_name", $("#username").get(0));
  set_binding("request_interval", $("#request_interval").get(0));
  set_binding("fap_count", $("#fap_count").get(0));
  binding_list("blocked_users", $("#blocked_users").get(0));
  binding_list("white_list", $("#white_list").get(0));

  binding_selected_languages();
}
function binding_selected_languages() {
  binding_list(
    "selected_languages",
    $("#selected_languages").get(0),
    (list) => {
      // var that = this;
      //转化列表显示
      storage.get(["languages"], function (res) {
        list.each(function () {
          $(this).text(res.languages[$(this).text()]);
        });
      });
    }
  );
}

function binding_list(key, tbody, onbind = () => {}) {
  ((key, tbody) => {
    let list = [];
    let bind = onbind;
    let body = $(tbody);
    let k = key;
    storage.get([k], function (rslt) {
      list = typeof rslt[k] === "undefined" ? [] : rslt[k];
      show_list();
      function remove_block(username) {
        while (list.indexOf(username) > -1) {
          list.splice(list.indexOf(username), 1);
        }
        window.obj = {};
        obj[k] = list;
        storage.set(obj);
      }
      function show_list() {
        body.empty();
        for (const u of list) {
          let tr = $("<tr>");
          tr.append($("<td value='" + u + "'>" + u + "</td>"));
          let a = $(
            "<a href='#'' style='text-decoration: none' title='Remove this user from the list'>❌</a>"
          );
          a.click(function () {
            $(this).closest("tr").hide();

            remove_block(u);
          });
          let db = $("<td></td>");
          db.append(a);
          tr.append(db);
          body.append(tr);
        }
        if (typeof bind !== "undefined") bind(body.find("td[value]"));
      }
      body.get(0).show_list = show_list;
    });
  })(key, tbody);
}

function set_binding(key1, check1) {
  let key = key1;
  let check = check1;
  refresh()
  $(check).change(function () {
    set_status();
  });
  function refresh(){
    storage.get([key], function (result) {
      switch (check.type) {
        case "checkbox":
          $(check).attr("checked", result[key]);
          break;
        default:
          $(check).val(result[key]);
      }
     
    });
  }
  check.refresh=refresh

  function set_status() {
    let value = (function () {
      switch (check.type) {
        case "checkbox":
          return $(check).is(":checked");
        default:
          return $(check).val();
      }
    })();
    set_variable(key, value);
    let obj = {};
    obj[key] = value;
    storage.set(obj);
  }
}

function clear_cache() {
  storage.set({ result_buffer: {}, questions_info: {} }, function () {
    log("cache cleared!");
  });
}

function popup_update_cache() {
  mode.ExecuteScript(
    {
      code: "update_cache()",
    },
    () => chrome.runtime.lastError
  );
}
