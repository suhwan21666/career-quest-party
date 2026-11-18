/* ---------- 생활 장소: 회사·집·운동장·학교·병원. 아침/점심/저녁 좋은 습관 + 선택 알림 ---------- */
/* 습관은 건강·의학적 효과를 단정하지 않는 아주 작은 행동만 담았다: [제목, 최소 버전, 키우는 역량] */
const SL=[{k:'m',n:'아침',t:'08:00',h:[5,11]},{k:'n',n:'점심',t:'12:30',h:[11,16]},{k:'e',n:'저녁',t:'19:00',h:[16,29]}];
const PLACES={
 office:{n:'회사',sub:'빌딩',jobs:['developer','accountant','marketer','lawyer','designer'],st:{m:'출근 로비',n:'휴게 라운지',e:'퇴근 게이트'},
  hb:{m:[['오늘 할 일 3개 적기','가장 중요한 일 한 가지만 적기','execution'],['책상 1분 정리','물건 하나만 제자리에 두기','execution'],['동료에게 아침 인사','"좋은 아침" 한마디 건네기','collaboration']],
      n:[['자리에서 일어나기','일어나서 어깨 한 번 돌리기','execution'],['물 한 컵','한 모금이라도 마시기','execution'],['천천히 먹기','첫 세 입만 천천히 씹기','problemSolving']],
      e:[['내일 첫 할 일 적기','한 줄만 적어 두기','problemSolving'],['오늘 잘한 일 한 줄','작은 일이어도 하나 적기','analytical'],['숨 고르기','깊게 숨 세 번 쉬고 퇴근하기','execution']]}},
 home:{n:'집',sub:'아파트',jobs:['chef','creator'],st:{m:'침실',n:'주방',e:'거실'},
  hb:{m:[['이불 정리','베개만 가지런히 놓아도 좋아요','execution'],['창문 열기','1분만 환기하기','execution'],['물 한 컵','일어나서 한 모금 마시기','execution']],
      n:[['직접 챙긴 한 끼','과일 한 조각이어도 좋아요','creativity'],['식사 후 바로 헹구기','그릇 하나만 헹구기','execution'],['화면 내려놓고 먹기','첫 다섯 입만 화면 없이','empathy']],
      e:[['오늘 감사 한 줄','고마웠던 일 하나 적기','empathy'],['내일 입을 옷 꺼내두기','양말 하나만이라도','execution'],['잠들기 전 화면 내려놓기','책 한 쪽 읽고 눕기','creativity']]}},
 field:{n:'운동장',sub:'취미 활동',jobs:['athlete','firefighter','police','soldier'],st:{m:'트랙',n:'벤치',e:'스탠드'},
  hb:{m:[['스트레칭 1분','목·어깨만 가볍게 풀기','execution'],['집 앞 한 바퀴','5분만 걷기','challenge'],['오늘 몸 상태 한 단어','느낌을 한 단어로 적기','analytical']],
      n:[['바깥 공기 3분','밖에 나가 잠깐 서 있기','execution'],['계단 한 층','엘리베이터 대신 한 층만','challenge'],['취미 5분','하고 싶은 취미를 5분만','creativity']],
      e:[['취미 10분','그리기·악기·글쓰기 무엇이든','creativity'],['운동 기록 한 줄','시간이나 거리 숫자 하나','analytical'],['가볍게 10분 걷기','저녁 바람 쐬며 걷기','execution']]}},
 school:{n:'학교',sub:'배움터',jobs:['teacher','researcher'],st:{m:'교문',n:'급식실',e:'도서관'},
  hb:{m:[['오늘 배울 것 하나 정하기','궁금한 것 한 가지만','analytical'],['인사 먼저 건네기','눈 마주치고 인사 한마디','collaboration'],['책 한 쪽 읽기','한 쪽만 읽기','creativity']],
      n:[['식사 전 감사 한마디','"잘 먹겠습니다" 소리 내기','empathy'],['먹을 만큼만 담기','남기지 않게 조금씩','execution'],['옆 사람과 한마디','가벼운 안부 한 줄','collaboration']],
      e:[['오늘 배운 것 한 줄','쉬운 말로 적어 보기','leadership'],['모르는 것 하나 찾아보기','검색이나 책으로 한 가지','challenge'],['책 두 쪽 읽기','한 쪽이어도 좋아요','creativity']]}},
 hospital:{n:'병원',sub:'돌봄',jobs:['nurse','doctor','social-worker'],st:{m:'로비',n:'휴게실',e:'회복실'},
  hb:{m:[['손 씻기 20초','비누로 천천히 씻기','execution'],['물 한 컵','한 모금이라도 마시기','execution'],['오늘의 다짐 한 줄','친절하게 대하기 한 줄','empathy']],
      n:[['5분 걷기','복도나 밖을 가볍게','execution'],['눈 쉬기 1분','먼 곳 바라보기','execution'],['천천히 식사','첫 세 입만 천천히','problemSolving']],
      e:[['고마운 사람 떠올리기','한 명 이름 적기','empathy'],['어깨 스트레칭 1분','목과 어깨를 천천히','execution'],['내일 준비물 확인','한 가지만 챙겨 두기','problemSolving']]}}};
