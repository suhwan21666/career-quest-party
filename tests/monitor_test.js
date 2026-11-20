const {chromium,devices}=require('playwright');const path=require('path');
const F='file://'+path.resolve('index.html');let fails=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x?'  '+x:''));if(!c)fails++};
const store=new Map(),pres=new Map();
const clone=o=>JSON.parse(JSON.stringify(o));
async function mk(b,uid,dev,admin,nick){
  const ctx=await b.newContext({...dev,timezoneId:'Asia/Seoul'});const p=await ctx.newPage();p.__errs=[];p.on('pageerror',e=>p.__errs.push(e.message));
  await p.exposeFunction('N_get',k=>store.has(k)?JSON.stringify(store.get(k)):null);
  await p.exposeFunction('N_set',(k,v)=>{store.set(k,JSON.parse(v))});
  await p.exposeFunction('N_del',k=>{store.delete(k)});
  await p.exposeFunction('N_list',c=>JSON.stringify([...store.entries()].filter(([k])=>k.startsWith(c+'/')&&k.split('/').length===2).map(([k,v])=>[k.split('/')[1],v])));
  await p.exposeFunction('N_pres',(id,v)=>{if(v)pres.set(id,JSON.parse(v));else pres.delete(id)});
  await p.exposeFunction('N_peers',id=>JSON.stringify([...pres.entries()].filter(([k])=>k!==id).map(([k,v])=>({peer:k,by:k,isMe:false,kind:'viewer',presence:v}))));
  await p.addInitScript(({uid,admin,nick})=>{
    window.__pwn=null;
    const doc=path=>({get:async()=>{const r=await N_get(path);return{exists:r!==null,data:()=>r?JSON.parse(r):undefined}},set:async d=>{await N_set(path,JSON.stringify(d))},delete:async()=>{await N_del(path)}});
    const coll=name=>({where(){return this},get:async()=>{const l=JSON.parse(await N_list(name));return{docs:l.map(([id,v])=>({id,data:()=>v}))}},
      onSnapshot(cb){let last='';const tick=async()=>{const l=JSON.parse(await N_list(name));const s=JSON.stringify(l);if(s!==last){last=s;cb({docs:l.map(([id,v])=>({id,data:()=>v}))})}};tick();const h=setInterval(tick,250);return()=>clearInterval(h)}});
    const db={doc,collection:coll};
    const room={presence:async v=>{await N_pres(uid,v&&v.w?JSON.stringify(v):null)},peers:()=>[],onPeers(cb){const h=setInterval(async()=>{cb({peers:JSON.parse(await N_peers(uid))})},250);return()=>clearInterval(h)}};
    window.claude={use:async n=>n==='db'?db:n==='user'?{id:async()=>uid,can:async()=>true,canEdit:()=>admin,isOwner:()=>admin}:n==='room'?room:null};
    localStorage.setItem('cq-party-v1',JSON.stringify({v:2,nick,job:'chef',look:{hair:0,hc:0,top:1,skin:0},totalXp:130,done:3,streak:2,updated:Date.now()+5e4}));
  },{uid,admin,nick});
  await p.goto(F);await p.waitForTimeout(600);return {ctx,p}}
