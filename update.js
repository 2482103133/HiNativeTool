const crx3 = require('crx3');

crx3(["D:/Code/VSC/ChromeExt/HiNative/manifest.json"], {
	keyPath: 'D:/Code/VSC/ChromeExt/HiNative/HiNative.pem',
	crxPath: 'D:/Code/VSC/ChromeExt/HiNative/HiNative.crx',
})
	.then(() => console.log('done'))
	.catch(console.error)
;