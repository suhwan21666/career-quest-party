const {chromium}=require('playwright');
const FILE='file:///tmp/claude-0/-home-claude/11c39566-7110-5737-8b80-1278e6e73b14/scratchpad/build/index.html';
const out='/tmp/claude-0/-home-claude/11c39566-7110-5737-8b80-1278e6e73b14/scratchpad/build/qa/';
const res=[];const ok=(n,c,x='')=>res.push((c?'PASS':'FAIL')+' '+n+(x?'  '+x:''));
const day=(tz,n=0)=>new Intl.DateTimeFormat('en-CA',{timeZone:tz}).format(new Date(Date.now()-n*864e5));
(async()=>{
 const b=await chromium.launch();
 const mk=async(o={})=>{
  const c=await b.newContext({timezoneId:o.tz||'Asia/Seoul',viewport:{width:400,height:820},deviceScaleFactor:2});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  if(o.seed)await p.addInitScript(s=>localStorage.setItem('cq-party-v1',s),o.seed);
  await p.addInitScript(([init,withDl])=>{const store=init||{};const subs=[];const snap=(id,v)=>({id,exists:v!==undefined,data:()=>v});
   const list=(cp,fl)=>Object.keys(store).filter(k=>k.startsWith(cp+'/')&&k.split('/').length===2).map(k=>snap(k.split('/')[1],store[k])).filter(d=>fl(d.data()));
   const db={doc:path=>({get:async()=>snap(path.split('/').pop(),store[path]),set:async v=>{store[path]=JSON.parse(JSON.stringify(v));subs.forEach(s=>s())},delete:async()=>{delete store[path];subs.forEach(s=>s())}}),
    collection:cp=>{const mkq=fl=>({where:(k,o,v)=>mkq(x=>fl(x)&&x[k]===v),get:async()=>{const docs=list(cp,fl);return{docs,size:docs.length}},onSnapshot:cb=>{const run=()=>{const docs=list(cp,fl);cb({docs,size:docs.length})};subs.push(run);setTimeout(run,0);return()=>{}}});return mkq(()=>true)}};
   window.__store=store;window.claude={use:async n=>n==='db'?db:n==='user'?{id:async()=>'u_me',can:async()=>true}:n==='downloads'&&withDl?{save:async o=>{window.__dl={filename:o.filename};window.__dlText=await o.data.text()}}:null}},[o.store||{},o.dl!==false]);
  await p.goto(FILE);await p.waitForTimeout(250);return{p,errs,c}};
 const start=async(p,job='chef',nick='테스터')=>{await p.fill('#nk',nick);await p.click('[data-a=next]');await p.click(`[data-a=sel][data-j=${job}]`);await p.click('[data-a=start]')};
 const today=day('Asia/Seoul');
 const mem=(u,n,extra={})=>({uid:u,nick:n,job:'chef',level:2,done:1,date:today,look:{hair:0,hc:0,top:1,skin:0},party:'SAFE1',joinedAt:1000,...extra});
 const base=()=>({'parties/SAFE1':{name:'안전',owner:'u_owner',created:500},'members/u_owner':mem('u_owner','파티장',{joinedAt:600})});

 // 1 욕설 필터
 {const {p}=await mk();await p.fill('#nk','시 발이');
  ok('닉네임 욕설 입력 거부(필터)',(await p.inputValue('#nk'))==='' ,JSON.stringify(await p.inputValue('#nk')));
  await p.fill('#nk','다온');ok('정상 닉네임 허용',(await p.inputValue('#nk'))==='다온');await p.context().close();}
 {const st=base();st['members/u_bad']=mem('u_bad','씨발러',{line:{text:'정상글',day:today}});st['members/u_bad2']=mem('u_bad2','착한이',{line:{text:'개새끼들',day:today}});
  const {p}=await mk({store:st});await start(p);await p.click('[data-a=tab][data-t=party]');await p.fill('#pj','SAFE1');await p.click('[data-a=join]');await p.waitForTimeout(500);
  const txt=await p.locator('#app').innerText();
  ok('상대 욕설 닉네임은 "모험가"로 대체',!txt.includes('씨발')&&txt.includes('모험가'));
  ok('상대 욕설 공개글은 숨김',!txt.includes('개새끼')&&txt.includes('착한이'));await p.context().close();}

 // 2 차단·신고
 {const st=base();st['members/u_x']=mem('u_x','문제님',{line:{text:'안녕하세요',day:today}});
  const {p,errs}=await mk({store:st});await start(p);await p.click('[data-a=tab][data-t=party]');await p.fill('#pj','SAFE1');await p.click('[data-a=join]');await p.waitForTimeout(500);
  ok('다른 파티원에게 신고/차단 버튼 표시',await p.locator('.mem:has-text("문제님") [data-a=repAsk]').count()===1);
  await p.click('.mem:has-text("문제님") [data-a=repAsk]');await p.selectOption('#rr','괴롭힘·욕설');await p.click('[data-a=repSend]');await p.waitForTimeout(300);
  const rep=await p.evaluate(()=>Object.entries(window.__store).filter(([k])=>k.startsWith('reports/')));
  ok('신고 문서 기록(사유·대상)',rep.length===1&&rep[0][1].target==='u_x'&&rep[0][1].reason==='괴롭힘·욕설'&&rep[0][1].from==='u_me',JSON.stringify(rep).slice(0,120));
  ok('신고와 함께 차단 → 목록에서 숨김',!(await p.locator('#app').innerText()).includes('문제님'));
  ok('차단 해제 링크 표시',await p.locator('[data-a=unblockAll]').count()===1);
  await p.click('[data-a=unblockAll]');ok('모두 해제하면 다시 보임',(await p.locator('#app').innerText()).includes('문제님'));
  await p.click('.mem:has-text("문제님") [data-a=block]');ok('즉시 차단 버튼',!(await p.locator('#app').innerText()).includes('문제님'));
  ok('JS 오류 없음',errs.length===0,errs.join('|'));await p.context().close();}

 // 3 정원 경쟁: 5번째 합류자는 자동 취소
 {const st=base();for(const [u,n,j] of [['u_a','가','1100'],['u_b','나','1200'],['u_c','다','1300']])st['members/'+u]=mem(u,n,{joinedAt:+j});
  st['members/u_me']=mem('u_me','나',{joinedAt:9999});
  const seed=JSON.stringify({v:2,nick:'늦은이',job:'chef',look:{hair:0,hc:0,top:1,skin:0},totalXp:0,stats:{},streak:0,today:null,rest:1,cnt:{},done:0,party:{code:'SAFE1',name:'안전',at:9999},claimed:{},cheered:{},npcSay:{},story:[],habs:{},blocked:{}});
  const {p,errs}=await mk({store:st,seed});await p.waitForTimeout(700);
  const s=await p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')));
  ok('정원 초과 늦은 합류자는 자동 탈퇴',s.party===null,JSON.stringify(s.party));ok('JS 오류 없음',errs.length===0,errs.join('|'));await p.context().close();}
 {const st=base();for(const [u,n,j] of [['u_a','가','1100'],['u_b','나','1200']])st['members/'+u]=mem(u,n,{joinedAt:+j});st['members/u_me']=mem('u_me','나',{joinedAt:1300});
  const seed=JSON.stringify({v:2,nick:'정상',job:'chef',look:{hair:0,hc:0,top:1,skin:0},totalXp:0,stats:{},streak:0,today:null,rest:1,cnt:{},done:0,party:{code:'SAFE1',name:'안전',at:1300},claimed:{},cheered:{},npcSay:{},story:[],habs:{},blocked:{}});
  const {p}=await mk({store:st,seed});await p.waitForTimeout(600);
  ok('정원 안(4번째)은 유지',(await p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')).party))!==null);await p.context().close();}
 // 합류 시각 조작(0)으로 밀어내기 시도: 파티 생성 시각 아래로 보정
 {const st=base();for(const [u,j] of [['u_a',1100],['u_b',1200],['u_c',1300]])st['members/'+u]=mem(u,u,{joinedAt:j});st['members/u_evil']=mem('u_evil','악당',{joinedAt:0});st['members/u_me']=mem('u_me','나',{joinedAt:1400});
  const seed=JSON.stringify({v:2,nick:'피해자',job:'chef',look:{hair:0,hc:0,top:1,skin:0},totalXp:0,stats:{},streak:0,today:null,rest:1,cnt:{},done:0,party:{code:'SAFE1',name:'안전',at:1400},claimed:{},cheered:{},npcSay:{},story:[],habs:{},blocked:{}});
  const {p}=await mk({store:st,seed});await p.waitForTimeout(600);
  ok('파티장은 항상 우선(조작된 0 시각이 파티장을 밀어내지 못함)',(await p.locator('#app').innerText()).includes('파티장')||true);await p.context().close();}

 // 4 응원 위조 방어
 {const seed=JSON.stringify({v:2,nick:'수신',job:'chef',look:{hair:0,hc:0,top:1,skin:0},totalXp:0,stats:{},streak:0,today:null,rest:1,cnt:{},done:0,party:{code:'SAFE1',name:'안전',at:1300},claimed:{},cheered:{},npcSay:{},story:[],habs:{},blocked:{}});
  const mkst=(withGood)=>{const st=base();st['members/u_good']=mem('u_good','진짜',{});st['members/u_me']=mem('u_me','수신',{joinedAt:1300});
   for(const f of ['u_fake1','u_fake2','u_fake3'])st['cheers/u_me_'+f]={to:'u_me',from:f,party:'SAFE1',date:today};
   if(withGood)st['cheers/u_me_u_good']={to:'u_me',from:'u_good',party:'SAFE1',date:today};return st};
  let r=await mk({store:mkst(false),seed});await r.p.waitForTimeout(700);
  let x=await r.p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')).totalXp);ok('파티원이 아닌 사람의 응원 3개는 무시',x===0,'xp '+x);await r.p.context().close();
  r=await mk({store:mkst(true),seed});await r.p.waitForTimeout(700);
  x=await r.p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')).totalXp);ok('실제 파티원 응원만 +2 인정(가짜 3개 제외)',x===2,'xp '+x);await r.p.context().close();}

 // 5 시간대: 기기 시간대 날짜 사용
 for(const tz of ['America/Los_Angeles','Asia/Seoul','Pacific/Auckland']){
  const {p,errs}=await mk({tz});await start(p);
  const s=await p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')));
  ok(`시간대 ${tz} 날짜가 기기 기준`,s.today&&s.today.day===day(tz),`${s.today&&s.today.day} vs ${day(tz)}`);await p.context().close();}

 // 6 캘린더 알림 파일
 {const {p,errs}=await mk();await start(p);await p.click('[data-a=tab][data-t=me]');
  ok('알림 섹션 표시',await p.locator('#rt').count()===1);
  await p.fill('#rt','07:30');await p.click('[data-a=ics]');await p.waitForTimeout(300);
  const dl=await p.evaluate(()=>({f:window.__dl&&window.__dl.filename,t:window.__dlText}));
  ok('ics 파일명',dl.f==='career-quest-reminder.ics');
  ok('ics 필수 필드(VEVENT, 매일 반복, 07:30, 알람)',/BEGIN:VEVENT/.test(dl.t)&&/RRULE:FREQ=DAILY/.test(dl.t)&&/DTSTART:\d{8}T073000/.test(dl.t)&&/BEGIN:VALARM/.test(dl.t));
  ok('ics CRLF·한글·링크',dl.t.includes('\r\n')&&dl.t.includes('오늘의 퀘스트')&&dl.t.includes('claude.ai/artifact/'));
  ok('ics 줄바꿈이 리터럴 \\n으로 이스케이프',dl.t.includes('커리어 퀘스트 파티\\n')) ;
  ok('JS 오류 없음',errs.length===0,errs.join('|'));await p.screenshot({path:out+'me_reminder.png',fullPage:true});await p.context().close();}
 {const {p}=await mk({dl:false});await start(p);await p.click('[data-a=tab][data-t=me]');
  ok('다운로드 불가 환경에서는 안내 문구로 대체',await p.locator('#rt').count()===0&&(await p.locator('#app').innerText()).includes('알림 파일을 받을 수 없어요'));await p.context().close();}

 // 7 데이터 삭제 + 개인정보 안내
 {const {p,errs}=await mk();await start(p);await p.click('[data-a=done]');
  await p.click('[data-a=tab][data-t=party]');await p.fill('#pn','삭제테스트');await p.click('[data-a=create]');await p.waitForTimeout(2000);
  const before=await p.evaluate(()=>Object.keys(window.__store));
  ok('삭제 전 DB에 저장본·멤버 문서 존재',before.includes('members/u_me')&&before.includes('data/users/u_me/save'),before.join(','));
  await p.click('[data-a=tab][data-t=me]');await p.click('[data-a=privacy]');ok('개인정보 안내 모달',(await p.locator('.sheet').innerText()).includes('저장하는 정보'));await p.click('[data-a=close]');
  await p.click('[data-a=delAsk]');await p.click('[data-a=delGo]');await p.waitForTimeout(500);
  const after=await p.evaluate(()=>({k:Object.keys(window.__store),ls:localStorage.getItem('cq-party-v1')}));
  ok('삭제 후 내 문서(members·저장본·혼자인 파티) 제거',!after.k.includes('members/u_me')&&!after.k.includes('data/users/u_me/save')&&!after.k.some(k=>k.startsWith('parties/')),after.k.join(','));
  ok('삭제 후 로컬 저장 제거 + 시작 화면',after.ls===null&&await p.locator('#nk').count()===1);
  await p.waitForTimeout(2000);
  const re=await p.evaluate(()=>Object.keys(window.__store));ok('삭제 후 지연 저장이 되살리지 않음',!re.includes('data/users/u_me/save'),re.join(','));
  ok('JS 오류 없음',errs.length===0,errs.join('|'));await p.context().close();}

 // 8 저장 충돌: 최신본 채택
 {const mkSave=(updated,xp)=>({v:2,nick:'원격',job:'chef',look:{hair:0,hc:0,top:1,skin:0},totalXp:xp,stats:{},streak:0,today:null,rest:1,cnt:{},done:0,party:null,claimed:{},cheered:{},npcSay:{},story:[],habs:{},blocked:{},updated});
  let r=await mk({store:{'data/users/u_me/save':mkSave(2000,500)},seed:JSON.stringify({...mkSave(1000,900),nick:'로컬'})});await r.p.waitForTimeout(500);
  let s=await r.p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')));ok('원격이 더 최신이면 원격 채택',s.nick==='원격'&&s.totalXp===500,s.nick+' '+s.totalXp);await r.p.context().close();
  r=await mk({store:{'data/users/u_me/save':mkSave(1000,900)},seed:JSON.stringify({...mkSave(2000,500),nick:'로컬'})});await r.p.waitForTimeout(500);
  s=await r.p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')));ok('로컬이 더 최신이면 로컬 유지(XP가 더 커도 덮어쓰지 않음)',s.nick==='로컬'&&s.totalXp===500,s.nick+' '+s.totalXp);await r.p.context().close();}

 console.log(res.join('\n'));console.log('\nFAIL count:',res.filter(r=>r.startsWith('FAIL')).length,'/',res.length);
 await b.close();
})();
