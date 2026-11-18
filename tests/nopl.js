const pw=require('playwright');const o=pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch=async(...a)=>{const b=await o(...a);const nc=b.newContext.bind(b);b.newContext=async(...x)=>{const c=await nc(...x);await c.addInitScript('window.__cqNoPlaza=1');return c};return b};
