//清空缓存的用户数据
$("#cached").click(function () {
    clear_cache()
})
//更新缓存的用户数据
$("#update").click(function () {
    update_cache()
})

//设置title为value
$("#block_rate_below").change(function () {
    console.log("change")
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

SetBinding("extension_enabled", $("#switch").get(0))
SetBinding("auto_block", $("#auto").get(0))
SetBinding("need_featured_answer", $("#featured").get(0))
SetBinding("cache_new_users", $("#cache_new_users").get(0))
SetBinding("block_rate_below", $("#block_rate_below").get(0))

blocking_user = false
blocked_users = []
chrome.storage.local.get(["blocked_users"], function (rslt) {
    blocked_users = typeof rslt.blocked_users === "undefined" ? [] : rslt.blocked_users

    show_blocked_users()
    console.log(blocked_users)
})

function SetBinding(key1, check1) {
    let key = key1
    let check = check1
    $(check).change(function () {
        set_status()
    })

    chrome.storage.local.get([key], function (result) {

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
        console.log("value:" + value)

        chrome.tabs.executeScript({
            code: key + '=' + value
        }, () => chrome.runtime.lastError);
        let obj = {}
        obj[key] = value
        chrome.storage.local.set(obj)
    }


}


function clear_cache() {
    chrome.storage.local.set({ "result_buffer": {} }, function () {
        console.log("cache cleared!")
    })
}

function update_cache() {
    chrome.tabs.executeScript({
        code: "update_cache()"
    }, () => chrome.runtime.lastError);
}


function remove_block(username) {
    while (blocked_users.indexOf(username) > -1) {
        blocked_users.splice(blocked_users.indexOf(username), 1)
    }
    chrome.storage.local.set({ blocked_users: blocked_users })
    
    // show_blocked_users()
}

function show_blocked_users() {
    $("#blocked_users").empty()
    for (const u of blocked_users) {

        let tr = $("<tr>")
        tr.append($("<td>" + u + "</td>"))
        let a = $("<a href='#'' style='text-decoration: none' title='Remove this user from blocking list'>❌</a>")
        a.click(function () {
            $(this).closest("tr").hide()

            remove_block(u)

        })
        let db = $("<td></td>")
        db.append(a)
        tr.append(db)
        $("#blocked_users").append(tr)

    }
}