const PLIDS=Object.keys(PLACES);
const PLX={office:100,home:250,field:400,school:550,hospital:700};
const habOf=(p,s,i)=>{const h=((PLACES[p]||{}).hb||{})[s];return h&&h[i]?{id:p+'.'+s+i,p,s,i,t:h[0],mini:h[1],stat:h[2]}:null};
const PL_XP=4,PL_MAX=6;
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
function slotNow(){const h=kstHour();return(h>=5&&h<11)?'m':(h>=11&&h<16)?'n':'e'}
function plState(){if(!S.pl||S.pl.day!==KST())S.pl={day:KST(),ids:[],xp:0};return S.pl}
const plDone=id=>plState().ids.includes(id);
const plCount=p=>plState().ids.filter(x=>x.startsWith(p+'.')).length;
const myPlace=()=>PLIDS.find(p=>PLACES[p].jobs.includes(S.job))||null;
function doPlaceHabit(id){const m=/^(\w+)\.([mne])(\d)$/.exec(id||'');if(!m)return false;const h=habOf(m[1],m[2],+m[3]);if(!h)return false;const st=plState();if(st.ids.includes(id))return false;
  st.ids.push(id);let g=0;if(st.xp<PL_MAX){st.xp++;g=gain(PL_XP*mult())}
  S.stats[h.stat]=(S.stats[h.stat]||0)+1;S.done=(S.done||0)+1;
  toast(g?'+'+g+' XP · '+h.t:'기록했어요 · '+h.t+' (오늘 경험치는 다 채웠어요)');logLine(PLACES[h.p].n+'에서 "'+h.t+'"');persist();return true}

/* --- 알림: 시간대별 시각은 하나, 켜고 끄는 건 장소+시간대마다. 앱이 열려 있을 때 알려주고, 닫혀 있어도 오는 건 캘린더 파일이 담당한다 --- */
const alKey=(p,s)=>p+'.'+s;
const alOn=(p,s)=>!!(S.al&&S.al[alKey(p,s)]);
const alTime=s=>{const t=(S.alT&&S.alT[s])||SL.find(x=>x.k===s).t;return/^([01]\d|2[0-3]):[0-5]\d$/.test(t)?t:SL.find(x=>x.k===s).t};
const alPlaces=s=>PLIDS.filter(p=>alOn(p,s));
const notifState=()=>typeof Notification==='undefined'?'none':Notification.permission;
async function askNotif(){if(typeof Notification==='undefined'){toast('이 브라우저는 앱 알림을 지원하지 않아요. 캘린더 파일을 써 주세요');return}
  if(Notification.permission==='default'){try{await Notification.requestPermission()}catch(e){}}
  if(Notification.permission==='denied')toast('브라우저에서 알림이 꺼져 있어요. 앱 안에서만 알려드려요')}
function setAl(p,s,on){if(!PLACES[p]||!SL.some(x=>x.k===s))return;S.al=S.al||{};if(on)S.al[alKey(p,s)]=1;else delete S.al[alKey(p,s)];persist();if(on)askNotif()}
function setAlT(s,t){if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(t||''))return;S.alT=S.alT||{};S.alT[s]=t;persist()}
function alTick(){if(!S.job)return;const d=KST();if(!S.alF||S.alF.day!==d)S.alF={day:d,k:[]};
  SL.forEach(sl=>{const ps=alPlaces(sl.k);if(!ps.length||S.alF.k.includes(sl.k))return;const[hh,mm]=alTime(sl.k).split(':').map(Number),t=hh*60+mm,n=nowMin();
    if(n<t||n>=t+90)return;S.alF.k.push(sl.k);persist();
    const left=ps.map(p=>PLACES[p].n+' '+(3-[0,1,2].filter(i=>plDone(p+'.'+sl.k+i)).length)+'개').join(' · '),body=sl.n+' 습관 시간이에요. '+left+' 남았어요';
    toast(body);try{if(notifState()==='granted'){const nt=new Notification('커리어 퀘스트 파티',{body,tag:'cq-'+sl.k});nt.onclick=()=>{try{window.focus()}catch(e){}nt.close()}}}catch(e){}})}
