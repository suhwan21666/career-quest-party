// 앱의 습관 데이터(habits-ladder.js, template.html의 HABITS)를 읽어 서버용 seed_habits.sql 을 만들어요. 사용: node gen_seed.js
const fs=require('fs'),vm=require('vm'),path=require('path');const B=path.join(__dirname,'..');
const lad=fs.readFileSync(B+'/habits-ladder.js','utf8'),tpl=fs.readFileSync(B+'/template.html','utf8');
const sandbox={};vm.createContext(sandbox);
const L=tpl.split('\n'),i0=L.findIndex(l=>l.startsWith('const HABITS={')),i1=L.findIndex(l=>l.startsWith('Object.keys(HABITS_MORE)'));
if(i0<0||i1<0)throw new Error('HABITS 블록을 template.html에서 찾지 못했어요');
vm.runInContext(L.slice(i0,i1+1).join('\n').replace(/\bconst /g,'var ')+'\n'+lad.replace(/\bconst /g,'var ')+'\nObject.keys(LAD).forEach(function(j){HABITS[j]=LAD[j]});',sandbox);
const q=s=>"'"+String(s).replace(/'/g,"''")+"'";let out='-- 자동 생성(gen_seed.js). 직접 고치지 말고 앱 데이터를 바꾼 뒤 다시 생성하세요.\n-- habits.id 는 앱의 습관 id("직업id:번호")와 같아요. 문구는 초안이라 현직자 검수 후 수정하세요.\ninsert into public.habits(id,job_id,idx,title,cue,mini,stat,kind) values\n';
const rows=[];Object.keys(sandbox.HABITS).forEach(j=>sandbox.HABITS[j].forEach((h,i)=>rows.push(`(${q(j+':'+i)},${q(j)},${i},${q(h[0])},${q(h[1])},${q(h[2])},${q(h[3]||'')},${q(h[4]||'간접')})`)));
out+=rows.join(',\n')+'\non conflict (id) do update set title=excluded.title,cue=excluded.cue,mini=excluded.mini,stat=excluded.stat,kind=excluded.kind;\n';
fs.writeFileSync(__dirname+'/seed_habits.sql',out);console.log('jobs',Object.keys(sandbox.HABITS).length,'rows',rows.length)
