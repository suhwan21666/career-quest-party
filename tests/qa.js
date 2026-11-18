const {chromium}=require('playwright');
const FILE='file:///tmp/claude-0/-home-claude/11c39566-7110-5737-8b80-1278e6e73b14/scratchpad/build/index.html';
const out='/tmp/claude-0/-home-claude/11c39566-7110-5737-8b80-1278e6e73b14/scratchpad/build/qa/';
const f=n=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date(Date.now()-n*864e5));
const res=[];const ok=(n,c,x='')=>{res.push((c?'PASS':'FAIL')+' '+n+(x?'  '+x:''));};
const fakeDb=()=>{const store={};const subs=[];const snap=(id,v)=>({id,exists:v!==undefined,data:()=>v});
 const list=(cp,fl)=>Object.keys(store).filter(k=>k.startsWith(cp+'/')&&k.split('/').length===2).map(k=>snap(k.split('/')[1],store[k])).filter(d=>fl(d.data()));
 const db={doc:path=>({get:async()=>snap(path.split('/').pop(),store[path]),set:async v=>{store[path]=JSON.parse(JSON.stringify(v));subs.forEach(s=>s())}}),
  collection:cp=>{const mk=fl=>({where:(k,o,v)=>mk(x=>fl(x)&&x[k]===v),get:async()=>{const docs=list(cp,fl);return{docs,size:docs.length}},onSnapshot:cb=>{const run=()=>{const docs=list(cp,fl);cb({docs,size:docs.length})};subs.push(run);setTimeout(run,0);return()=>{}}});return mk(()=>true)}};
 return{db,store}};
