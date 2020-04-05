function SetBinding(key,check){
    var key=key
    var check=check
    chrome.storage.sync.get([key],function(result){
        console.log("result:"+result[key])
        $(check).attr("checked",result[key])
        set_status()
    })
    
    $(check).change(function () {
        set_status()
    })
    
    
    function set_status() {
        // console.log("set " + $(this).is(":checked"))
        var checked=$(check).is(":checked")
        chrome.tabs.executeScript({
            code: key+'=' +checked
        },() => chrome.runtime.lastError);
        var obj={}
        obj[key]=checked
        chrome.storage.sync.set(obj)
    }
}
SetBinding("extension_enabled",$("#switch").get(0))
SetBinding("auto_block",$("#auto").get(0))


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