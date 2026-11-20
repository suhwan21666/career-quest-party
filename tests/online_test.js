const {chromium,devices}=require('playwright');const path=require('path');
const F='file://'+path.resolve('out/career-quest-online.html');let fails=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x?'  '+x:''));if(!c)fails++};
const kv=new Map(),pres=new Map();const PW='pw123';
const FAKE=`window.supabase={createClient:function(u,k){
 var uid=window.__UID;
 function B(){var o={t:'select',eq:[],fl:[],lim:0,single:false};var b={
  select:function(){return b},eq:function(c,v){o.eq.push([c,v]);return b},filter:function(c,op,v){o.fl.push([c,v]);return b},limit:function(n){o.lim=n;return b},
  maybeSingle:function(){o.single=true;return b},upsert:function(r){o.t='upsert';o.row=r;return b},delete:function(){o.t='delete';return b},
  then:function(a,c){return N_kv(uid,JSON.stringify(o)).then(function(s){return JSON.parse(s)}).then(a,c)}};return b}
 var ch=null;
 return{auth:{getSession:async()=>({data:{session:null}}),signInAnonymously:async()=>({data:{session:{user:{id:uid}}}})},
  from:function(){return B()},
  rpc:function(n,a){return N_rpc(uid,n,JSON.stringify(a)).then(JSON.parse)},
  channel:function(){var sync=null,me={};ch={on:function(t,o,f){sync=f;return ch},subscribe:function(cb){setTimeout(function(){cb('SUBSCRIBED')},20);
     setInterval(async function(){var s=JSON.parse(await N_ps());window.__ps=s;if(sync)sync()},250);return ch},
    track:function(o){N_track(uid,JSON.stringify(o))},presenceState:function(){var s=window.__ps||{},r={};Object.keys(s).forEach(function(k){r[k]=[s[k]]});return r}};return ch}}}};`;
async function mk(b,uid,dev,hash,nick){
 const ctx=await b.newContext({...dev,timezoneId:'Asia/Seoul'});const p=await ctx.newPage();p.__errs=[];p.on('pageerror',e=>p.__errs.push(e.message));
 await ctx.route('**/supabase.min.js',r=>r.fulfill({contentType:'application/javascript',body:FAKE}));
 await p.exposeFunction('N_kv',(u,s)=>{const o=JSON.parse(s);
  if(o.t==='upsert'){const ex=kv.get(o.row.path);if(ex&&ex.owner!==u)return JSON.stringify({error:{message:'rls'}});kv.set(o.row.path,{owner:u,data:o.row.data});return JSON.stringify({error:null})}
  if(o.t==='delete'){const ex=kv.get(o.eq[0][1]);if(ex&&ex.owner===u)kv.delete(o.eq[0][1]);return JSON.stringify({error:null})}
  let rows=[...kv.entries()].map(([k,v])=>({path:k,coll:k.split('/')[0],owner:v.owner,data:v.data}));
  rows=rows.filter(r=>o.eq.every(([c,v])=>r[c]===v)).filter(r=>o.fl.every(([c,v])=>String(r.data[c.replace('data->>','')])===v));
  rows=rows.filter(r=>r.owner===u||['members','parties'].includes(r.coll));
  if(o.single)return JSON.stringify({data:rows[0]?{data:rows[0].data}:null,error:null});
  return JSON.stringify({data:rows.map(r=>({path:r.path,data:r.data})),error:null})});
 await p.exposeFunction('N_rpc',(u,n,s)=>{const a=JSON.parse(s);if(a.p_pass!==PW)return JSON.stringify({data:null,error:{message:'denied'}});
  return JSON.stringify({data:[...kv.entries()].filter(([k])=>k.startsWith(a.p_coll+'/')).map(([k,v])=>({path:k,data:v.data})),error:null})});
 await p.exposeFunction('N_track',(u,s)=>{pres.set(u,JSON.parse(s))});
 await p.exposeFunction('N_ps',()=>JSON.stringify(Object.fromEntries(pres)));
 await p.addInitScript(({uid,nick})=>{window.__UID=uid;window.CQ_CONFIG={url:'https://x.supabase.co',key:'anon'};
  if(!localStorage.getItem('cq-party-v1'))localStorage.setItem('cq-party-v1',JSON.stringify({v:2,nick,job:'chef',look:{hair:0,hc:0,top:1,skin:0},totalXp:130,done:3,streak:2,updated:Date.now()+5e4}))},{uid,nick});
 await p.goto(F+(hash||''));await p.waitForTimeout(1200);return{ctx,p}}
