var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// rules.js
var require_rules = __commonJS({
  "rules.js"(exports, module) {
    "use strict";
    var RULES_VERSION = 1;
    var XPREQ = (l) => Math.floor(90 * Math.pow(1.13, l - 1));
    var BASE = { act: 15, story: 12, com: 10 };
    var HABIT = { normal: 12, mini: 8, directMul: 1.5 };
    var FIXED = { clear: 10, achieve: 20, week: 30, snack: 3, chest: 25, stamp: 3, cheer_out: 1, place: 4 };
    var MILE = { 3: 8, 7: 20, 14: 35, 30: 70 };
    var CHEER_GET = 2;
    var MAX_MULT = 1.3;
    var LIMITS = { quest: 5, clear: 1, habit: 6, achieve: 6, week: 1, snack: 5, chest: 1, cheer_out: 20, cheer_in: 20, stamp: 3, place: 6, milestone: 6 };
    function lvInfo(total) {
      let l = 1, r = total;
      while (r >= XPREQ(l)) {
        r -= XPREQ(l);
        l++;
      }
      return { l, cur: r, need: XPREQ(l) };
    }
    var validMult = (m) => typeof m === "number" && m >= 1 && m <= MAX_MULT + 1e-9 && Math.abs(m * 20 - Math.round(m * 20)) < 1e-6;
    function expectedBase(e) {
      switch (e.k) {
        case "quest":
          return BASE[e.q];
        case "habit":
          return Math.round((e.mini ? HABIT.mini : HABIT.normal) * (e.kd === "\uC9C1\uC811" ? HABIT.directMul : 1));
        case "achieve":
        case "clear":
        case "place":
          return FIXED[e.k];
        default:
          return void 0;
      }
    }
    function checkEvent(e) {
      const bad = [];
      if (!e || typeof e !== "object") return ["not-object"];
      if (!Number.isInteger(e.i) || e.i < 1) bad.push("bad-seq");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(e.d || "")) bad.push("bad-date");
      if (!Number.isInteger(e.x) || e.x < 0 || e.x > 500) bad.push("bad-xp");
      const k = e.k;
      if (["quest", "habit", "achieve", "clear", "place"].includes(k)) {
        const b = expectedBase(e);
        if (b === void 0) bad.push("unknown-base");
        else {
          if (e.b !== b) bad.push("base-mismatch");
          if (!validMult(e.m)) bad.push("bad-mult");
          else if (Math.round(b * e.m) !== e.x && Math.round(Math.round(b) * e.m) !== e.x) bad.push("xp-mismatch");
        }
      } else if (k === "milestone") {
        if (MILE[e.n] !== e.x) bad.push("xp-mismatch");
      } else if (k === "cheer_in") {
        if (!(e.n >= 1 && e.n <= 20) || e.x !== e.n * CHEER_GET) bad.push("xp-mismatch");
      } else if (k in FIXED) {
        if (e.x !== FIXED[k]) bad.push("xp-mismatch");
      } else bad.push("unknown-kind");
      return bad;
    }
    function replay({ evBase = 0, events }) {
      const flags = [], perDay = {};
      let total = Math.max(0, evBase | 0), last = 0, ok = true;
      for (const e of events) {
        const bad = checkEvent(e);
        if (e && e.i <= last) bad.push("seq-not-increasing");
        bad.forEach((why) => flags.push({ i: e && e.i, why }));
        if (e && Number.isInteger(e.i)) last = Math.max(last, e.i);
        if (bad.length) {
          ok = false;
          continue;
        }
        const key = e.d + "|" + e.k;
        perDay[key] = (perDay[key] || 0) + 1;
        if (perDay[key] > (LIMITS[e.k] || 0)) {
          flags.push({ i: e.i, why: "daily-limit:" + e.k });
          ok = false;
          continue;
        }
        total += e.x;
      }
      return { ok, totalXp: total, level: lvInfo(total).l, flags, perDay };
    }
    module.exports = { RULES_VERSION, XPREQ, lvInfo, checkEvent, replay, LIMITS, MAX_MULT };
  }
});

