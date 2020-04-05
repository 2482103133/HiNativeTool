
chrome.storage.sync.get(["extension_enabled"],function(result){
    console.log("result:"+result.extension_enabled)
    $("#switch").attr("checked",result.extension_enabled)
    set_status()
})

$("#switch").change(function () {
    set_status()
})


function set_status() {
    // console.log("set " + $(this).is(":checked"))
    var checked=$("#switch").is(":checked")
    chrome.tabs.executeScript({
        code: 'extension_enabled=' +checked
    },() => chrome.runtime.lastError);
    chrome.storage.sync.set({"extension_enabled":checked})
}

var blocking_user = false
var blocked_users = []
chrome.storage.sync.get(["blocked_users"], function (rslt) {
    blocked_users = typeof rslt.blocked_users === "undefined" ? [] : rslt.blocked_users

    show_blocked_users()
})

function remove_block(username){
    while(blocked_users.indexOf(username)>-1)
    {
        blocked_users.splice(blocked_users.indexOf(username),1)
    }
    chrome.storage.sync.set({blocked_users:blocked_users})
    show_blocked_users()
}

function show_blocked_users() {
    $("#blocked_users").empty()
    for (const u of blocked_users) {

        var tr=$("<tr>")
        tr.append($("<td>"+u+"</td>"))
        var a=$("<a href='#''>remove</a>")
        a.click(function(){
            remove_block(u)
        })
        var db=$("<td></td>")
        db.append(a)
        tr.append(db)
        $("#blocked_users").append(tr)
        
    }
}