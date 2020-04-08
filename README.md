# HiNativeTool
一个基于JavaSript的Chrome Extension.  
### 主要实现功能:  
1. 根据提问者的响应率(由官方提供的笑脸,愁脸使用的class name得到)来让问题背景用不同颜色显示,如红色代表这是一个低回复率的提问者所提的问题,而没有颜色代表是新人  
1. 显示提问者的回答数和问题数  
2. 允许屏蔽某一用户的问题(username边上的❌),可以在popup撤销屏蔽  
3. 允许添加用户到白名单(username边上的💚)，白名单用户的问题不会屏蔽,可以在popup撤销
4. 自动屏蔽选项,可以自动将低响应率的用户的提问加入屏蔽列表  
5. 查询提问采纳率显示在username旁边如rate:0.56代表56%的采纳率,此选项可以在popup在中关闭  
6. 自动缓存历史查询结果,提高运行效率,可以在popup中清除缓存
7. 允许屏蔽采纳率低于某个值（0~1）的用户的提问，可以在popup中更改  
8. 允许设置单条数据有效时间，默认是7天，可以在popup中更改 

### 预览
[0]:https://github.com/2482103133/HiNativeTool/raw/HinativeTool
没有显示红色的圈圈是因为已经被自动屏蔽掉了~  
![Alt preview](https://github.com/2482103133/HiNativeTool/raw/HinativeTool/images/preview.png)  
![Alt preview](https://github.com/2482103133/HiNativeTool/raw/HinativeTool/images/preview1.png)  
![Alt preview](https://github.com/2482103133/HiNativeTool/raw/HinativeTool/images/preview3.png)  

### 下载于使用  
> *由于缺那5个$，所以暂时只能以离线的方式呈现.*
#### 方案一
1. 将项目文件以压缩包形式下载，解压到某个文件夹  
2. 然后在chrome extension页面选择load unpacked  
3. 选择刚刚解压的文件夹  
4. 进入[HiNative](https://hinative.com),就可以看到右上角点亮的此HiNative插件 

#### 方案二
1. 下载项目根目录下的crx文件到本地
2. 打开页面<chrome://extensions/>
3. 将crx文件拖动进该页面，确认即可

 