async function makeAlIcs(){const stamp=new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z',L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Career Quest Party//KO','CALSCALE:GREGORIAN'];let n=0;
  SL.forEach(sl=>{const ps=alPlaces(sl.k);if(!ps.length)return;n++;const[hh,mm]=alTime(sl.k).split(':');
    L.push('BEGIN:VEVENT','UID:career-quest-'+sl.k+'@party','DTSTAMP:'+stamp,'DTSTART:'+KST().replace(/-/g,'')+'T'+hh+mm+'00','DURATION:PT10M','RRULE:FREQ=DAILY','SUMMARY:'+sl.n+' 좋은 습관 ('+ps.map(p=>PLACES[p].n).join('·')+')','DESCRIPTION:커리어 퀘스트 파티\\n'+PAGE_URL,'BEGIN:VALARM','TRIGGER:PT0S','ACTION:DISPLAY','DESCRIPTION:'+sl.n+' 습관 시간','END:VALARM','END:VEVENT')});
  if(!n){toast('먼저 알림을 받을 장소와 시간대를 골라 주세요');return}L.push('END:VCALENDAR');
  try{await dl.save({filename:'career-quest-habits.ics',data:new Blob([L.join('\r\n')],{type:'text/calendar'})});toast('알림 파일을 저장했어요')}catch(e){if(!e||e.code!=='dismissed')toast('저장하지 못했어요')}}
const nsTxt=()=>({granted:'앱 알림: 허용됨',denied:'앱 알림: 브라우저에서 꺼져 있어요',default:'앱 알림: 아직 허용 전이에요',none:'앱 알림: 이 브라우저는 지원하지 않아요'})[notifState()];
function alarmSec(){return`<section class="sec"><div class="hd"><h2>장소 습관 알림</h2><span class="sub">원하는 것만 골라요</span></div><div class="panel">
 <div class="muted" style="font-size:13px;margin-bottom:10px">알림을 받을 장소와 시간대를 직접 고르세요. 고르지 않으면 알림은 오지 않아요.</div>
 ${SL.map(sl=>`<div class="alrow"><div class="row" style="justify-content:space-between;align-items:center;margin-bottom:6px"><b>${sl.n}</b><input class="inp" type="time" data-alt="${sl.k}" value="${alTime(sl.k)}" style="max-width:130px;flex:none" aria-label="${sl.n} 알림 시각"></div><div class="row" style="flex-wrap:wrap;gap:6px">${PLIDS.map(p=>`<button class="chipbtn" data-a="altog" data-p="${p}" data-s="${sl.k}" aria-pressed="${alOn(p,sl.k)}">${PLACES[p].n}</button>`).join('')}</div></div>`).join('')}
 <div class="muted" style="font-size:13px;margin:10px 0">${nsTxt()}. 앱을 열어 둔 동안만 알려줘요. 앱이 닫혀 있어도 받으려면 아래 캘린더 파일을 쓰세요. 아이폰은 홈 화면에 추가한 앱에서만 앱 알림이 와요.</div>
 <div class="row" style="gap:8px;flex-wrap:wrap">${dl?`<button class="btn mint" data-a="alics">캘린더 알림 파일 받기</button>`:''}<button class="btn ghost" data-a="alperm">앱 알림 허용하기</button></div></div></section>
 <section class="sec"><div class="panel"><label class="row" style="align-items:center;gap:10px"><input type="checkbox" id="stpl"${S.startPlaza!==false?' checked':''}><span>접속하면 광화문 광장에서 시작하기</span></label></div></section>`}
function placeSec(){const my=myPlace(),sn=slotNow(),tot=PLIDS.reduce((a,p)=>a+plCount(p),0);
  return`<section class="sec"><div class="hd"><h2>생활 장소 습관</h2><span class="sub num">오늘 ${tot} / 45</span></div><div class="panel"><div class="muted" style="font-size:14px;margin-bottom:10px">회사·집·운동장·학교·병원에서 아침, 점심, 저녁에 할 수 있는 작은 습관이에요. 지금은 <b>${SL.find(x=>x.k===sn).n}</b> 시간이에요. 오늘 경험치는 ${PL_MAX}개까지 받아요.</div>
 <div class="plgrid">${PLIDS.map(p=>`<button class="plbtn" data-a="plc" data-p="${p}"><b>${PLACES[p].n}</b><span>${PLACES[p].sub}${p===my?' · 내 일터':''}</span><i class="num">${plCount(p)} / 9</i></button>`).join('')}</div></div></section>`}

