// HTTP 요청 → syncEvents. 인증(getUserId)과 DB(db)는 밖에서 꽂아요: 시험은 가짜 인증, Edge Function 은 Supabase 인증.
const { syncEvents } = require('./sync_core.js');
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, apikey', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
async function handle({ method, headers, bodyText }, { db, getUserId }) {
  if (method === 'OPTIONS') return { status: 204, headers: CORS, body: '' };
  if (method !== 'POST') return { status: 405, headers: CORS, body: '{"error":"method"}' };
  if (bodyText && bodyText.length > 400000) return { status: 413, headers: CORS, body: '{"error":"too-large"}' };
  let body; try { body = JSON.parse(bodyText || ''); } catch (e) { return { status: 400, headers: CORS, body: '{"error":"bad-json"}' }; }
  const uid = await getUserId(headers['authorization'] || '');
  if (!uid) return { status: 401, headers: CORS, body: '{"error":"unauthorized"}' };
  try { const r = await syncEvents(db, uid, body); const { status = 200, ...rest } = r; return { status, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(rest) }; }
  catch (e) { console.error('sync error', e.message); return { status: 500, headers: CORS, body: '{"error":"server"}' }; }   // 내부 오류 내용은 밖으로 내보내지 않음
}
module.exports = { handle };
