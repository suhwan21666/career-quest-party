-- ============================================================
-- 커리어 퀘스트 파티 — 로그인 없는(익명) 테스트용 서버 설정
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 Run
-- 사전 설정: Authentication > Sign In / Providers 에서 "Allow anonymous sign-ins" 켜기
-- 구조: 문서 저장소 한 개(kv). 게임 코드가 쓰는 경로별로 "내 것만 쓰기" 규칙을 적용한다.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.kv (
  path       text primary key check (path ~ '^[A-Za-z0-9_:@.+/-]{3,200}$'),
  coll       text generated always as (split_part(path, '/', 1)) stored,
  owner      uuid not null default auth.uid(),
  data       jsonb not null default '{}'::jsonb check (octet_length(data::text) <= 60000),
  updated_at timestamptz not null default now()
);
create index if not exists kv_coll_idx on public.kv (coll);

-- 관리자 비밀번호(해시) 보관. 일반 사용자는 읽을 수 없다.
create table if not exists public.admin_secret (hash text not null);
alter table public.admin_secret enable row level security;
revoke all on public.admin_secret from anon, authenticated;

-- 경로별 쓰기 규칙: 내 문서에만 쓸 수 있다
create or replace function public.kv_path_ok(p text, d jsonb, u uuid) returns boolean
language sql immutable as $$
  select case split_part(p, '/', 1)
    when 'members' then p = 'members/' || u::text
    when 'testers' then p = 'testers/' || u::text
    when 'data'    then p = 'data/users/' || u::text || '/save'
    when 'parties' then p ~ '^parties/[A-Za-z0-9]{4,10}$'
    when 'cheers'  then p like 'cheers/%' and right(p, 37) = '_' || u::text and d->>'from' = u::text
    when 'reports' then p like ('reports/' || u::text || '\_%') and d->>'from' = u::text
    else false end
$$;

alter table public.kv enable row level security;

-- 읽기: 내 문서 + 파티/멤버(파티원 표시용) + 나에게 온 응원. testers/reports/개인 저장은 본인 것만.
create policy kv_select on public.kv for select to authenticated using (
  owner = auth.uid()
  or coll in ('members', 'parties')
  or (coll = 'cheers' and data->>'to' = auth.uid()::text)
);
create policy kv_insert on public.kv for insert to authenticated
  with check (owner = auth.uid() and public.kv_path_ok(path, data, auth.uid()));
create policy kv_update on public.kv for update to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid() and public.kv_path_ok(path, data, auth.uid()));
create policy kv_delete on public.kv for delete to authenticated
  using (owner = auth.uid());

-- reports 는 일반 사용자가 쓰기만 가능(위 select 정책에 reports 가 없으므로 본인 것만 보임)
revoke all on public.kv from anon;
grant select, insert, update, delete on public.kv to authenticated;

-- 관리자 조회: 비밀번호를 아는 사람만 testers/reports/members/parties 를 읽는다
create or replace function public.admin_list(p_pass text, p_coll text default 'testers')
returns table (path text, data jsonb, updated_at timestamptz)
language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_pass is null or not exists (select 1 from public.admin_secret s where s.hash = crypt(p_pass, s.hash)) then
    perform pg_sleep(1);
    raise exception 'denied';
  end if;
  if p_coll not in ('testers', 'reports', 'members', 'parties') then raise exception 'bad collection'; end if;
  return query select k.path, k.data, k.updated_at from public.kv k where k.coll = p_coll order by k.updated_at desc limit 500;
end $$;
revoke all on function public.admin_list(text, text) from public, anon;
grant execute on function public.admin_list(text, text) to authenticated;

-- ★ 관리자 비밀번호 설정 (아래 '내비밀번호'를 바꿔서 한 번만 실행)
-- delete from public.admin_secret;
-- insert into public.admin_secret(hash) values (crypt('내비밀번호', gen_salt('bf')));

-- 오래된 테스트 정보 정리(선택): 30일 지난 testers 삭제
-- delete from public.kv where coll = 'testers' and updated_at < now() - interval '30 days';
