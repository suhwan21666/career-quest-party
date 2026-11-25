-- 커리어 퀘스트 파티 · 서버 스키마 v2 (초안 — 아직 실제 서버에 적용해 보지 않았어요)
-- 원칙: ① 사용자는 자기 행만 읽고 쓴다(RLS) ② 경험치는 xp_events 로만 늘고, 서버(service_role)만 쓴다
--       ③ 사진은 Storage 비공개 버킷 ④ 앱의 로컬 저장(S)과 1:1 로 옮길 수 있게 컬럼을 맞췄다
-- 적용 순서: 이 파일 → seed_habits.sql(자동 생성) → 02 정책 확인. 기존 v1(supabase_schema.sql)과는 별도 프로젝트에 먼저 시험하세요.

create extension if not exists pgcrypto;

-- 1) 사용자 프로필 (auth.users 1:1)
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nick text check (char_length(nick) <= 12),
  job_id text,
  born date,                       -- 앱 첫 사용일(효과 지표 기준)
  is_minor boolean not null default false,   -- 만 14세 미만·미성년 여부(동의 절차용)
  consent_at timestamptz,          -- 개인정보 동의 시각
  consent_version text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 2) 캐릭터/진행 (앱의 S 중 단일 값들)
create table public.characters (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  look jsonb not null default '{}'::jsonb,
  streak int not null default 0,
  rest int not null default 0,
  last_day date,
  hab_id text,                     -- 지금 하는 습관
  diag jsonb,                      -- 성향 진단 결과
  updated_at timestamptz not null default now()
);

-- 3) 경험치 이벤트 (append-only). 총 경험치 = 합계. 앱의 S.ev 와 같은 모양
create table public.xp_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  client_id text not null,         -- 앱의 cid (기기별 임시 식별자)
  seq int not null,                -- 앱의 이벤트 번호 i
  event_key text not null,         -- cid||':'||seq  (멱등키)
  day date not null,
  kind text not null,
  xp int not null check (xp >= 0),
  meta jsonb not null default '{}'::jsonb,
  verified boolean not null default true,    -- 서버 규칙 검증 통과 여부(server/rules.js)
  flag text,
  created_at timestamptz not null default now(),
  unique (user_id, event_key)
);
create index xp_events_user_day on public.xp_events(user_id, day);

-- 4) 습관 카탈로그 (seed_habits.sql 이 채움)
create table public.habits (
  id text primary key,             -- 'developer:0'
  job_id text not null,
  idx int not null,
  title text not null,
  cue text,
  mini text,
  stat text,
  kind text not null check (kind in ('간접','직접')),
  unique (job_id, idx)
);

-- 5) 습관 진행/반응/메모/증빙
create table public.habit_progress (
  user_id uuid references public.profiles(user_id) on delete cascade,
  habit_id text references public.habits(id),
  total int not null default 0,
  streak int not null default 0,
  best int not null default 0,
  last_day date,
  achieved_at timestamptz,
  is_mine boolean not null default false,    -- 30회 달성 '내 습관'
  primary key (user_id, habit_id)
);
create table public.habit_feedback (          -- S.fb : 재미/가능/불편/계속
  user_id uuid references public.profiles(user_id) on delete cascade,
  habit_id text references public.habits(id),
  fun int, ok boolean, no boolean, keep boolean,
  updated_at timestamptz not null default now(),
  primary key (user_id, habit_id)
);
create table public.habit_notes (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  habit_id text not null references public.habits(id),
  day date not null,
  note text not null check (char_length(note) <= 200),
  unique (user_id, habit_id, day)
);
create table public.proofs (                  -- 직접 경험 증빙
  id text primary key,                         -- 앱의 증빙 id (prf[].i)
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  habit_id text not null references public.habits(id),
  day date not null,
  note text check (char_length(note) <= 80),
  url text check (url is null or url ~* '^https?://[^\s<>"'']{3,190}$'),
  image_path text,                             -- storage: proofs/<user_id>/<id>.jpg
  created_at timestamptz not null default now()
);

-- 6) 한 줄 기록·진단·활동일
create table public.story_lines (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  day date not null,
  job_id text,
  text text not null check (char_length(text) <= 200)
);
create table public.assessments (             -- 사전/사후 자가 점검 (pre/chk)
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  day date not null,
  kind text not null check (kind in ('pre','chk')),
  ratings jsonb not null
);
create table public.activity_days (
  user_id uuid references public.profiles(user_id) on delete cascade,
  day date,
  primary key (user_id, day)
);

-- 7) 기기→계정 연결: 로그인 전에 쓰던 기록(cid)을 계정에 붙일 때 한 번만 사용
create table public.client_links (
  client_id text primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  baseline_xp int not null default 0,          -- 옛 저장의 evBase (검증 불가 구간, 별도 표시)
  linked_at timestamptz not null default now()
);

