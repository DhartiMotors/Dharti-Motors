// Talks to the Google Apps Script backend. GET for public lists, POST (text/plain, no preflight) for everything else.
const TOK_KEY = "dm_tok", KEY_KEY = "dm_key";
const getTok = () => { try { return localStorage.getItem(TOK_KEY) || ""; } catch (e) { return ""; } };
const setTok = (t) => { try { t ? localStorage.setItem(TOK_KEY, t) : localStorage.removeItem(TOK_KEY); } catch (e) {} };
const getKey = () => { try { return sessionStorage.getItem(KEY_KEY) || ""; } catch (e) { return ""; } };
const setKey = (k) => { try { k ? sessionStorage.setItem(KEY_KEY, k) : sessionStorage.removeItem(KEY_KEY); } catch (e) {} };
function visitorId() { try { let v = localStorage.getItem("dm_vid"); if (!v) { v = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now(); localStorage.setItem("dm_vid", v); } return v; } catch (e) { return "none"; } }
async function apiGet(action, params) {
  if (!window.API_OK) return { error: "The website is not connected yet." };
  try { const u = new URL(APPS_SCRIPT_URL); u.searchParams.set("action", action); for (const k in (params || {})) u.searchParams.set(k, params[k]); return await (await fetch(u.toString())).json(); }
  catch (e) { return { error: "Could not reach the server. Please check your connection." }; }
}
async function api(action, data, auth) {
  if (!window.API_OK) return { error: "The website is not connected yet." };
  const body = { action, ...(data || {}) };
  if (auth === "user") body.token = getTok();
  if (auth === "admin") body.key = getKey();
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 90000);
  try { const r = await fetch(APPS_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body), signal: ctl.signal }); return await r.json(); }
  catch (e) { return { error: "Could not reach the server. Please check your connection and try again." }; }
  finally { clearTimeout(t); }
}