/* --- 광장 남쪽 거리: 다섯 건물의 문 --- */
const PORTALS=PLIDS.map(p=>({id:'p_'+p,portal:p,name:PLACES[p].n,pts:[[PLX[p],1722]],r:48}));
PLIDS.forEach(p=>OBS.push([PLX[p]-58,1545,116,150]));
function drawStreet(g,leaf){
  const R=(x,y,w,h,f)=>{g.fillStyle=f;g.fillRect(x,y,w,h)},E=(x,y,rx,ry,f)=>{g.fillStyle=f;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill()};
  const T=(t,x,y,sz,col)=>{g.font='700 '+sz+'px "Noto Sans KR",system-ui,sans-serif';g.textAlign='center';g.lineWidth=3;g.strokeStyle='rgba(255,255,255,.92)';g.strokeText(t,x,y);g.fillStyle=col||'#1B2340';g.fillText(t,x,y)};
  R(0,1500,800,300,'#DDD7CA');R(0,1500,800,14,'#C9C2B2');R(0,425,40,1375,'#9BA6BC');R(760,425,40,1375,'#A8A39A');
  R(0,1500,40,300,'#9BA6BC');R(760,1500,40,300,'#A8A39A');g.fillStyle='rgba(255,255,255,.35)';for(let y=1510;y<1780;y+=34){g.fillRect(8,y,22,14);g.fillRect(770,y,22,14)}
  R(40,1500,80,300,'#8A91A0');R(680,1500,80,300,'#8A91A0');
  R(40,1696,720,84,'#CFC8B8');g.fillStyle='rgba(0,0,0,.08)';for(let x=40;x<760;x+=30)g.fillRect(x,1738,16,3);
  T('생활 거리',400,1528,13,'#5B6788');
  const bx=PLX;
  /* 회사: 유리 빌딩 */
  let x=bx.office;R(x-56,1556,112,138,'#4A5A82');R(x-56,1556,112,8,'#2E3A5C');for(let r=0;r<7;r++)for(let c=0;c<5;c++)R(x-50+c*21,1570+r*17,15,11,(r*c)%4===1?'#FFE08A':'#9CC7F0');R(x-12,1664,24,30,'#2B3550');T('회사',x,1548,13,'#2E3A5C');
  /* 집: 아파트 */
  x=bx.home;R(x-52,1560,104,134,'#E8D8BE');R(x-52,1560,104,8,'#C7A982');for(let r=0;r<6;r++)for(let c=0;c<4;c++){R(x-44+c*23,1574+r*19,16,12,(r+c)%3===0?'#FFE08A':'#A8D3EA');R(x-46+c*23,1587+r*19,20,3,'#B79A6D')}R(x-11,1662,22,32,'#8B6A47');T('집 (아파트)',x,1548,13,'#7A5A33');
  /* 운동장: 잔디 + 트랙 */
  x=bx.field;R(x-58,1576,116,118,'#8CC477');g.strokeStyle='#C4694A';g.lineWidth=9;g.beginPath();g.ellipse(x,1636,46,46,0,0,7);g.stroke();g.strokeStyle='#fff';g.lineWidth=2;g.strokeRect(x-26,1612,52,48);g.beginPath();g.moveTo(x,1612);g.lineTo(x,1660);g.stroke();R(x-58,1572,116,6,'#6E9F5C');R(x-12,1688,24,8,'#B9B2A2');T('운동장',x,1558,13,'#2F6E3C');
  /* 학교: 벽돌 + 시계탑 + 깃발 */
  x=bx.school;R(x-56,1590,112,104,'#C9785A');R(x-56,1590,112,7,'#8E4F38');R(x-18,1556,36,40,'#D7886A');g.fillStyle='#8E4F38';g.beginPath();g.moveTo(x-22,1556);g.lineTo(x,1536);g.lineTo(x+22,1556);g.closePath();g.fill();E(x,1572,9,9,'#FFF7DC');R(x-1,1566,2,7,'#333');R(x,1572,6,2,'#333');for(let c=0;c<4;c++){R(x-48+c*26,1608,18,16,'#CFE6F5');R(x-48+c*26,1640,18,16,'#CFE6F5')}R(x-12,1662,24,32,'#6B4A32');R(x+30,1520,2,40,'#555');R(x+32,1520,16,10,'#E8554E');T('학교',x,1706,13,'#8E4F38');
  /* 병원: 흰 건물 + 십자 */
  x=bx.hospital;R(x-52,1560,104,134,'#F4F8F8');R(x-52,1560,104,8,'#9CC8C8');R(x-9,1575,18,52,'#E8554E');R(x-26,1592,52,18,'#E8554E');for(let c=0;c<4;c++)R(x-44+c*23,1640,16,14,'#BFE3F0');R(x-12,1662,24,32,'#9CC8C8');T('병원',x,1548,13,'#2F6E6E');
  PLIDS.forEach(p=>{const px=bx[p];R(px-24,1696,48,6,'#F3E9A8');T('들어가기',px,1736,11,'#5B6788')});
  [[26,1560],[774,1560]].forEach(a=>{R(a[0]-3,a[1]+2,6,14,'#6B4A32');E(a[0],a[1]-6,16,14,leaf[1]);E(a[0],a[1]-9,14,11,leaf[0])})}