// sync_core.js
var require_sync_core = __commonJS({
  "sync_core.js"(exports, module) {
    "use strict";
    var R = require_rules();
    var MAX_BATCH = 200;
    async function syncEvents(db, userId, body) {
      if (!/^[0-9a-f-]{36}$/i.test(userId || "")) return { status: 401, error: "no-user" };
      const { cid, build, evBase, events } = body || {};
      if (typeof cid !== "string" || !/^c_[a-z0-9]{6,32}$/.test(cid)) return { status: 400, error: "bad-cid" };
      if (!Array.isArray(events) || events.length === 0 || events.length > MAX_BATCH) return { status: 400, error: "bad-batch" };
      const base = Number.isInteger(evBase) && evBase >= 0 && evBase <= 1e7 ? evBase : 0;
      return db.tx(async (q) => {
        await q("select pg_advisory_xact_lock(hashtext($1))", [userId]);
        await q("insert into public.profiles(user_id) values ($1) on conflict do nothing", [userId]);
        await q("insert into public.characters(user_id) values ($1) on conflict do nothing", [userId]);
        const own = (await q("select user_id from public.client_links where client_id=$1", [cid])).rows[0];
        if (own && own.user_id !== userId) return { status: 409, error: "cid-owned-by-other" };
        if (!own) await q("insert into public.client_links(client_id,user_id,baseline_xp) values ($1,$2,$3)", [cid, userId, base]);
        const seen = new Set((await q("select seq from public.xp_events where user_id=$1 and client_id=$2 and seq = any($3::int[])", [userId, cid, events.map((e) => e && e.i | 0)])).rows.map((r) => r.seq));
        let last = (await q("select coalesce(max(seq),0) m from public.xp_events where user_id=$1 and client_id=$2", [userId, cid])).rows[0].m;
        const days = [...new Set(events.map((e) => e && e.d).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d || "")))];
        const cnt = {};
        if (days.length) (await q("select to_char(day,'YYYY-MM-DD') d, kind, count(*)::int n from public.xp_events where user_id=$1 and verified and day = any($2::date[]) group by 1,2", [userId, days])).rows.forEach((r) => {
          cnt[r.d + "|" + r.kind] = r.n;
        });
        const out = { ok: true, accepted: 0, duplicate: 0, rejected: [], acked: 0 };
        for (const e of events) {
          const i = e && Number.isInteger(e.i) ? e.i : null;
          if (i !== null && seen.has(i)) {
            out.duplicate++;
            out.acked = Math.max(out.acked, i);
            continue;
          }
          let why = R.checkEvent(e);
          if (!why.length && e.i <= last) why = ["seq-not-increasing"];
          if (!why.length) {
            const key = e.d + "|" + e.k;
            if ((cnt[key] || 0) + 1 > (R.LIMITS[e.k] || 0)) why = ["daily-limit:" + e.k];
          }
          if (i === null || !/^\d{4}-\d{2}-\d{2}$/.test(e && e.d || "") || !Number.isInteger(e.x)) {
            out.rejected.push({ i, why: why.length ? why : ["malformed"] });
            continue;
          }
          const meta = {};
          for (const k of ["q", "j", "h", "kd", "mini", "b", "m", "n"]) if (e[k] !== void 0) meta[k] = e[k];
          const ok = why.length === 0;
          await q(
            "insert into public.xp_events(user_id,client_id,seq,event_key,day,kind,xp,meta,verified,flag) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (user_id,event_key) do nothing",
            [userId, cid, i, cid + ":" + i, e.d, String(e.k).slice(0, 24), Math.min(Math.max(e.x, 0), 500), meta, ok, ok ? null : why.join(",")]
          );
          if (ok) {
            out.accepted++;
            const key = e.d + "|" + e.k;
            cnt[key] = (cnt[key] || 0) + 1;
          } else out.rejected.push({ i, why });
          last = Math.max(last, i);
          out.acked = Math.max(out.acked, i);
        }
        out.totalXp = Number((await q("select public.user_total_xp($1::uuid) t", [userId])).rows[0].t);
        out.level = R.lvInfo(out.totalXp).l;
        out.rulesVersion = R.RULES_VERSION;
        return out;
      });
    }
    module.exports = { syncEvents, MAX_BATCH };
  }
});

// http_handler.js
var require_http_handler = __commonJS({
  "http_handler.js"(exports, module) {
    var { syncEvents } = require_sync_core();
    var CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type, apikey", "Access-Control-Allow-Methods": "POST, OPTIONS" };
    async function handle2({ method, headers, bodyText }, { db, getUserId }) {
      if (method === "OPTIONS") return { status: 204, headers: CORS, body: "" };
      if (method !== "POST") return { status: 405, headers: CORS, body: '{"error":"method"}' };
      if (bodyText && bodyText.length > 4e5) return { status: 413, headers: CORS, body: '{"error":"too-large"}' };
      let body;
      try {
        body = JSON.parse(bodyText || "");
      } catch (e) {
        return { status: 400, headers: CORS, body: '{"error":"bad-json"}' };
      }
      const uid = await getUserId(headers["authorization"] || "");
      if (!uid) return { status: 401, headers: CORS, body: '{"error":"unauthorized"}' };
      try {
        const r = await syncEvents(db, uid, body);
        const { status = 200, ...rest } = r;
        return { status, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(rest) };
      } catch (e) {
        console.error("sync error", e.message);
        return { status: 500, headers: CORS, body: '{"error":"server"}' };
      }
    }
    module.exports = { handle: handle2 };
  }
});

// _entry.mjs
var import_http_handler = __toESM(require_http_handler(), 1);
var export_handle = import_http_handler.handle;
export {
  export_handle as handle
};
