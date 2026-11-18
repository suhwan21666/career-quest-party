import base64, os, sys, json
t0 = open('template.html', encoding='utf8').read()
d = open('data2.js', encoding='utf8').read()
shim = open('online.js', encoding='utf8').read()
icon = base64.b64encode(open('out/icon180.png', 'rb').read()).decode()
banner = open('banner_snippet.html', encoding='utf8').read()
cfg_url = os.environ.get('CQ_URL', '')
cfg_key = os.environ.get('CQ_KEY', '')


def mk(t):
    box = {'t': t}

    def rep(a, b):
        assert box['t'].count(a) == 1, (a[:60], box['t'].count(a))
        box['t'] = box['t'].replace(a, b)
    return box, rep


def common(t):
    box, rep = mk(t)
    rep("const PAGE_URL='https://claude.ai/artifact/Edf9q7RhQqGvSZFLRWe2kA';",
        "const PAGE_URL=(/^https?:/.test(location.href)?location.href.split('#')[0].split('?')[0]:'');")
    rep("let db=null,uid=null,canWrite=false,unsub=[],dl=null;",
        """let db=null,uid=null,canWrite=false,unsub=[];
let dl={save:async({filename,data})=>{const u=URL.createObjectURL(data),a=document.createElement('a');a.href=u;a.download=filename;a.rel='noopener';document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(u)},4000)}};""")
    return box['t']


OFF = [
    ("지금은 공유 연결이 없어서 파티원이 보이지 않아요. 로그인한 상태로 다시 열어주세요.", "이 버전은 친구와 실시간으로 파티를 맺을 수 없어요. NPC 동료와 함께해요."),
    ("친구와 실제로 파티를 맺으려면 로그인한 상태로 이 페이지를 열어야 해요. 지금은 NPC 동료와 먼저 연습할 수 있어요.", "이 버전에서는 NPC 동료와 함께해요. 친구와 실시간 파티는 서버 버전에서 열릴 예정이에요."),
    ("이 링크는 보기 전용이라 파티를 저장할 수 없어요. 게임 만든 사람에게 Contributor(참여자) 권한을 받으면 파티를 만들 수 있어요.", "이 버전에서는 NPC 동료와 함께해요."),
    ("데이터는 이 기기에 저장되고, 로그인 상태에서는 계정에도 저장돼요.", "데이터는 이 기기의 브라우저에만 저장돼요. 브라우저 데이터를 지우면 기록도 사라져요."),
    ("'내 데이터 삭제'를 누르면 이 기기와 서버의 내 기록, 파티 정보, 내가 보낸 응원이 지워져요.", "'내 데이터 삭제'를 누르면 이 기기에 저장된 내 기록이 모두 지워져요. 서버로는 아무것도 보내지 않아요."),
    ("<div><b>테스트 정보</b><br>'테스트 정보를 보내기'를 켠 경우에만 별명, 기기 종류, 진행 상황, 최근 오류, 적은 의견이 만든 사람에게 전달돼요. 끄면 지워져요.</div>", ""),
    ("<div><b>신고</b><br>신고하면 사유와 상대 식별값이 운영자에게 전달돼요.</div>", ""),
    ("<div><b>파티 동료에게 보이는 정보</b><br>별명, 직업, 레벨, 오늘 진행도, 그리고 직접 공개를 선택한 한 줄. 모험 일지는 기본 비공개예요.</div>", "<div><b>다른 사람에게 보이는 정보</b><br>없어요. 이 버전은 기록을 이 기기 밖으로 보내지 않아요.</div>"),
    ("친구와 파티를 맺어 같이 성장해요", "동료들과 함께 성장해요"),
]
ONLY_WHEN_OFFLINE = ("지금은 공유", "친구와 실제로", "이 링크는 보기")


def offline_texts(t):
    box, rep = mk(t)
    for a, b in OFF:
        rep(a, b)
    return box['t']


def online_texts(t):
    """연결 여부(db)에 따라 문구가 바뀐다. 연결이 없으면 혼자 하는 문구."""
    box, rep = mk(t)
    for a, b in OFF:
        if a.startswith(ONLY_WHEN_OFFLINE):
            rep(a, b)
        elif a == "친구와 파티를 맺어 같이 성장해요":
            rep(a, "${window.CQ_ONLINE?`" + a + "`:`" + b + "`}")
        else:
            rep(a, "${db?`" + a + "`:`" + b + "`}")
    return box['t']


head = f'''<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#EEF1F8">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="퀘스트 파티"><meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="apple-touch-icon" href="data:image/png;base64,{icon}"><link rel="icon" href="data:image/png;base64,{icon}">
<title>커리어 퀘스트 파티</title>
<style>:root{{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}html{{-webkit-text-size-adjust:100%}}body{{margin:0;font:14px system-ui,-apple-system,sans-serif}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
</head><body>
<noscript><p style="padding:40px 16px;text-align:center;font:16px/1.6 system-ui,sans-serif">이 게임은 JavaScript가 필요해요. 브라우저 설정에서 JavaScript를 켜 주세요.</p></noscript>
'''


def strip_artifact_head(t):
    box, rep = mk(t)
    rep('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
    rep("<title>커리어 퀘스트 파티</title>\n", "")
    return box['t']


# 1) 로그인 없이 온라인(파티·광장 만남·테스트 모니터링) 가능한 단독 파일. 설정이 비어 있으면 혼자 하는 모드.
t = strip_artifact_head(online_texts(common(t0)))
cfg = '<script>window.CQ_CONFIG=' + json.dumps({'url': cfg_url, 'key': cfg_key}) + ';</script>\n'
open('out/career-quest-online.html', 'w', encoding='utf8').write(
    head + banner + cfg + '<script>' + shim + '</script>\n' + t.replace('/*__DATA__*/', d) + '\n</body></html>\n')
# 2) 혼자 하는 단독 파일
t = strip_artifact_head(offline_texts(common(t0)))
open('out/career-quest-party.html', 'w', encoding='utf8').write(head + banner + t.replace('/*__DATA__*/', d) + '\n</body></html>\n')
# 3) 아티팩트(로그인 필요 없는 모바일 링크)용
t = offline_texts(common(t0))
box, rep = mk(t)
rep("<title>커리어 퀘스트 파티</title>", "<title>커리어 퀘스트 파티 모바일</title>")
open('out/artifact-mobile.html', 'w', encoding='utf8').write(box['t'].replace('/*__DATA__*/', d))
import re, subprocess
ESB='/opt/npm-tools/node_modules/@esbuild/linux-x64/bin/esbuild'
def down(f):
    h=open(f,encoding='utf8').read()
    def one(m):
        b=m.group(2)
        if len(b)<2000: return m.group(0)
        r=subprocess.run([ESB,'--target=es2017','--loader=js'],input=b,capture_output=True,text=True)
        if r.returncode!=0: print('esbuild fail',f,r.stderr[:200]); return m.group(0)
        return m.group(1)+r.stdout.replace('</script','<\\/script')+m.group(3)
    h=re.sub(r'(<script>)(.*?)(</script>)',one,h,flags=re.S)
    open(f,'w',encoding='utf8').write(h)
for f in ('career-quest-online','career-quest-party','artifact-mobile'): down('out/'+f+'.html')
print('built', {f: os.path.getsize('out/' + f) for f in ('career-quest-online.html', 'career-quest-party.html', 'artifact-mobile.html')})
