function SetBinding(key,check){
    var key=key
    var check=check
    chrome.storage.local.get([key],function(result){
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
        chrome.storage.local.set(obj)
    }
}
SetBinding("extension_enabled",$("#switch").get(0))
SetBinding("auto_block",$("#auto").get(0))
SetBinding("need_featured_answer",$("#featured").get(0))
SetBinding("cache_new_users",$("#cache_new_users").get(0))

$("#featured").click(function(e){

    if($(this).is(":checked"))
    {
        if(confirm("Warning:Cache will be cleared,continue?")){
            clear_cache()
        }
        else{
            e.preventDefault()
        }
    }
})

//清空缓存的用户数据
$("#cached").click(function(){
   clear_cache()
})
//清空缓存的用户数据
$("#update").click(function(){
   update_cache()
})

function clear_cache(){
    chrome.storage.local.set({"result_buffer":{}},function(){
        console.log("cache cleared!")
    })
}

function update_cache(){
    chrome.storage.local.get(["result_buffer"], function (rslt) {
        var result_buffer = typeof rslt.result_buffer === "undefined" ? {} : rslt.result_buffer

        for (const usr in result_buffer) {
            if (result_buffer.hasOwnProperty(usr)) {
                const buffer = result_buffer[usr];
                var url=buffer.profile_url

            }
        }
    })
}
var blocking_user = false
var blocked_users = []
chrome.storage.local.get(["blocked_users"], function (rslt) {
    blocked_users = typeof rslt.blocked_users === "undefined" ? [] : rslt.blocked_users

    show_blocked_users()
})

function remove_block(username){
    while(blocked_users.indexOf(username)>-1)
    {
        blocked_users.splice(blocked_users.indexOf(username),1)
    }
    chrome.storage.local.set({blocked_users:blocked_users})
    // show_blocked_users()
}

function show_blocked_users() {
    $("#blocked_users").empty()
    for (const u of blocked_users) {

        var tr=$("<tr>")
        tr.append($("<td>"+u+"</td>"))
        var a=$("<a href='#'' style='text-decoration: none' title='Remove this user from blocking list'>❌</a>")
        a.click(function(){
            $(this).closest("tr").hide()
 
            remove_block(u)
               
        })
        var db=$("<td></td>")
        db.append(a)
        tr.append(db)
        $("#blocked_users").append(tr)
        
    }
}