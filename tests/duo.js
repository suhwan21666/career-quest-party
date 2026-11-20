const {chromium}=require('playwright');
const FILE='file:///tmp/claude-0/-home-claude/11c39566-7110-5737-8b80-1278e6e73b14/scratchpad/build/index.html';
const out='/tmp/claude-0/-home-claude/11c39566-7110-5737-8b80-1278e6e73b14/scratchpad/build/qa/';
const res=[];const ok=(n,c,x='')=>res.push((c?'PASS':'FAIL')+' '+n+(x?'  '+x:''));
(async()=>{
 const b=await chromium.launch();const store={};const pages=[];
 const notify=async()=>{for(const p of pages)await p.evaluate(()=>window.__notify&&window.__notify()).catch(()=>{})};
 const mk=async(uid,job,nick)=>{
  const c=await b.newContext({timezoneId:'Asia/Seoul',viewport:{width:400,height:820},deviceScaleFactor:2});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.exposeFunction('__dbGet',path=>store[path]===undefined?null:store[path]);
  await p.exposeFunction('__dbSet',async(path,v)=>{store[path]=JSON.parse(JSON.stringify(v));setTimeout(notify,0);return 1});
  await p.exposeFunction('__dbList',(cp,k,v)=>Object.keys(store).filter(x=>x.startsWith(cp+'/')&&x.split('/').length===2).map(x=>({id:x.split('/')[1],v:store[x]})).filter(d=>k===null||d.v[k]===v));
  await p.addInitScript(u=>{const subs=[];window.__notify=()=>subs.forEach(s=>s());
   const snap=(id,v)=>({id,exists:v!==null&&v!==undefined,data:()=>v});
   const db={doc:path=>({get:async()=>snap(path.split('/').pop(),await window.__dbGet(path)),set:async v=>{await window.__dbSet(path,v)}}),
    collection:cp=>{const mkq=(k,v)=>({where:(k2,o,v2)=>mkq(k2,v2),get:async()=>{const l=(await window.__dbList(cp,k,v)).map(d=>snap(d.id,d.v));return{docs:l,size:l.length}},
      onSnapshot:cb=>{const run=async()=>{const l=(await window.__dbList(cp,k,v)).map(d=>snap(d.id,d.v));cb({docs:l,size:l.length})};subs.push(run);setTimeout(run,0);return()=>{}}});return mkq(null,null)}};
   window.claude={use:async n=>n==='db'?db:n==='user'?{id:async()=>u,can:async()=>true}:null}},uid);
  pages.push(p);await p.goto(FILE);await p.waitForTimeout(200);
  await p.fill('#nk',nick);await p.click('[data-a=next]');await p.click(`[data-a=sel][data-j=${job}]`);await p.click('[data-a=start]');
  return{p,errs}};
 const A=await mk('u_alice','teacher','하늘'),B=await mk('u_bob','developer','다온');
 const done3=async P=>{const p=P.p;await p.click('[data-a=tab][data-t=today]');await p.click('.q.act [data-a=done]');await p.click('.q.com [data-a=done]');
  await p.click('.q.story [data-a=open]');await p.fill('#st','오늘의 한 줄입니다');await p.click('#wb');await p.waitForTimeout(150)};
 const xp=async P=>(await P.p.evaluate(()=>JSON.parse(localStorage.getItem('cq-party-v1')).totalXp));
 // A 파티 생성
 await A.p.click('[data-a=tab][data-t=party]');await A.p.fill('#pn','우리파티');await A.p.click('[data-a=create]');await A.p.waitForTimeout(500);
 const code=await A.p.locator('#pc').innerText();ok('A 파티 생성',/^[A-Z2-9]{5}$/.test(code),code);
 // B 합류
 await B.p.click('[data-a=tab][data-t=party]');await B.p.fill('#pj',code.toLowerCase());await B.p.click('[data-a=join]');await B.p.waitForTimeout(700);
 ok('B 합류(소문자 코드 허용)',await B.p.locator('#pc').count()===1);
 await A.p.waitForTimeout(500);
 ok('A 화면에 B 표시',(await A.p.locator('.mem').allInnerTexts()).join('|').includes('다온'));
 ok('B 화면에 A 표시',(await B.p.locator('.mem').allInnerTexts()).join('|').includes('하늘'));
 ok('멤버 2/4 표시',(await A.p.locator('#app').innerText()).includes('멤버 2/4'));
 // A 퀘스트 → B 화면 실시간
 await done3(A);await A.p.click('[data-a=tab][data-t=party]');await B.p.waitForTimeout(700);
 const bView=(await B.p.locator('.mem').allInnerTexts()).join('|');
 ok('A 진행도(3칸)가 B에 반영',(await B.p.locator('.mem:has-text("하늘") .dots b.on').count())===3,bView.slice(0,60));
 ok('A가 공개 안 한 글은 B에 안 보임',!bView.includes('오늘의 한 줄입니다'));
 // 응원
 const xpA0=await xp(A);
 await B.p.click('.mem:has-text("하늘") [data-a=cheer]');await B.p.waitForTimeout(800);
 const xpA1=await xp(A);
 ok('B 응원 → A가 응원 경험치 수령',xpA1>xpA0,`${xpA0}→${xpA1}`);
 ok('B 응원 버튼 비활성(하루 1회)',await B.p.locator('.mem:has-text("하늘") [data-a=cheer]').isDisabled());
 // 중복 수령 방지: A 새로고침 후 재수령 없음
 await A.p.reload();await A.p.waitForTimeout(700);
 ok('새로고침해도 응원 중복 수령 없음',await xp(A)===xpA1,`${await xp(A)}`);
 // 보물상자: 목표 6
 await done3(B);await B.p.click('[data-a=tab][data-t=party]');await B.p.waitForTimeout(600);await A.p.waitForTimeout(300);
 await A.p.click('[data-a=tab][data-t=party]');await A.p.waitForTimeout(500);
 ok('합계 6/6이면 상자 열기 가능',await A.p.locator('[data-a=chest]').isEnabled()&&await B.p.locator('[data-a=chest]').isEnabled());
 const a0=await xp(A);await A.p.click('[data-a=chest]');await A.p.waitForTimeout(300);
 ok('A 상자 수령(+25 XP 이상)',(await xp(A))-a0>=25,`${a0}→${await xp(A)}`);
 await A.p.click('[data-a=close]');ok('A 상자 1일 1회',await A.p.locator('[data-a=chest]').isDisabled());
 await A.p.screenshot({path:out+'duo_A_party.png'});
 await B.p.screenshot({path:out+'duo_B_party.png'});
 // 나가기 → A 목록에서 B 사라짐
 await B.p.click('[data-a=leaveAsk]');await B.p.click('[data-a=leave]');await A.p.waitForTimeout(700);
 ok('B 나가면 A 목록에서 사라짐',!(await A.p.locator('.mem').allInnerTexts()).join('|').includes('다온'));
 ok('두 화면 JS 오류 없음',A.errs.length+B.errs.length===0,A.errs.concat(B.errs).join('|'));
 console.log(res.join('\n'));console.log('\nFAIL count:',res.filter(r=>r.startsWith('FAIL')).length,'/',res.length);
 await b.close();
})();
