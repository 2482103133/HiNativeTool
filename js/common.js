function storage_get(key,value)
{
    var r=null
    chrome.storage.sync.get([key],function(result){
      r=result[key]  
    })
    while(r==null);
}

function storage_set(key,value)
{
    var obj={}
    obj[key]=value
    return chrome.storage.sync.set(obj)
}