const {chromium,devices}=require('playwright');const path=require('path');let f=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x?' '+x:''));if(!c)f++};
const F='file://'+path.resolve('out/career-quest-party.html');
(async()=>{const b=await chromium.launch();
for(const [dn,dev] of [['iph',devices['iPhone 13']],['desk',{viewport:{width:1000,height:800}}]]){
 const c=await b.newContext({...dev,timezoneId:'Asia/Seoul'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(F);await p.waitForTimeout(400);
 await p.fill('#nk','테스터');await p.click('[data-a=next]');await p.waitForTimeout(150);
 await p.click('[data-a=diagstart]');await p.waitForTimeout(200);
 ok(await p.locator('.dc').count()===8,dn+' 진단 1단계: 끌리는 활동 8개');
 ok(await p.locator('[data-a=dnext]').isDisabled(),dn+' 아무것도 안 고르면 다음 비활성');
 for(const s of ['creativity','collaboration','empathy','execution'])await p.click(`[data-a=dpick][data-s=${s}]`);
 ok(await p.locator('.dc[aria-pressed=true]').count()===3,dn+' 최대 3개까지만 선택');
 await p.click('[data-a=dpick][data-s=execution]');await p.click('[data-a=dnext]');await p.waitForTimeout(200);
 ok(await p.locator('.rq').count()===8&&await p.locator('[data-a=dnext]').isDisabled(),dn+' 2단계: 자기평가 8문항, 모두 답해야 진행');
 for(const s of ['creativity','problemSolving','collaboration','leadership','empathy','analytical','execution','challenge'])await p.click(`[data-a=drate][data-s=${s}][data-v="3"]`);
 await p.click('[data-a=dnext]');await p.waitForTimeout(250);
 ok(await p.locator('.exj').count()===3,dn+' 3단계: 추천 직업 3개');
 const st=await p.evaluate(()=>({a:CQ_DEV.hab.S.assess,d:CQ_DEV.hab.S.diag}));
 ok(st.a.length===1&&st.a[0].k==='pre'&&st.a[0].r.creativity===3&&st.d.picks.length===3&&st.d.top.length===3,dn+' 기준(pre) 자기평가·진단 결과 저장',JSON.stringify(st.d.top));
 const top=await p.evaluate(()=>CQ_DEV.hab.diagRec(['creativity','collaboration','empathy']));ok(top.length===3,dn+' 추천 로직',top.join(','));
 await p.screenshot({path:`shots6/dg_${dn}_result.png`});
 await p.click('[data-a=exstart]');await p.waitForTimeout(500);
 ok(await p.locator('article.habit').count()>0,dn+' 추천 직업 5분 해보기 → 오늘 화면');
 // 효과 측정
 await p.evaluate(()=>{const D=CQ_DEV.hab,S=D.S;S.actd=['2026-11-01','2026-11-03','2026-11-09'];S.assess[0].d='2026-11-01';D.save()});await p.waitForTimeout(200);
 ok(/14일이 지났어요/.test(await p.locator('#app').innerText()),dn+' 14일 후 오늘 탭에 다시 평가 안내');
 await p.click('[data-a=chkstart]');await p.waitForTimeout(200);
 for(const [s,v] of [['creativity',4],['problemSolving',3],['collaboration',5],['leadership',3],['empathy',4],['analytical',3],['execution',4],['challenge',4]])await p.click(`[data-a=drate][data-s=${s}][data-v="${v}"]`);
 await p.click('[data-a=dnext]');await p.waitForTimeout(300);
 const m=await p.evaluate(()=>CQ_DEV.hab.metrics());
 ok(m.ret7===true&&m.days===3&&Math.abs(m.delta-0.75)<0.01&&m.pre===3,dn+' 지표 계산(활동일·7일 지속·변화 +0.75)',JSON.stringify({d:m.days,r:m.ret7,dl:m.delta,p:m.pre,c:m.chk}));
 const chg=await p.locator('.chg').innerText();ok(/창의력/.test(chg)&&/\+1/.test(chg),dn+' 나 → 내 변화: 항목별 변화 표시',chg.replace(/\n/g,' ').slice(0,60));
 await p.locator('.chg').scrollIntoViewIfNeeded();await p.screenshot({path:`shots6/dg_${dn}_change.png`});
 ok(!/14일이 지났어요/.test(await p.evaluate(()=>{CQ_DEV.hab.S.tab;return ''})),'');
 const txt=await p.evaluate(()=>{const D=CQ_DEV.hab;return D.metrics()&&typeof D.metrics().fun});ok(txt==='number',dn+' 지표 객체');
 // 관리자 요약
 const sm=await p.evaluate(()=>CQ_DEV.hab.admSummary([{md:5,mj:2,mdr:3,ma:1,mr:1,mp:30,mc:36},{md:2,mj:1,mdr:0,ma:0,mr:0,mp:0,mc:0}]));
 ok(/7일 이상 이어간 사람 1명 \(50%\)/.test(sm)&&/0\.6점/.test(sm),dn+' 관리자 효과 지표 요약',sm.replace(/<[^>]+>/g,' ').slice(0,120));
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),dn+' 가로 넘침 없음');ok(!errs.length,dn+' 오류 없음',errs.join('|'));
 await c.close()}
await b.close();console.log(f?'FAILS '+f:'ALL PASS');process.exit(f?1:0)})();
