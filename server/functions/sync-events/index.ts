// Supabase Edge Function (Deno) — 아직 실제 Supabase 에서 배포·실행해 보지 않았어요(이 환경에 Deno 없음).
// 로직(core.mjs)은 Node + 실제 Postgres 로 시험했고, 이 파일은 "인증 + DB 연결"만 맡는 얇은 껍질이에요.
// 배포: ../../build_function.sh 로 core.mjs 를 만든 뒤 `supabase functions deploy sync-events`
import { handle } from './core.mjs';
import postgres from 'npm:postgres@3.4.4';
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { max: 3, prepare: false });
const auth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);

// core 가 쓰는 최소 인터페이스: db.tx(async q => (await q(sql, params)).rows)
const db = { tx: (fn: (q: (s: string, p?: unknown[]) => Promise<{ rows: any[] }>) => Promise<any>) =>
  sql.begin(async (t) => fn(async (s, p = []) => ({ rows: [...(await t.unsafe(s, p as any[]))] }))) };

// 로그인 토큰 → 사용자 id (서명 검증은 Supabase 가 함)
const getUserId = async (authorization: string) => {
  const token = authorization.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await auth.auth.getUser(token);
  return error || !data.user ? null : data.user.id;
};

Deno.serve(async (req) => {
  const o = await handle({ method: req.method, headers: Object.fromEntries(req.headers), bodyText: await req.text() }, { db, getUserId });
  return new Response(o.body, { status: o.status, headers: o.headers });
});
