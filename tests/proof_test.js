const {chromium,devices}=require('playwright');const path=require('path');let f=0;const ok=(c,m,x)=>{console.log((c?'PASS ':'FAIL ')+m+(x?' '+x:''));if(!c)f++};
const F='file://'+path.resolve('out/career-quest-party.html');
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8Dwn4EIwDiqkL4KAEzvA/4S3E6sAAAAAElFTkSuQmCC','base64');
(async()=>{const b=await chromium.launch();
for(const [dn,dev] of [['iph',devices['iPhone 13']],['desk',{viewport:{width:1000,height:800}}]]){
 const c=await b.newContext({...dev,timezoneId:'Asia/Seoul'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(F);await p.waitForTimeout(400);
 await p.fill('#nk','테스터');await p.click('[data-a=next]');await p.click('[data-a=explore]');await p.click('[data-a=exstart][data-j=marketer]');await p.waitForTimeout(500);
 ok(/증빙 남기기/.test(await p.locator('article.habit').innerText()),dn+' 습관 카드에 증빙 남기기');
 await p.click('[data-a=evstart]');await p.waitForTimeout(200);
 await p.click('[data-a=evsave]');await p.waitForTimeout(150);
 ok(/하나를 남겨/.test(await p.locator('.sheet').innerText()),dn+' 아무것도 없이 저장 → 안내');
 await p.fill('#evlink','javascript:alert(1)');await p.click('[data-a=evsave]');await p.waitForTimeout(150);
 ok(/https:\/\//.test(await p.locator('.sheet .err').innerText())&&await p.evaluate(()=>CQ_DEV.hab.S.prf.length)===0,dn+' 잘못된 링크(javascript:) 거부');
 await p.fill('#evlink','https://example.com/my-post');await p.fill('#evnote','광고 문구 초안');
 await p.setInputFiles('#evfile',{name:'a.png',mimeType:'image/png',buffer:PNG});await p.waitForTimeout(500);
 ok(await p.locator('.sheet img.evimg').count()===1,dn+' 사진 미리보기');
 ok(await p.inputValue('#evlink')==='https://example.com/my-post'&&await p.inputValue('#evnote')==='광고 문구 초안',dn+' 사진 고른 뒤에도 쓴 글 유지');
 await p.click('[data-a=evsave]');await p.waitForTimeout(300);
 let s=await p.evaluate(()=>({prf:CQ_DEV.hab.S.prf,imgs:Object.keys(CQ_DEV.hab.pimg()),ls:!!localStorage.getItem('cq-proof-img'),inState:JSON.stringify(CQ_DEV.hab.S).includes('data:image')}));
 ok(s.prf.length===1&&s.prf[0].p===1&&s.prf[0].u&&s.imgs.length===1&&s.ls,dn+' 증빙 저장(사진은 별도 키)',JSON.stringify(s.prf[0]));
 ok(!s.inState,dn+' 사진 데이터가 기록(S)·서버 동기화 데이터에 섞이지 않음');
 // 직접 경험 Lv5 + 증빙 첨부
 await p.evaluate(()=>{const D=CQ_DEV.hab,S=D.S;S.habs['marketer:3']={streak:3,best:3,total:3,last:D.KST(),days:[]};S.hab='marketer:4';S.today.qs.find(q=>q.k==='habit').done=0;D.save()});await p.waitForTimeout(200);
 await p.locator('[data-a=hab][data-m="0"]').first().click();await p.waitForTimeout(250);
 ok(/사진·링크 증빙/.test(await p.locator('.sheet').innerText()),dn+' 직접 경험 기록 창에 증빙(선택) 영역');
 await p.fill('#fbnote','SNS 글 올림');await p.locator('.evd summary').click();await p.fill('#evlink','https://example.com/sns');
 await p.click('[data-a=proofgo]');await p.waitForTimeout(400);
 s=await p.evaluate(()=>({n:CQ_DEV.hab.S.prf.length,l:CQ_DEV.hab.S.prf[CQ_DEV.hab.S.prf.length-1],d:CQ_DEV.hab.S.today.qs.find(q=>q.k==='habit').done}));
 ok(s.d&&s.n===2&&s.l.h==='marketer:4'&&s.l.u==='https://example.com/sns'&&s.l.t==='SNS 글 올림',dn+' 완료와 함께 증빙 저장',JSON.stringify(s.l));
 // 나 탭
 await p.click('[data-a=tab][data-t=me]');await p.waitForTimeout(250);await p.click('[data-a=fold][data-k=proof]');await p.waitForTimeout(200);
 ok(await p.locator('.prfl .pr').count()===2&&await p.locator('.prfl img.evimg').count()===1,dn+' 내 경험 증빙 목록(사진 1·링크 2)');
 const a=await p.locator('.prfl a').first().getAttribute('rel');ok(/noopener/.test(a||''),dn+' 링크는 noopener');
 await p.locator('.prfl').scrollIntoViewIfNeeded();await p.screenshot({path:`shots6/pf_${dn}_list.png`});
 ok(/📎 증빙 2/.test(await p.locator('.grow').innerText()),dn+' 직업 경험 기록에 증빙 수');
 await p.locator('[data-a=evdel]').last().click();await p.waitForTimeout(200);
 ok(await p.evaluate(()=>CQ_DEV.hab.S.prf.length)===1,dn+' 삭제(링크 증빙)');
 await p.locator('[data-a=evdel]').first().click();await p.waitForTimeout(200);
 ok(await p.evaluate(()=>CQ_DEV.hab.S.prf.length===0&&Object.keys(CQ_DEV.hab.pimg()).length===0),dn+' 삭제하면 사진 데이터도 지워짐');
 // 사진 20장 한도
 const r=await p.evaluate(()=>{const D=CQ_DEV.hab;for(let i=0;i<23;i++)D.addProof('marketer:0',{img:'data:image/jpeg;base64,AAAA',note:'n'+i});return{p:D.S.prf.filter(x=>x.p).length,n:D.S.prf.length,im:Object.keys(D.pimg()).length}});
 ok(r.p===20&&r.im===20&&r.n===23,dn+' 사진 최근 20장만 보관(기록은 유지)',JSON.stringify(r));
 const m=await p.evaluate(()=>CQ_DEV.hab.metrics().prf);ok(m===23,dn+' 지표에 증빙 수',String(m));
 const sm=await p.evaluate(()=>CQ_DEV.hab.admSummary([{mf:2,md:3},{mf:0,md:1}]));ok(/증빙을 남긴 사람 1명 \(50%\)/.test(sm),dn+' 관리자 요약에 증빙');
 // 데이터 삭제
 await p.click('[data-a=fold][data-k=set]');await p.waitForTimeout(150);await p.click('[data-a=delAsk]');await p.waitForTimeout(150);await p.click('[data-a=delGo]');await p.waitForTimeout(400);
 ok(await p.evaluate(()=>localStorage.getItem('cq-proof-img'))===null,dn+' 내 데이터 삭제 시 증빙 사진도 삭제');
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),dn+' 가로 넘침 없음');ok(!errs.length,dn+' 오류 없음',errs.join('|'));
 await c.close()}
await b.close();console.log(f?'FAILS '+f:'ALL PASS');process.exit(f?1:0)})();