(async()=>{
 const b=await chromium.launch();
 const mkPage=async(w,h,dark,opts={})=>{
  const c=await b.newContext({timezoneId:'Asia/Seoul',viewport:{width:w,height:h},deviceScaleFactor:1,colorScheme:dark?'dark':'light'});
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  if(opts.noStorage)await p.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}})});
  if(opts.seed)await p.addInitScript(s=>{localStorage.setItem('cq-party-v1',s)},opts.seed);
  if(opts.db)await p.addInitScript(()=>{
   const store={};const subs=[];const snap=(id,v)=>({id,exists:v!==undefined,data:()=>v});
   const list=(cp,fl)=>Object.keys(store).filter(k=>k.startsWith(cp+'/')&&k.split('/').length===2).map(k=>snap(k.split('/')[1],store[k])).filter(d=>fl(d.data()));
   const db={doc:path=>({get:async()=>snap(path.split('/').pop(),store[path]),set:async v=>{store[path]=JSON.parse(JSON.stringify(v));subs.forEach(s=>s())}}),collection:cp=>{const mk=fl=>({where:(k,o,v)=>mk(x=>fl(x)&&x[k]===v),get:async()=>{const docs=list(cp,fl);return{docs,size:docs.length}},onSnapshot:cb=>{const run=()=>{const docs=list(cp,fl);cb({docs,size:docs.length})};subs.push(run);setTimeout(run,0);return()=>{}}});return mk(()=>true)}};
   window.__store=store;window.claude={use:async n=>n==='db'?db:n==='user'?{id:async()=>'u_me',can:async()=>true}:null}});
  await p.goto(FILE);await p.waitForTimeout(250);return{p,errs,c}};
 const start=async(p,job='chef')=>{await p.fill('#nk','테스터');await p.click('[data-a=next]');await p.click(`[data-a=sel][data-j=${job}]`);await p.click('[data-a=start]')};
 const hscroll=p=>p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);

 // A. 화면 크기 × 테마 × 탭: 가로 스크롤, 오류
 for(const [w,h] of [[320,640],[375,812],[768,900],[1280,800]]) for(const dark of [false,true]){
  const {p,errs}=await mkPage(w,h,dark);
  const o=await hscroll(p);ok(`시작화면 ${w}px ${dark?'다크':'라이트'} 가로스크롤없음`,o<=0,'overflow '+o);
  await start(p);
  for(const tab of ['today','party','story','me','book']){
    await p.click(`[data-a=tab][data-t=${tab}]`);const ov=await hscroll(p);
    if(ov>0)ok(`${tab} ${w}px ${dark?'다크':'라이트'} 가로스크롤`,false,'overflow '+ov);
  }
  ok(`탭 전체 ${w}px ${dark?'다크':'라이트'} 오류없음`,errs.length===0,errs.join('|'));
  if(w===320&&!dark){await p.click('[data-a=tab][data-t=today]');await p.screenshot({path:out+'320_today.png'});}
  if(w===1280&&dark){await p.click('[data-a=tab][data-t=today]');await p.screenshot({path:out+'1280_dark_today.png'});}
  await p.context().close();
 }

 // B. 전체 흐름 (DB 있음)
 {const {p,errs}=await mkPage(400,820,false,{db:1});
  await start(p,'nurse');
  const s0=await p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')));
  ok('시작 직후 퀘스트 4개',s0.today.qs.length===4,JSON.stringify(s0.today.qs.map(q=>q.k)));
  await p.click('[data-a=done]');await p.waitForTimeout(200);
  const s1=await p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')));
  ok('수련 완료 → XP>0, 스트릭 1',s1.totalXp>0&&s1.streak===1,'xp '+s1.totalXp+' streak '+s1.streak);
  ok('같은 퀘스트 재클릭 불가(완료 버튼 사라짐)',await p.locator('.q.act [data-a=done]').count()===0);
  // 이야기: 너무 짧은 글 금지
  await p.click('[data-a=open]');await p.fill('#st','가');
  ok('한 글자면 기록 버튼 비활성',await p.locator('#wb').isDisabled());
  await p.fill('#st','전화번호 010-1234-5678 입니다');await p.check('#shr');await p.click('#wb');await p.waitForTimeout(150);
  const s2=await p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')));
  ok('연락처 포함 글은 파티 공개 안 됨(line null)',s2.line===null&&s2.story.length===1);
  ok('이야기 글 일지 저장',s2.story[0].t.includes('010'));
  // 공통 완료, 습관 선택/완료 → 올클리어
  await p.click('.q.com [data-a=done]');await p.waitForTimeout(100);
  await p.click('[data-a=habopen]');await p.keyboard.press('Escape');
  ok('Esc로 모달 닫힘',await p.locator('.ov').count()===0);
  await p.click('[data-a=habopen]');await p.click('[data-a=habpick][data-h="nurse:0"]');
  await p.click('[data-a=hab][data-m="1"]');await p.waitForTimeout(1200);
  const s3=await p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')));
  ok('올클리어 처리',s3.today.clear===1&&s3.today.qs.every(q=>q.done));
  ok('최소 버전 습관 기록',s3.habs['nurse:0']&&s3.habs['nurse:0'].streak===1&&s3.today.qs[3].m===1);
  ok('주간 카운트 4',s3.week.count===4,'count '+s3.week.count);
  // 틈새 5회 제한
  for(let i=0;i<7;i++){const bt=p.locator('[data-a=snack]');if(await bt.isEnabled())await bt.click();}
  const s4=await p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')));
  ok('틈새 퀘스트 하루 5회 제한',s4.today.snacks===5,'snacks '+s4.today.snacks);
  // 파티: 만들기 / 코드 / 나가기
  await p.click('[data-a=tab][data-t=party]');await p.fill('#pn','QA파티');await p.keyboard.press('Enter');await p.waitForTimeout(500);
  const code=await p.locator('#pc').innerText().catch(()=>'');
  ok('Enter로 파티 생성 + 코드 표시',/^[A-Z2-9]{5}$/.test(code),code);
  const stores=await p.evaluate(()=>Object.keys(window.__store));
  ok('DB에 members/parties 기록',stores.includes('members/u_me')&&stores.some(k=>k.startsWith('parties/')),stores.join(','));
  await p.click('[data-a=leaveAsk]');await p.click('[data-a=leave]');await p.waitForTimeout(300);
  ok('파티 나가기 후 NPC 모드 복귀',await p.locator('text=모험 동료 파티').count()>0);
  // 잘못된 코드
  await p.fill('#pj','ZZZZZ');await p.click('[data-a=join]');await p.waitForTimeout(300);
  ok('없는 코드 오류 안내',(await p.locator('.err').first().innerText()).includes('없는 코드'));
  ok('흐름 전체 JS 오류 없음',errs.length===0,errs.join('|'));
  await p.context().close();}

 // C. 파티 정원 4명 초과 차단
 {const {p}=await mkPage(400,820,false,{db:1});
  await p.evaluate(()=>{const d=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date());
   window.__store['parties/FULL1']={name:'가득',owner:'a'};['a','b','c','d'].forEach(u=>window.__store['members/u_'+u]={uid:'u_'+u,nick:u,job:'chef',level:1,done:0,date:d,party:'FULL1'})});
  await start(p);await p.click('[data-a=tab][data-t=party]');await p.fill('#pj','full1');await p.click('[data-a=join]');await p.waitForTimeout(400);
  ok('정원 초과 시 합류 차단',(await p.locator('.err').first().innerText()).includes('가득'));
  await p.context().close();}

 // D. 저장소 차단 / 구버전 저장 / 이상한 저장
 {const {p,errs}=await mkPage(400,820,false,{noStorage:1});await start(p);await p.click('[data-a=done]');
  ok('localStorage 차단 환경에서도 동작',errs.length===0&&await p.locator('.q.done').count()===1,errs.join('|'));await p.context().close();}
 {const old=JSON.stringify({v:1,nick:'옛날',job:'chef',look:{hair:0,hc:0,top:1,skin:0},totalXp:120,stats:{},streak:2,lastDay:f(0),today:{day:f(0),rerolls:1,clear:0,qs:[{k:'act',j:'chef',i:0,done:1},{k:'sit',j:'chef',i:1,done:0,score:null},{k:'com',i:0,done:0}]},cnt:{},done:1,party:null,chestDay:null,claimed:{},cheered:{},npcSay:{}});
  const {p,errs}=await mkPage(400,820,false,{seed:old});
  ok('구버전(v1) 저장 불러오기 → 새 퀘스트 4개로 복구',await p.locator('.q').count()===4&&errs.length===0,errs.join('|'));await p.context().close();}
 {const bad=JSON.stringify({v:2,nick:'이상',job:'없는직업',look:'zzz',totalXp:'abc',stats:null,today:null});
  const {p,errs}=await mkPage(400,820,false,{seed:bad});
  ok('손상된 저장(알 수 없는 직업) → 시작 화면으로 복구',await p.locator('#nk').count()===1&&errs.length===0,errs.join('|'));await p.context().close();}

 // E. 날짜 규칙
 {const seed=JSON.stringify({v:2,nick:'스트릭',job:'chef',look:{hair:0,hc:0,top:1,skin:0},totalXp:0,stats:{},streak:7,lastDay:f(1),today:{day:f(1),rerolls:1,clear:0,qs:[{k:'act',j:'chef',i:0,done:1},{k:'story',j:'chef',i:0,done:1,text:'a'},{k:'com',i:0,done:1},{k:'habit',done:1}]},rest:1,cnt:{},done:3,party:null,claimed:{},cheered:{},npcSay:{},story:[],habs:{}});
  const {p,errs}=await mkPage(400,820,false,{seed});
  const s=await p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')));
  ok('어제 마지막 → 오늘 새 퀘스트 생성',s.today&&s.today.day===f(0)&&s.today.qs.every(q=>!q.done),s.today&&s.today.day);
  await p.click('[data-a=done]');await p.waitForTimeout(200);
  const s2=await p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')));
  ok('연속 7→8, 휴식권 +1(7일 배수는 아님→유지)',s2.streak===8&&s2.rest===1,'streak '+s2.streak+' rest '+s2.rest);
  await p.context().close();}
 // 7일 달성 시 휴식권 지급
 {const seed=JSON.stringify({v:2,nick:'스트릭',job:'chef',look:{hair:0,hc:0,top:1,skin:0},totalXp:0,stats:{},streak:6,lastDay:f(1),today:null,rest:0,cnt:{},done:0,party:null,claimed:{},cheered:{},npcSay:{},story:[],habs:{}});
  const {p}=await mkPage(400,820,false,{seed});await p.click('[data-a=done]');await p.waitForTimeout(200);
  const s=await p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')));
  ok('7일 연속 달성 → 휴식권 지급',s.streak===7&&s.rest===1,'streak '+s.streak+' rest '+s.rest);await p.context().close();}

 // F. 모달 큐: 레벨업 + 주간상자 동시
 {const seed=JSON.stringify({v:2,nick:'큐',job:'chef',look:{hair:0,hc:0,top:1,skin:0},totalXp:80,stats:{},streak:0,lastDay:null,today:null,rest:1,cnt:{},done:0,party:null,claimed:{},cheered:{},npcSay:{},story:[],habs:{},week:{key:'x',count:0,claimed:0}});
  const {p,errs}=await mkPage(400,820,false,{seed});
  await p.click('[data-a=done]');await p.waitForTimeout(700);
  ok('레벨업 모달 표시',await p.locator('.sheet h2').first().innerText().then(t=>t.includes('레벨')).catch(()=>false));
  await p.click('[data-a=close]');ok('모달 닫은 뒤 남지 않음',await p.locator('.ov').count()===0&&errs.length===0,errs.join('|'));await p.context().close();}

 console.log(res.join('\n'));
 console.log('\nFAIL count:',res.filter(r=>r.startsWith('FAIL')).length,'/',res.length);
 await b.close();
})();
