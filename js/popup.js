
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