/* --- 장소 안: 걸어 다니는 한 장짜리 지도. 아침·점심·저녁 구역에 다가가면 습관 카드가 나온다 --- */
const PS={W:520,H:700,K:1.5,X0:18,X1:502,Y0:118,Y1:690,SPEED:140};
const PST={m:{x:115,y:252,b:[40,130,150,80]},n:{x:405,y:372,b:[330,250,150,80]},e:{x:115,y:522,b:[40,400,150,80]}};
const POBS=[[0,0,520,112],[0,0,14,700],[506,0,14,700],...SL.map(s=>PST[s.k].b)];
const pBlocked=(x,y)=>{if(x<PS.X0||x>PS.X1||y<PS.Y0||y>PS.Y1)return true;const f=feet(x,y);for(const b of POBS)if(f.x1>b[0]&&f.x0<b[0]+b[2]&&f.y1>b[1]&&f.y0<b[1]+b[3])return true;return false};
function pMove(o,dx,dy){let m=0;if(!pBlocked(o.x+dx,o.y)){o.x+=dx;m=1}if(!pBlocked(o.x,o.y+dy)){o.y+=dy;m=1}return m}
function buildPlace(pid){
  const K=PS.K,c=document.createElement('canvas');c.width=PS.W*K;c.height=PS.H*K;const g=c.getContext('2d');g.scale(K,K);
  const R=(x,y,w,h,f)=>{g.fillStyle=f;g.fillRect(x,y,w,h)},E=(x,y,rx,ry,f)=>{g.fillStyle=f;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill()};
  const T=(t,x,y,sz,col)=>{g.font='700 '+sz+'px "Noto Sans KR",system-ui,sans-serif';g.textAlign='center';g.lineWidth=3;g.strokeStyle='rgba(255,255,255,.92)';g.strokeText(t,x,y);g.fillStyle=col||'#1B2340';g.fillText(t,x,y)};
  const grid=(col,s)=>{g.strokeStyle=col;g.lineWidth=1;for(let x=0;x<=520;x+=s){g.beginPath();g.moveTo(x,112);g.lineTo(x,700);g.stroke()}for(let y=112;y<=700;y+=s){g.beginPath();g.moveTo(0,y);g.lineTo(520,y);g.stroke()}};
  const B=(k,fill,edge)=>{const b=PST[k].b;R(b[0],b[1],b[2],b[3],fill);R(b[0],b[1],b[2],6,edge);R(b[0],b[1]+b[3]-4,b[2],4,'rgba(0,0,0,.18)');return b};
  if(pid==='office'){R(0,0,520,112,'#3D4A66');for(let i=0;i<6;i++){R(14+i*82,16,64,70,'#9CC7F0');R(14+i*82,60,64,26,'#6E8CC0')}R(0,0,520,10,'#2E3A5C');R(0,112,520,590,'#E4E8EF');grid('rgba(90,100,130,.16)',40);
    let b=B('m','#5B6F9E','#3D4A66');for(let i=0;i<3;i++){R(b[0]+20+i*44,b[1]+14,6,50,'#E7EAF3');R(b[0]+14+i*44,b[1]+34,18,5,'#C8CFE0')}
    b=B('n','#A3593F','#7A3F2B');R(b[0]+10,b[1]+16,70,44,'#D9835F');R(b[0]+90,b[1]+22,40,30,'#F2EFE8');E(b[0]+110,b[1]+36,10,10,'#6B4A32');
    b=B('e','#EDEFF5','#9AA3BA');R(b[0]+12,b[1]+12,126,50,'#fff');g.fillStyle='#4263EB';for(let i=0;i<4;i++)R(b[0]+22,b[1]+20+i*10,40+i*14,4,'#4263EB');
    [[380,160],[440,160]].forEach(a=>{R(a[0],a[1],46,26,'#B8C0D6');R(a[0]+12,a[1]-10,22,12,'#3D4A66')})}
  else if(pid==='home'){R(0,0,520,112,'#F1E4D3');R(190,18,140,76,'#BFE3F5');R(256,18,8,76,'#F1E4D3');R(190,54,140,6,'#F1E4D3');R(0,0,520,10,'#CDB594');R(0,112,520,590,'#D9B98B');g.strokeStyle='rgba(120,84,40,.22)';g.lineWidth=1;for(let y=112;y<=700;y+=28){g.beginPath();g.moveTo(0,y);g.lineTo(520,y);g.stroke()}
    let b=B('m','#9FB7E0','#6F88BA');R(b[0]+8,b[1]+14,134,52,'#fff');R(b[0]+8,b[1]+14,44,52,'#F5E3C8');
    b=B('n','#CFC9BC','#9E978A');R(b[0]+10,b[1]+16,56,40,'#8B6A47');E(b[0]+112,b[1]+36,22,16,'#fff');E(b[0]+112,b[1]+36,10,6,'#D9835F');
    b=B('e','#B26A55','#7E4333');R(b[0]+10,b[1]+14,130,52,'#D58A74');R(b[0]+10,b[1]+14,130,14,'#B26A55');R(330,448,150,10,'#2F3744');R(340,418,130,30,'#242B3A');
    E(400,640,70,28,'#C9A06A')}
  else if(pid==='field'){R(0,0,520,112,'#BFE3F5');for(let i=0;i<8;i++)R(i*70,70,50,42,'#6E9F5C');R(0,94,520,18,'#8F7E62');R(0,112,520,590,'#8CC477');for(let y=112;y<700;y+=40)R(0,y,520,20,'rgba(255,255,255,.07)');
    g.strokeStyle='#C4694A';g.lineWidth=28;g.beginPath();g.ellipse(260,440,215,230,0,0,7);g.stroke();g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=2;g.beginPath();g.ellipse(260,440,229,244,0,0,7);g.stroke();g.beginPath();g.ellipse(260,440,201,216,0,0,7);g.stroke();
    let b=B('m','#E8554E','#B23C37');for(let i=0;i<5;i++)R(b[0]+12+i*28,b[1]+12,12,56,'#fff');
    b=B('n','#8B6A47','#5A4630');R(b[0]+8,b[1]+14,134,10,'#C9A06A');R(b[0]+8,b[1]+34,134,10,'#C9A06A');E(b[0]+118,b[1]-10,26,24,'#417A36');R(b[0]+115,b[1]+10,6,14,'#5A4630');
    b=B('e','#B7B0A2','#8F897C');for(let i=0;i<4;i++)R(b[0]+6,b[1]+10+i*14,138,8,i%2?'#CFC9BB':'#E4DFD2');
    R(370,150,6,50,'#fff');R(430,150,6,50,'#fff');R(370,150,66,6,'#fff')}
  else if(pid==='school'){R(0,0,520,112,'#7B8FB5');R(60,18,400,70,'#2F5D50');R(60,18,400,5,'#C9A06A');R(60,83,400,5,'#C9A06A');T('오늘도 한 걸음',260,60,18,'#E8F3EE');R(0,0,520,10,'#5A6C92');R(0,112,520,590,'#E9DFC8');grid('rgba(120,100,60,.16)',40);
    let b=B('m','#7B8FB5','#5A6C92');for(let i=0;i<5;i++){R(b[0]+10+i*28,b[1]+12,22,56,'#95A8CC');R(b[0]+18+i*28,b[1]+38,6,4,'#fff')}
    b=B('n','#C9A06A','#9C7840');R(b[0]+10,b[1]+14,130,22,'#E4DFD2');R(b[0]+10,b[1]+44,130,22,'#E4DFD2');for(let i=0;i<4;i++){E(b[0]+28+i*32,b[1]+25,9,6,'#D9835F');E(b[0]+28+i*32,b[1]+55,9,6,'#8CC477')}
    b=B('e','#8B6A47','#5A4630');for(let i=0;i<6;i++){R(b[0]+8+i*22,b[1]+10,17,54,['#E8554E','#4263EB','#2CB38F','#FFB800','#8B4FA6','#4A5566'][i])}
    [[330,460],[420,520],[340,580]].forEach(a=>{R(a[0],a[1],46,28,'#C9A06A');R(a[0]+6,a[1]+6,34,16,'#E4DFD2')})}
  else{R(0,0,520,112,'#CFE6E6');R(215,22,90,70,'#fff');R(250,32,20,50,'#E8554E');R(232,48,56,18,'#E8554E');R(0,0,520,10,'#9CC8C8');R(0,112,520,590,'#EAF4F4');grid('rgba(100,150,150,.2)',40);
    let b=B('m','#9CC8C8','#6BA0A0');R(b[0]+10,b[1]+16,130,22,'#fff');E(b[0]+120,b[1]+54,10,10,'#E8554E');
    b=B('n','#7B8FB5','#5A6C92');R(b[0]+10,b[1]+14,58,52,'#E4DFD2');R(b[0]+18,b[1]+22,42,16,'#6BC4A0');R(b[0]+84,b[1]+14,56,52,'#C9A06A');
    b=B('e','#fff','#9AA3BA');R(b[0]+10,b[1]+14,60,52,'#BFE3F0');R(b[0]+80,b[1]+14,60,52,'#BFE3F0');R(b[0]+10,b[1]+14,60,12,'#9CC8C8');R(b[0]+80,b[1]+14,60,12,'#9CC8C8');
    [[400,170],[440,170]].forEach(a=>{E(a[0],a[1],12,12,'#6BC4A0');R(a[0]-4,a[1]+8,8,12,'#8B6A47')})}
  /* 출입문과 구역 이름 */
  R(200,672,120,28,'#8B6A47');R(206,676,108,24,'#C9A06A');T('나가는 문',260,694,11,'#5A4630');
  SL.forEach(s=>{const b=PST[s.k].b;T(s.n+' · '+PLACES[pid].st[s.k],b[0]+b[2]/2,b[1]-8,12,'#1B2340')});
  return c}