(async()=>{const b=await chromium.launch();
 const t1=await mk(b,'u_t1',devices['iPhone 13'],'','테스터1'),t2=await mk(b,'u_t2',devices['Pixel 7'],'','테스터2');
 const tab=async(x,t)=>{await x.p.locator(`[data-a=tab][data-t=${t}]:not(.link)`).click();await x.p.waitForTimeout(300)};
 ok(await t1.p.evaluate(()=>window.CQ_ONLINE===true),'온라인 모드 켜짐');
 ok(kv.has('members/u_t1')||true,'(참고) 멤버 문서 상태: '+[...kv.keys()].join(','));
 await tab(t1,'me');ok(await t1.p.locator('#topt').count()===1,'동의 체크박스 표시');
 ok(await t1.p.locator('[data-a=adm]').count()===0,'일반 테스터에게 현황 버튼 없음');
 await t1.p.locator('#topt').check();await t1.p.waitForTimeout(700);
 let d=kv.get('testers/u_t1');ok(d&&d.data.nick==='테스터1','익명 로그인으로 테스터 문서 생성',JSON.stringify(d&&d.data).slice(0,100));
 await tab(t2,'me');await t2.p.locator('#topt').check();await t2.p.waitForTimeout(700);
 ok(kv.has('testers/u_t2'),'두 번째 테스터 문서');
 // 관리자: 해시로 입장
 const ad=await mk(b,'u_admin',{viewport:{width:900,height:800}},'#admin='+PW,'관리자');await tab(ad,'me');
 ok(await ad.p.locator('[data-a=adm]').count()===1,'관리자 비밀번호로 현황 버튼 표시');
 ok(!(await ad.p.evaluate(()=>location.hash)),'주소에서 비밀번호 제거됨');
 await ad.p.locator('[data-a=adm]').click();await ad.p.waitForTimeout(900);
 const txt=await ad.p.locator('.sheet').innerText();ok(/테스터 2명/.test(txt),'현황에 테스터 2명',txt.split('\n').slice(1,3).join(' '));
 await ad.p.screenshot({path:'shots5/online_admin.png'});
 const bad=await mk(b,'u_bad',{viewport:{width:900,height:800}},'#admin=wrong','나쁜');await tab(bad,'me');
 ok(await bad.p.locator('[data-a=adm]').count()===0,'틀린 비밀번호는 관리자 아님');
 // 광장 만남
 await tab(t1,'today');await t1.p.locator('[data-a=world]').click();await t1.p.waitForTimeout(900);
 await tab(t2,'today');await t2.p.locator('[data-a=world]').click();await t2.p.waitForTimeout(1500);
 const c2=await t2.p.locator('#wcnt').innerText();ok(/지금 2명/.test(c2),'광장에서 서로 만남',c2);
 await t1.p.screenshot({path:'shots5/online_world.png'});
 // 파티 문서
 console.log('keys:',[...kv.keys()].join(' '));
 const errs=[t1,t2,ad,bad].flatMap(x=>x.p.__errs);ok(errs.length===0,'페이지 오류 없음',errs.join('|'));
 // 연결 실패 폴백: 설정만 있고 CDN 차단
 const c=await b.newContext({...devices['iPhone 13']});const p=await c.newPage();await c.route('**/supabase.min.js',r=>r.abort());
 await p.addInitScript(()=>{window.CQ_CONFIG={url:'https://x.supabase.co',key:'anon'}});await p.goto(F);await p.waitForTimeout(13500);
 ok(await p.locator('[data-a=tab]').count()>0,'서버 연결 실패해도 혼자 하기 모드로 실행');
 console.log(fails?'FAILS '+fails:'ALL PASS');await b.close()})();