-- 8) 파티(2~4명) — v1 의 party 구조를 단순화
create table public.parties (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code ~ '^[A-Z0-9]{4,8}$'),
  created_at timestamptz not null default now()
);
create table public.party_members (
  party_id uuid references public.parties(id) on delete cascade,
  user_id uuid references public.profiles(user_id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (party_id, user_id)
);

-- ---------- RLS ----------
alter table public.profiles       enable row level security;
alter table public.characters     enable row level security;
alter table public.xp_events      enable row level security;
alter table public.habits         enable row level security;
alter table public.habit_progress enable row level security;
alter table public.habit_feedback enable row level security;
alter table public.habit_notes    enable row level security;
alter table public.proofs         enable row level security;
alter table public.story_lines    enable row level security;
alter table public.assessments    enable row level security;
alter table public.activity_days  enable row level security;
alter table public.client_links   enable row level security;
alter table public.parties        enable row level security;
alter table public.party_members  enable row level security;

create policy habits_read on public.habits for select to authenticated using (true);
create policy own_profile on public.profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_char    on public.characters for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- xp_events: 읽기만 허용. insert/update/delete 정책을 만들지 않으면 service_role 만 쓸 수 있어요.
create policy own_xp_read on public.xp_events for select to authenticated using (user_id = auth.uid());
create policy own_hp  on public.habit_progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_hf  on public.habit_feedback for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_hn  on public.habit_notes    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_pf  on public.proofs         for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_sl  on public.story_lines    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_as  on public.assessments    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_ad  on public.activity_days  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_cl  on public.client_links   for select to authenticated using (user_id = auth.uid());
create policy pm_read on public.party_members  for select to authenticated using (user_id = auth.uid());
-- 파티 코드로 참가하는 로직은 Edge Function(service_role)에서 처리해요. 클라이언트에 직접 insert 를 열지 않아요.

-- ---------- Storage (SQL 대신 대시보드에서 만들어도 됨) ----------
-- 비공개 버킷 'proofs'. 경로 proofs/<user_id>/<proof_id>.jpg, 본인 폴더만 읽고 쓰기.
insert into storage.buckets (id, name, public) values ('proofs','proofs',false) on conflict (id) do nothing;
create policy proofs_own_rw on storage.objects for all to authenticated
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- 지표 뷰 (효과 측정 · 앱의 metrics() 와 같은 정의) ----------
-- 접근은 service_role/관리자 전용: 뷰는 기본적으로 소유자 권한으로 실행되므로 authenticated 에 권한을 주지 않아요.
create view public.v_user_metrics as
select p.user_id, p.job_id, p.born,
  (select count(*) from public.activity_days a where a.user_id = p.user_id) as days,
  (select coalesce(max(day) - min(day), 0) from public.activity_days a where a.user_id = p.user_id) as span,
  (select count(distinct h.job_id) from public.habit_progress hp join public.habits h on h.id = hp.habit_id where hp.user_id = p.user_id and hp.total > 0) as jobs,
  (select count(*) from public.habit_progress hp join public.habits h on h.id = hp.habit_id where hp.user_id = p.user_id and hp.total > 0 and h.kind = '간접') as ind,
  (select count(*) from public.habit_progress hp join public.habits h on h.id = hp.habit_id where hp.user_id = p.user_id and hp.total > 0 and h.kind = '직접') as dir,
  (select count(*) from public.proofs f where f.user_id = p.user_id) as proofs,
  (select count(*) from public.habit_progress hp where hp.user_id = p.user_id and hp.achieved_at is not null) as achieved
from public.profiles p where p.deleted_at is null;

-- 7일 재방문 = 활동 3일 이상 & 첫날~마지막 6일 이상 (앱의 ret7 과 동일)
create view public.v_effect_summary as
select count(*) as users,
  count(*) filter (where days >= 3 and span >= 6) as ret7_users,
  round(avg(jobs)::numeric, 2) as avg_jobs,
  round(avg(dir)::numeric, 2) as avg_direct,
  round(avg(achieved)::numeric, 2) as avg_achieved
from public.v_user_metrics;
revoke all on public.v_user_metrics, public.v_effect_summary from anon, authenticated;

-- 서버가 인정한 총 경험치 = 기기 연결 때 받은 기준선(검증 불가 구간) + 검증 통과 이벤트 합계
create function public.user_total_xp(uid uuid) returns bigint language sql stable security invoker as $$
  select coalesce((select sum(baseline_xp) from public.client_links where user_id = uid), 0)
       + coalesce((select sum(xp) from public.xp_events where user_id = uid and verified), 0)
$$;
revoke execute on function public.user_total_xp(uuid) from public, anon, authenticated;
