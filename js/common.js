function storage_get(key,value)
{
    let r=null
    chrome.storage.local.get([key],function(result){
      r=result[key]  
    })
    while(r==null);
}

function storage_set(key,value)
{
    let obj={}
    obj[key]=value
    return chrome.storage.local.set(obj)
}