const pw=require('playwright');
const wrap=(t)=>{const o=t.newPage.bind(t);};
const origLaunch=pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch=async(...a)=>{const b=await origLaunch(...a);const oc=b.newContext.bind(b);b.newContext=async(...x)=>{const c=await oc(...x);await c.addInitScript(()=>{window.__cqOpenAll=1;window.__cqFeatAll=1});return c};return b};
