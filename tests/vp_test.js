const {chromium,devices}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const c=await b.newContext({...devices['iPhone 13']});const p=await c.newPage();
await p.addInitScript(()=>{window.__cqNoPlaza=1});
await p.goto('file://'+path.resolve('index.html'));await p.waitForTimeout(600);
const r=await p.evaluate(()=>({iw:innerWidth,sw:document.documentElement.scrollWidth,fs:getComputedStyle(document.body).fontSize}));
console.log(JSON.stringify(r),r.iw<=430&&r.sw<=r.iw+1?'PASS':'FAIL');await b.close()})();