let PX=null;
async function openPlace(pid){
  if(PX||!PLACES[pid])return;if(WX)closeWorld();
  document.documentElement.classList.add('wopen');const el=document.createElement('div');el.className='world pworld';el.setAttribute('role','dialog');el.setAttribute('aria-label',PLACES[pid].n);
  el.innerHTML='<canvas id="pc2" aria-label="'+PLACES[pid].n+' 지도. 화면을 누르거나 방향키로 걸어요."></canvas>'+
   '<div class="wtop"><div class="wchip"><b>'+PLACES[pid].n+'</b><span id="pcnt"></span></div><button class="btn sm ghost" data-p="out" aria-label="광장으로 나가기">광장으로</button></div>'+
   '<div class="wbot"><div class="wcard" id="pcard" hidden></div><div class="whint" id="phint">구역으로 걸어가거나 아래 버튼을 눌러요</div><div class="wsay">'+SL.map(s=>'<button class="btn sm ghost" data-p="go" data-s="'+s.k+'">'+s.n+' · '+PLACES[pid].st[s.k]+'</button>').join('')+'</div></div>';
  document.body.appendChild(el);
  const cv=el.querySelector('#pc2'),cx=cv.getContext('2d'),map=buildPlace(pid),K=PS.K;
  const me={x:260,y:610,f:1},keys={};let target=null,down=false,raf=0,last=performance.now(),cam={x:0,y:0},view={w:0,h:0,sc:1,dpr:1},cur=null,img=null;
  const mkImg=()=>{const im=new Image();im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(av(S.job,lvInfo(S.totalXp).l,S.look,{label:'캐릭터'}).replace('<svg ','<svg width="120" height="150" '));return im};img=mkImg();
  function resize(){view.dpr=Math.min(2,window.devicePixelRatio||1);view.w=cv.clientWidth||innerWidth;view.h=cv.clientHeight||innerHeight;cv.width=Math.round(view.w*view.dpr);cv.height=Math.round(view.h*view.dpr);view.sc=Math.min(1.6,Math.max(view.w/PS.W,view.h/820))}
  function toW(e){const r=cv.getBoundingClientRect();return[cam.x+(e.clientX-r.left)/view.sc,cam.y+(e.clientY-r.top)/view.sc]}
  function setT(e){const p=toW(e);target={x:Math.max(PS.X0,Math.min(PS.X1,p[0])),y:Math.max(PS.Y0,Math.min(PS.Y1,p[1]))}}
  const onDown=e=>{down=true;try{cv.setPointerCapture(e.pointerId)}catch(x){}setT(e);const h=el.querySelector('#phint');if(h)h.hidden=true},onMv=e=>{if(down)setT(e)},onUp=()=>{down=false};
  cv.addEventListener('pointerdown',onDown);cv.addEventListener('pointermove',onMv);cv.addEventListener('pointerup',onUp);cv.addEventListener('pointercancel',onUp);
  const KM={ArrowUp:'u',w:'u',W:'u',ArrowDown:'d',s:'d',S:'d',ArrowLeft:'l',a:'l',A:'l',ArrowRight:'r',d:'r',D:'r'};
  const onKey=e=>{if(e.key==='Escape'){leave();return}const k=KM[e.key];if(!k)return;if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;e.preventDefault();keys[k]=e.type==='keydown'};
  const onKeyUp=e=>onKey(e);document.addEventListener('keydown',onKey);document.addEventListener('keyup',onKeyUp);window.addEventListener('resize',resize);resize();
  const stDone=s=>[0,1,2].filter(i=>plDone(pid+'.'+s+i)).length;
  function head(){const c=el.querySelector('#pcnt');if(c)c.textContent=' · 오늘 '+plCount(pid)+' / 9'}
  function card(){const c=el.querySelector('#pcard');if(!c)return;
    if(!cur){c.hidden=true;c.innerHTML='';return}
    if(cur==='door'){c.hidden=false;c.innerHTML='<div class="wt">나가는 문</div><div class="wi">광화문 광장으로 돌아가요.</div><button class="btn sm mint" data-p="out">광장으로 가기</button>';return}
    const s=SL.find(x=>x.k===cur),now=slotNow()===cur;
    c.hidden=false;c.innerHTML='<div class="wt">'+s.n+' · '+PLACES[pid].st[cur]+(now?' <span class="chip">지금 시간대</span>':'')+'</div>'+
     [0,1,2].map(i=>{const h=habOf(pid,cur,i),d=plDone(h.id);return'<button class="hrow'+(d?' on':'')+'" data-p="hab" data-id="'+h.id+'"'+(d?' disabled':'')+'><span class="ck" aria-hidden="true">'+(d?'✓':'')+'</span><span class="ht"><b>'+h.t+'</b><small>최소 버전: '+h.mini+'</small></span><span class="hx">+'+PL_XP+'</span></button>'}).join('')+
     '<label class="alrow2"><input type="checkbox" data-pal="'+cur+'"'+(alOn(pid,cur)?' checked':'')+'><span>'+s.n+' 알림 받기</span><input class="inp" type="time" data-palt="'+cur+'" value="'+alTime(cur)+'" aria-label="'+s.n+' 알림 시각"></label>'}
  function frame(t){raf=requestAnimationFrame(frame);const dt=Math.min(.05,(t-last)/1000);last=t;
    let vx=(keys.r?1:0)-(keys.l?1:0),vy=(keys.d?1:0)-(keys.u?1:0);
    if(vx||vy){target=null;const n=Math.hypot(vx,vy);vx=vx/n*PS.SPEED*dt;vy=vy/n*PS.SPEED*dt;if(pMove(me,vx,vy)&&vx)me.f=vx>0?1:-1}
    else if(target){const dx=target.x-me.x,dy=target.y-me.y,d=Math.hypot(dx,dy);if(d<4)target=null;else{const st=Math.min(d,PS.SPEED*dt),sx=dx/d*st,sy=dy/d*st;if(!pMove(me,sx,sy))target=null;else if(Math.abs(sx)>.1)me.f=sx>0?1:-1}}
    const vw=view.w/view.sc,vh=view.h/view.sc;cam.x=vw>=PS.W?(PS.W-vw)/2:Math.max(0,Math.min(PS.W-vw,me.x-vw/2));cam.y=vh>=PS.H?(PS.H-vh)/2:Math.max(0,Math.min(PS.H-vh,me.y-vh*.58));
    let nr=null,nd=1e9;SL.forEach(s=>{const d=Math.hypot(PST[s.k].x-me.x,PST[s.k].y-me.y);if(d<62&&d<nd){nd=d;nr=s.k}});if(!nr&&Math.hypot(260-me.x,650-me.y)<46)nr='door';
    if(nr!==cur){const active=document.activeElement;const typing=active&&el.contains(active)&&/INPUT/.test(active.tagName);if(!typing||!nr){cur=nr;card()}}
    cx.setTransform(view.dpr,0,0,view.dpr,0,0);cx.fillStyle='#1B2340';cx.fillRect(0,0,view.w,view.h);cx.save();cx.scale(view.sc,view.sc);cx.translate(-cam.x,-cam.y);
    cx.drawImage(map,0,0,PS.W*K,PS.H*K,0,0,PS.W,PS.H);
    SL.forEach(s=>{const p=PST[s.k],all=stDone(s.k)===3;cx.fillStyle=all?'#17A583':(slotNow()===s.k?'#FF7A3D':'#FFB800');cx.beginPath();cx.arc(p.x,p.y-20+Math.sin(t/350+p.x)*2,8,0,7);cx.fill();cx.strokeStyle='#fff';cx.lineWidth=2;cx.stroke();cx.fillStyle='#fff';cx.font='700 10px sans-serif';cx.textAlign='center';cx.fillText(all?'✓':String(3-stDone(s.k)),p.x,p.y-16+Math.sin(t/350+p.x)*2)});
    cx.fillStyle='rgba(0,0,0,.2)';cx.beginPath();cx.ellipse(me.x,me.y,13,5,0,0,7);cx.fill();cx.strokeStyle='#4263EB';cx.lineWidth=2;cx.beginPath();cx.ellipse(me.x,me.y,16,7,0,0,7);cx.stroke();
    if(img.complete&&img.naturalWidth)cx.drawImage(img,me.x-18,me.y-46,36,45);else{cx.fillStyle='#4263EB';cx.fillRect(me.x-8,me.y-30,16,30)}
    cx.font='700 11px "Noto Sans KR",system-ui,sans-serif';cx.textAlign='center';cx.lineWidth=3;cx.strokeStyle='rgba(255,255,255,.92)';cx.strokeText(S.nick+' (나)',me.x,me.y-50);cx.fillStyle='#4263EB';cx.fillText(S.nick+' (나)',me.x,me.y-50);
    cx.restore()}
  function leave(){const sp={x:PLX[pid],y:1722};closePlace();openWorld(sp)}
  el.addEventListener('click',e=>{const t=e.target.closest('[data-p]');if(!t)return;const a=t.dataset.p;
    if(a==='out')leave();
    else if(a==='go'){const s=PST[t.dataset.s];if(s){me.x=s.x;me.y=s.y+8;target=null;const h=el.querySelector('#phint');if(h)h.hidden=true}}
    else if(a==='hab'){if(doPlaceHabit(t.dataset.id)){card();head()}}});
  el.addEventListener('change',e=>{const t=e.target;
    if(t.dataset&&t.dataset.pal){setAl(pid,t.dataset.pal,t.checked);card()}
    else if(t.dataset&&t.dataset.palt){setAlT(t.dataset.palt,t.value)}});
  PX={destroy(){cancelAnimationFrame(raf);document.removeEventListener('keydown',onKey);document.removeEventListener('keyup',onKeyUp);window.removeEventListener('resize',resize);el.remove()}};
  head();raf=requestAnimationFrame(frame);persist()}
function closePlace(){document.documentElement.classList.remove('wopen');if(!PX)return;const p=PX;PX=null;p.destroy();render()}
document.addEventListener('change',e=>{const t=e.target;if(t&&t.id==='stpl'){S.startPlaza=!!t.checked;persist()}else if(t&&t.dataset&&t.dataset.alt){setAlT(t.dataset.alt,t.value);toast('알림 시각을 바꿨어요')}});
setInterval(()=>{try{alTick()}catch(e){}},20000);