(async()=>{const b=await chromium.launch();
 const t1=await mk(b,'u_t1',devices['iPhone 13'],false,'테스터1'),t2=await mk(b,'u_t2',devices['Pixel 7'],false,'테스터2');
 const me=async x=>{await x.p.locator('[data-a=tab][data-t=me]:not(.link)').click();await x.p.waitForTimeout(250)};
 await me(t1);
 ok(await t1.p.locator('#topt').count()===1,'테스터: 정보 보내기 체크박스 표시');ok(await t1.p.locator('[data-a=adm]').count()===0,'테스터에게는 현황 버튼 없음');
 ok(!store.has('testers/u_t1'),'동의 전에는 아무것도 전송되지 않음');
 await t1.p.locator('#topt').check();await t1.p.waitForTimeout(500);
 let d=store.get('testers/u_t1');ok(d&&d.nick==='테스터1'&&d.dev==='iOS 사파리'&&d.lv>=1&&d.done===3,'동의 후 테스터 문서 생성',JSON.stringify(d||{}).slice(0,150));
 ok(d&&!('xp' in {})&&!JSON.stringify(d).includes('story'),'일지 내용 등은 포함되지 않음');
 await t1.p.locator('[data-a=fb]').click();await t1.p.waitForTimeout(250);
 await t1.p.fill('#fbm','광장에서 걷다가 멈췄어요');await t1.p.locator('[data-a=fbsend]').click();await t1.p.waitForTimeout(500);
 d=store.get('testers/u_t1');ok(d&&d.notes.length===1&&/멈췄어요/.test(d.notes[0].t),'의견이 서버에 전달됨');
 await t1.p.locator('[data-a=fb]').click();await t1.p.waitForTimeout(200);await t1.p.fill('#fbm','시발');await t1.p.locator('[data-a=fbsend]').click();await t1.p.waitForTimeout(300);
 ok(store.get('testers/u_t1').notes.length===1,'욕설 의견은 전송 차단');await t1.p.locator('[data-a=close]').first().click().catch(()=>{});
 // 테스터2: 동의 + 오류 전달
 await me(t2);await t2.p.locator('#topt').check();await t2.p.evaluate(()=>{window.__cqErr='TypeError: x is undefined'});await t2.p.waitForTimeout(300);
 await t2.p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await t2.p.waitForTimeout(3300);
 d=store.get('testers/u_t2');ok(d&&d.dev==='Android 크롬','안드로이드 기기 종류 기록',d&&d.dev);
 // 악성 문서
 store.set('testers/u_evil',{nick:'<img src=x onerror=window.__pwn=1>',dev:'iOS 사파리',scr:'1x1',lv:'9e99',done:'x',notes:'zz',err:'<b>x</b>',seen:Date.now()});
 // 관리자
 const ad=await mk(b,'u_admin',{viewport:{width:900,height:800}},true,'관리자');await me(ad);
 ok(await ad.p.locator('[data-a=adm]').count()===1,'관리자에게 현황 버튼 표시');
 await ad.p.locator('[data-a=adm]').click();await ad.p.waitForTimeout(700);
 const txt=await ad.p.locator('.sheet').innerText();
 ok(/테스터 3명/.test(txt),'관리자 현황에 테스터 3명',txt.split('\n').slice(1,3).join(' '));ok(/지금 접속 3명/.test(txt),'접속 중 집계');
 ok(/멈췄어요/.test(txt)&&/TypeError/.test(txt),'의견과 오류가 현황에 보임');ok(/iOS 사파리/.test(txt)&&/Android 크롬/.test(txt),'기기 종류가 현황에 보임');
 ok(await ad.p.evaluate(()=>window.__pwn)===null,'악성 닉네임 실행 안 됨');
 await ad.p.screenshot({path:'shots5/admin_dash.png'});
 // 만남: t1이 광장 입장, t2는 오늘 탭에서 인원 확인
 await t1.p.locator('[data-a=tab][data-t=today]:not(.link)').click();await t1.p.waitForTimeout(150);await t1.p.locator('[data-a=world]').click();await t1.p.waitForTimeout(900);
 await t2.p.locator('[data-a=tab][data-t=today]:not(.link)').click();await t2.p.waitForTimeout(900);
 ok(/지금 광장에 1명/.test(await t2.p.locator('#plz').innerText()),'입장 전에 광장 인원 표시',await t2.p.locator('#plz').innerText());
 await t2.p.locator('[data-a=world]').click();await t2.p.waitForTimeout(1200);
 ok(/지금 2명/.test(await t2.p.locator('#wcnt').innerText()),'테스터끼리 광장에서 만남(2명)',await t2.p.locator('#wcnt').innerText());
 ok(/지금 2명/.test(await t1.p.locator('#wcnt').innerText()),'상대 화면에서도 2명');
 await t2.p.screenshot({path:'shots5/meet_t2.png'});
 await t2.p.keyboard.press('Escape');await t1.p.keyboard.press('Escape');
 // 동의 철회 → 서버 정보 삭제
 await me(t1);await t1.p.locator('#topt').uncheck();await t1.p.waitForTimeout(500);ok(!store.has('testers/u_t1'),'동의 철회 시 서버 정보 삭제');
 for(const x of [t1,t2,ad])ok(x.p.__errs.length===0,'JS 오류 없음',x.p.__errs.join('|'));
 await b.close();console.log('FAIL count:',fails)})();
