#!/bin/bash
# 처음부터 다시 만들어 시험: 빈 DB → 시험용 Supabase 준비 → 스키마 → 시드 → 테스트
set -e; cd "$(dirname "$0")"; P="psql -h /tmp -p 5544 -U postgres -v ON_ERROR_STOP=1 -q"
$P -c "drop database if exists cq" -c "create database cq" 2>/dev/null
# 역할은 서버 전체 공유라 없을 때만 만들기
for r in anon authenticated service_role; do $P -Atc "select 1 from pg_roles where rolname='$r'" | grep -q 1 && $P -c "drop owned by $r" -d postgres 2>/dev/null || true; done
$P -d cq -f <(sed 's/^create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;/do $$ begin if not exists (select 1 from pg_roles where rolname=$q$anon$q$) then create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls; end if; end $$;/' supabase_shim.sql)
$P -d cq -f ../supabase_schema_v2.sql; $P -d cq -f ../seed_habits.sql
PGURL="postgres://postgres@/cq?host=/tmp&port=5544" NODE_PATH=${PGMOD:-/tmp/pgmod/node_modules} node db_test.js
