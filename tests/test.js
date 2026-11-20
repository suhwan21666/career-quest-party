const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch();
 const mk=async(dark,withDb,w=400,h=860)=>{
  const c=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,colorScheme:dark?'dark':'light'});
  const p=await c.newPage();
  const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text())});
  if(withDb) await p.addInitScript(()=>{
    const store={};const subs=[];
    const notify=()=>subs.forEach(s=>s());
    const snap=(id,v)=>({id,exists:v!==undefined,data:()=>v});
    const db={doc:path=>({get:async()=>snap(path.split('/').pop(),store[path]),set:async v=>{store[path]=JSON.parse(JSON.stringify(v));notify()}}),
     collection:cp=>{const mkq=(f)=>({where:(k,o,v)=>mkq(x=>f(x)&&x[k]===v),get:async()=>{const docs=Object.keys(store).filter(k=>k.startsWith(cp+'/')&&k.split('/').length===2).map(k=>snap(k.split('/')[1],store[k])).filter(d=>f(d.data()));return{docs,size:docs.length}},
        onSnapshot:(cb)=>{const run=()=>{const docs=Object.keys(store).filter(k=>k.startsWith(cp+'/')&&k.split('/').length===2).map(k=>snap(k.split('/')[1],store[k])).filter(d=>f(d.data()));cb({docs,size:docs.length})};subs.push(run);setTimeout(run,0);return()=>{}}});return mkq(()=>true)}};
    window.__store=store;
    window.claude={use:async n=>n==='db'?db:n==='user'?{id:async()=>'u_me',can:async()=>true}:null};
  });
  await p.goto('file:///tmp/claude-0/-home-claude/11c39566-7110-5737-8b80-1278e6e73b14/scratchpad/build/index.html');
  return{p,errs,c};
 };
 const out='/tmp/claude-0/-home-claude/11c39566-7110-5737-8b80-1278e6e73b14/scratchpad/build/';
 // 1. light, with db
 let {p,errs}=await mk(false,true);
 await p.screenshot({path:out+'s1_setup.png'});
 await p.fill('#nk','하늘');
 await p.click('[data-a=next]');
 await p.click('[data-a=sel][data-j=firefighter]');
 await p.screenshot({path:out+'s2_job.png',fullPage:true});
 await p.click('[data-a=start]');
 await p.screenshot({path:out+'s3_today.png',fullPage:true});
 // complete act
 await p.click('[data-a=done]');
 await p.click('[data-a=open]');
 await p.screenshot({path:out+'s4_sit.png',fullPage:true});
 await p.click('[data-a=pick][data-k="1"]');
 await p.click('[data-a=done]');
 await p.waitForTimeout(800);
 await p.screenshot({path:out+'s5_levelup.png'});
 await p.click('[data-a=close]');
 await p.click('[data-a=tab][data-t=party]');
 await p.click('[data-a=cheer]');
 await p.screenshot({path:out+'s6_party_npc.png',fullPage:true});
 await p.fill('#pn','테스트 파티');
 await p.click('[data-a=create]');
 await p.waitForTimeout(300);
 await p.screenshot({path:out+'s7_party_real.png',fullPage:true});
 console.log('store',JSON.stringify(await p.evaluate(()=>Object.keys(window.__store))));
 await p.click('[data-a=tab][data-t=me]');
 await p.screenshot({path:out+'s8_me.png',fullPage:true});
 await p.click('[data-a=tab][data-t=me]');await p.click('.subnav [data-t=book]');
 await p.screenshot({path:out+'s9_book.png',fullPage:true});
 console.log('errs light',errs);
 // 2. dark without db, desktop, force level 6
 let r2=await mk(true,false,900,900);
 await r2.p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('cq-party-v1')||'null')});
 await r2.p.fill('#nk','다크');await r2.p.click('[data-a=next]');await r2.p.click('[data-a=sel][data-j=chef]');await r2.p.click('[data-a=start]');
 await r2.p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('cq-party-v1'));s.totalXp=700;s.stats={creativity:9,execution:6,challenge:4,empathy:2};localStorage.setItem('cq-party-v1',JSON.stringify(s))});
 await r2.p.reload();
 await r2.p.click('[data-a=tab][data-t=me]');
 await r2.p.screenshot({path:out+'s10_dark_me.png',fullPage:true});
 await r2.p.click('[data-a=tab][data-t=party]');
 await r2.p.screenshot({path:out+'s11_dark_party.png',fullPage:true});
 console.log('errs dark',r2.errs);
 const ov=await r2.p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);console.log('hscroll',ov);
 await b.close();
})();
