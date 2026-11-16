const ADMIN = document.body.dataset.admin === "1";
let me = null, tab = ADMIN ? "appr" : "post", PREFILL = null, EDIT_FACT = null, TESTING = false, STOP = false;
const SELLS = {}, FROWS = {}, ROWS = {};
const A = (a, d) => api(a, d, ADMIN ? "admin" : "user");
const th = c => (c.images || [])[0] ? `<img src="${E(c.images[0])}" alt="">` : "";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const HINT = '<p class="note" style="margin:0 0 12px">Click a listing to see its full details.</p>';
const QUICK = ["Which documents are needed to buy a car?", "How does RC transfer work?", "What payment methods do you accept?", "What are your test drive timings?", "Do you help with car loans?", "Where are you located?"];
const B = (k, id, t, cls, extra) => `<button class="btn ${cls || "btn-navy"}" data-${k}="${id}" ${extra || ""}>${t}</button>`;
const err = r => `<p>${E((r && r.error) || "Something went wrong. Please try again.")}</p>`;

/* ---------- sign in / tabs ---------- */
async function boot() {
  if (!window.API_OK) { $("nocfg").hidden = false; return; }
  const gate = () => { $("auth").hidden = false; $("app").hidden = true; $("out").hidden = true; $("who").textContent = ""; };
  if (ADMIN) {
    if (!getKey()) { gate(); return; }
    const c = await A("adminCheck");
    if (c.error) { setKey(""); gate(); $("lM").textContent = c.error; return; }
    me = { id: "admin", name: "Admin", role: "admin" };
  } else {
    if (!getTok()) { gate(); return; }
    const r = await A("me");
    if (r.error) { setTok(""); gate(); return; }
    me = r.user;
  }
  $("auth").hidden = true; $("app").hidden = false; $("out").hidden = false; $("who").textContent = me.name + (ADMIN ? " (admin)" : "");
  const t = ADMIN ? [["appr", "Approvals"], ["sell", "Sell requests"], ["all", "All listings"], ["brk", "Brokers"], ["leads", "Enquiries"], ["post", "Post a car"], ["teach", "Teach AI"], ["aitest", "AI check"], ["aiuse", "AI usage"]] : [["post", "Post a car"], ["mine", "My listings"], ["leads", "Enquiries"]];
  let n = 0, m = 0; if (ADMIN) { const c = await A("counts"); n = c.pending || 0; m = c.sellNew || 0; }
  $("tabs").innerHTML = t.map(x => `<button class="tab-btn${x[0] === tab ? " active" : ""}" data-t="${x[0]}">${x[1]}${x[0] === "appr" && n ? " (" + n + ")" : ""}${x[0] === "sell" && m ? " (" + m + ")" : ""}</button>`).join("");
  go();
}
$("tabs").onclick = e => { const b = e.target.closest("[data-t]"); if (b) { tab = b.dataset.t; boot(); } };
$("out").onclick = async () => { if (!ADMIN) await api("logout", { token: getTok() }); setTok(""); setKey(""); location.reload(); };
$("fin").onsubmit = async e => {
  e.preventDefault(); $("lM").textContent = "";
  if (ADMIN) { setKey($("lP").value.trim()); boot(); return; }
  const r = await api("login", { email: $("lE").value.trim(), password: $("lP").value });
  if (r.error) { $("lM").textContent = r.error; return; } setTok(r.token); boot();
};
if ($("fup")) $("fup").onsubmit = async e => {
  e.preventDefault(); $("sM").textContent = "";
  const r = await api("register", { name: $("sN").value.trim(), firm: $("sF").value.trim(), phone: $("sPh").value.trim(), role: $("sR").value, email: $("sE").value.trim(), password: $("sP").value });
  if (r.error) { $("sM").textContent = r.error; return; } setTok(r.token); boot();
};

/* ---------- list rows ---------- */
const row = (c, extra, acts) => (ROWS[c.id] = c, `<div class="item" data-view="${c.id}">${th(c)}<div class="m"><strong>${E(c.name)}</strong><small>${c.year} · ${fmtKm(c.km)} · ${fmtP(c.price)}${c.reject_reason ? " · " + E(c.reject_reason) : ""}</small>${extra || ""}</div><span class="pill ${c.status}">${c.status}${c.featured ? " · featured" : ""}</span><div class="acts">${acts}${c.status === "approved" ? `<a class="btn btn-wa" href="${waLink(c)}" target="_blank" rel="noopener">${WA_ICON}WhatsApp</a>` : ""}</div></div>`);
const by = c => c.profiles ? `<small>By ${E(c.profiles.name)} ${E(c.profiles.firm || "")} ${E(c.profiles.phone || "")}</small>` : "";
const sellActs = s => {
  const st = s.status, o = [];
  if (st === "new" || st === "contacted") o.push(B("sa", s.id, "Approve", "btn-primary"), B("so", s.id, "Make offer"), B("sr", s.id, "Reject"));
  if (st === "new") o.push(B("sc", s.id, "Contacted"));
  if (st === "approved") o.push(B("so", s.id, "Make offer"), B("sr", s.id, "Reject"));
  if (st === "offered") o.push(B("sdn", s.id, "Deal done", "btn-primary"), B("so", s.id, "Change offer"), B("sr", s.id, "Reject"));
  if (st === "accepted") o.push(B("sl", s.id, "List this car", "btn-primary"), B("sx", s.id, "Close"));
  if (st === "rejected" || st === "closed" || st === "listed") o.push(B("sre", s.id, "Reopen"));
  o.push(B("sd", s.id, "Delete")); return o.join("");
};

/* ---------- AI check and usage (admin) ---------- */
async function runTests() {
  if (TESTING) return; TESTING = true; STOP = false; const delay = window.AI_TEST_DELAY ?? 4500;
  const j = await apiGet("listApproved"), inv = (Array.isArray(j) ? j : []).map(c => ({ id: c.id, name: c.name, price: +c.price, fuel: c.fuel, trans: c.trans, body: c.body }));
  const cnt = { PASS: 0, WARN: 0, FAIL: 0, REVIEW: 0, ERROR: 0 }; if ($("tres")) $("tres").innerHTML = ""; let n = 0;
  for (const t of AI_TESTS) {
    if (STOP || !$("tres")) break; n++; $("tsum").textContent = `Running ${n} of ${AI_TESTS.length}…`;
    const msg = { messages: [{ role: "user", text: t.q }] }; let r = await aiCall("selftest", msg);
    if (r.error && /busy/i.test(r.error)) { await sleep(window.AI_TEST_DELAY === 0 ? 0 : 15000); r = await aiCall("selftest", msg); }
    const res = r.error ? { status: "ERROR", notes: [r.error] } : aiCheck(t, r, inv); cnt[res.status]++; if (!$("tres")) break;
    const cls = res.status === "PASS" ? "approved" : res.status === "FAIL" || res.status === "ERROR" ? "rejected" : "";
    $("tres").insertAdjacentHTML("beforeend", `<div class="item" style="align-items:flex-start"><div class="m"><strong>${E(t.q)}</strong><small>${r.error ? "" : E((r.reply || "").slice(0, 400))}</small>${res.notes.length ? `<small style="color:var(--red)">${res.notes.map(E).join(" · ")}</small>` : ""}${(r.car_ids || []).length ? `<small>Cars shown: ${(r.car_ids || []).map(i => E((inv.find(c => c.id === i) || {}).name || i)).join(", ")}</small>` : ""}</div><span class="pill ${cls}">${res.status}</span></div>`);
    if (delay) await sleep(delay);
  }
  if ($("tsum")) $("tsum").textContent = `${STOP ? "Stopped. " : "Finished. "}${cnt.PASS} passed · ${cnt.WARN} to check · ${cnt.FAIL} failed · ${cnt.REVIEW} for you to read · ${cnt.ERROR} errors (${n} of ${AI_TESTS.length} asked)`; TESTING = false;
}
async function testConn() { const o = $("conn"); o.textContent = "Testing…"; const t = Date.now(), r = await aiCall("selftest", { messages: [{ role: "user", text: "Hi" }] }); o.textContent = r.error ? "Not working: " + r.error : `Working. The AI answered in ${((Date.now() - t) / 1000).toFixed(1)} seconds.`; }
const bar = (n, max) => `<div style="background:var(--line);border-radius:4px;height:10px;margin:6px 0"><i style="display:block;height:100%;border-radius:4px;background:${n / max > .8 ? "var(--red)" : "var(--gold)"};width:${Math.min(100, max ? n / max * 100 : 0)}%"></i></div>`;
async function usagePage() {
  const v = $("v"); v.innerHTML = "<p>Loading…</p>"; const [st, s] = await Promise.all([aiCall("status", {}), A("aiStats")]); if (tab !== "aiuse") return;
  let h = `<div class="card"><h3>AI status</h3>`;
  if (st.error) h += `<p>${/switched off/i.test(st.error) ? "The AI is switched OFF (AI_DISABLED property)." : "Could not reach the AI: " + E(st.error)}</p><p class="note">Check that <code>AI_ENABLED</code> is true in js/config.js and that <code>GEMINI_API_KEY</code> is saved in Apps Script (Project settings, Script properties).</p>`;
  else h += `<p><strong>Google Gemini</strong> · model <code>${E(st.model)}</code> · API key ${st.key_present ? "is set" : "is MISSING"}</p><p class="note">Limits per day: ${st.limits.global} for the whole site, ${st.limits.listing} per broker. Questions per visitor per hour: ${st.limits.hour}. You can change them in Apps Script > Project settings > Script properties.</p>`;
  h += `<div class="acts">${B("tc", "1", "Test connection")}</div><p class="msg" id="conn"></p></div>`;
  if (s.error) { h += `<p style="margin-top:16px">Usage numbers are not available: ${E(s.error)}</p>`; v.innerHTML = h; return; }
  const cap = st.limits ? st.limits.global : 0, oc = s.by_outcome || {}, tot = s.last24h || 0;
  h += `<div class="card" style="margin-top:16px"><h3>Last 24 hours</h3><p><strong>${tot}</strong> AI requests${cap ? ` of ${cap} allowed (${Math.round(tot / cap * 100)}%)` : ""}. Today: ${s.today}.</p>${cap ? bar(tot, cap) : ""}${cap && tot / cap > .8 ? '<p class="msg" style="color:var(--red)">You are close to your daily limit. Visitors will see a "try again later" message when it is reached.</p>' : ""}
 <p>Worked: <strong>${oc.ok || 0}</strong> · Busy: <strong>${oc.busy || 0}</strong> · Errors: <strong>${(oc.error || 0) + (oc.not_configured || 0)}</strong> · Rejected: <strong>${oc.rejected || 0}</strong>${oc.unknown ? ` · No result recorded: ${oc.unknown}` : ""}</p><p>Average answer time: <strong>${s.avg_ms ? (s.avg_ms / 1000).toFixed(1) + " seconds" : "n/a"}</strong> · By type: ${Object.entries(s.by_mode || {}).map(([k, n]) => E(k) + " " + n).join(", ") || "none yet"}</p>`;
  const now = new Date(); now.setMinutes(0, 0, 0); const m = new Map((s.hourly || []).map(x => { const d = new Date(x.h); d.setMinutes(0, 0, 0); return [d.getTime(), x.n]; })), bars = []; for (let i = 23; i >= 0; i--) bars.push(m.get(now.getTime() - i * 3600e3) || 0); const mx = Math.max(1, ...bars);
  h += `<p class="note" style="margin:10px 0 4px">Requests per hour (oldest to newest)</p><div style="display:flex;align-items:flex-end;gap:3px;height:80px">${bars.map(n => `<i title="${n}" style="flex:1;background:var(--gold);height:${Math.max(4, n / mx * 100)}%;border-radius:2px"></i>`).join("")}</div></div>`;
  h += `<div class="card" style="margin-top:16px"><h3>Recent problems</h3>${(s.recent_errors || []).length ? s.recent_errors.map(e => `<div class="item"><div class="m"><strong>${E(e.outcome)}</strong><small>${E(e.mode)} · ${E(e.provider || "")} ${E(e.model || "")} · ${new Date(e.created_at).toLocaleString("en-IN")}</small></div></div>`).join("") : "<p>No problems recorded. 👍</p>"}<p class="note">More detail: in Apps Script, open Executions.</p></div>`;
  v.innerHTML = h;
}
async function aiReview(id) {
  const o = $("aiRev"); o.innerHTML = '<p class="note">Reviewing photos and details… this can take about 20 seconds.</p>'; const r = await aiCall("review", { car_id: +id });
  if (r.error) { o.innerHTML = `<p class="note">${E(r.error)}</p>`; return; }
  const col = { red: "var(--red)", amber: "var(--gold-ink)", green: "#2e7d32" };
  o.innerHTML = `<div class="dbox"><h4 class="mh">✨ AI review (a suggestion only, you decide)</h4><p>${E(r.summary)}</p><ul class="insp" style="grid-template-columns:1fr">${(r.flags || []).map(f => `<li><span>${E(f.text)}</span><b style="color:${col[f.level] || col.amber}">${E(f.level)}</b></li>`).join("")}</ul><p class="note">Suggestion: ${E(String(r.recommendation || "").replace("_", " "))} · Price: ${E(r.price_view || "unknown")}${r.odometer_reading ? " · Odometer in photo: " + r.odometer_reading + " km" : ""}${r.stats && r.stats.n ? ` · Similar listings: Rs ${r.stats.min} to ${r.stats.max} lakh (${r.stats.n})` : ""}</p></div>`;
}

/* ---------- details window ---------- */
let curC = null;
function showPhoto(i) { const l = curC.images || []; $("dbig").innerHTML = l.length ? `<img src="${E(l[i])}" alt="Photo ${i + 1}">` : CAR_SVG; $("dth").innerHTML = l.length > 1 ? l.map((s, k) => `<button type="button" data-i="${k}" class="${k === i ? "on" : ""}" aria-label="Photo ${k + 1}"><img src="${E(s)}" alt=""></button>`).join("") : ""; }
function openDetail(id) {
  const c = ROWS[id]; if (!c) return; curC = c; const p = c.profiles || null, own = me && String(c.owner) === String(me.id), d = x => x ? new Date(x).toLocaleDateString("en-IN") : "n/a", n = (c.images || []).length;
  const A2 = []; if (ADMIN) { if (c.status !== "approved" && c.status !== "sold") A2.push(B("a", c.id, "Approve", "btn-primary")); if (c.status !== "rejected") A2.push(B("r", c.id, "Reject")); A2.push(B("f", c.id, c.featured ? "Unfeature" : "Feature", null, `data-on="${c.featured ? 0 : 1}"`)); }
  if (ADMIN && window.AI_ENABLED) A2.unshift(B("ai", c.id, "✨ AI review", "btn-primary"));
  if (c.status !== "sold") A2.push(B("s", c.id, "Mark sold")); A2.push(B("x", c.id, "Delete"));
  if (c.status === "approved") A2.push(`<a class="btn btn-wa" href="${waLink(c)}" target="_blank" rel="noopener">${WA_ICON}Share on WhatsApp</a>`, `<a class="btn btn-navy" href="car.html?id=${c.id}" target="_blank" rel="noopener">Open public page</a>`);
  $("dbody").innerHTML = `<div class="cdetail in"><div><div class="cover big" id="dbig"></div><div class="thumbs" id="dth" style="padding:10px 0 0"></div><p class="note" style="margin-top:8px">${n} photo${n === 1 ? "" : "s"}${n ? "" : " · no photos added"}</p></div>
<div><span class="pill ${c.status}">${c.status}${c.featured ? " · featured" : ""}</span><h3 style="font-size:26px;margin:10px 0 4px">${E(c.name)}</h3><p>${E(c.brand)} · ${c.year}</p>
<div class="price" style="margin:10px 0 14px;font-size:28px"><span>Price</span>${fmtP(c.price)}</div>
<div class="specs" style="padding:0">${[["Year", c.year], ["Driven", fmtKm(c.km)], ["Fuel", c.fuel], ["Gear", c.trans], ["Type", c.body], ["Owner", c.owner_type]].map(x => `<div><span>${x[0]}</span><strong>${E(x[1])}</strong></div>`).join("")}</div>
<div class="tags">${(c.tags || []).map(t => `<span>${E(t)}</span>`).join("")}</div>
${c.description ? `<div class="dbox"><h4 class="mh">Description</h4><p style="white-space:pre-wrap">${E(c.description)}</p></div>` : ""}
${inspHtml({ ...c, seller: (p && p.role === "admin") ? "Dharti Motors" : "" }) || '<p class="note">No inspection details added.</p>'}
<div class="dbox"><h4 class="mh">Listed by</h4>${p ? `<p><strong>${E(p.name)}</strong>${p.firm ? " · " + E(p.firm) : ""}</p><p>${p.phone ? `<a href="tel:${E(p.phone)}">${E(p.phone)}</a>` : "No phone"}</p><p>${E(p.role || "")} · ${p.verified ? "Verified" : "Not verified"}</p>` : `<p>${own ? "You" : "Unknown"}</p>`}<p>Submitted ${d(c.created_at)} · Expires ${d(c.expires_at)}</p>${c.reject_reason ? `<p><strong>Reject reason:</strong> ${E(c.reject_reason)}</p>` : ""}</div>
<div id="aiRev"></div><div class="acts">${A2.join("")}</div></div></div>`;
  showPhoto(0); $("dov").hidden = false;
}

/* ---------- tabs ---------- */
async function go() {
  const v = $("v");
  if (tab === "post") {
    v.innerHTML = `<form class="card" id="pf"><div class="row"><div class="field"><label for="n">Car name</label><input id="n" required placeholder="Maruti Swift VXi"></div><div class="field"><label for="b">Brand</label><input id="b" required placeholder="Maruti Suzuki"></div></div><div class="row"><div class="field"><label for="y">Year</label><input id="y" type="number" min="1995" max="2027" required></div><div class="field"><label for="k">Kms driven</label><input id="k" type="number" min="0" required></div></div><div class="row"><div class="field"><label for="p">Price (₹ lakh)</label><input id="p" type="number" step="0.01" min="0.1" required></div><div class="field"><label for="o">Owner</label><select id="o"><option>1st owner</option><option>2nd owner</option><option>3rd owner</option></select></div></div><div class="row"><div class="field"><label for="f">Fuel</label><select id="f"><option>Petrol</option><option>Diesel</option><option>CNG</option><option>Electric</option></select></div><div class="field"><label for="t">Gearbox</label><select id="t"><option>Manual</option><option>Automatic</option></select></div></div><div class="row"><div class="field"><label for="bd">Body type</label><select id="bd"><option>Hatchback</option><option>Sedan</option><option>SUV</option></select></div></div>
<div class="row"><div class="field full"><label for="ph">Photos (5 to 12). The first photo is the cover.</label><input id="ph" type="file" accept="image/*" multiple required><div class="pguide">Recommended shots: front-left corner (use as the cover), rear-right corner, front, rear, both sides, dashboard with odometer, front seats, back seats, boot, engine bay, tyres, and any dent or scratch. Take them in daylight with the car clean.</div><div class="pprev" id="pprev"></div></div></div>
<div class="field full"><label>Inspection checklist (30 points). Fill in only what was really checked.</label><div id="insf">${inspFormHtml()}</div></div>
<div class="row"><div class="field full"><label for="tg">Highlights (comma separated)</label><input id="tg"></div></div>
<div class="field full"><label for="ds">Description</label><textarea id="ds" maxlength="1500" placeholder="A short, honest description of the car."></textarea></div>
${window.AI_ENABLED ? '<div class="field full"><button class="btn btn-navy" id="aiDraft" type="button">✨ Draft with AI</button><p class="note" style="margin:6px 0 0">Your photos and car details are sent to an AI service to prepare the draft.</p><div id="aiOut" class="pguide" hidden></div></div>' : ""}
<button class="btn btn-primary" type="submit" id="pb">${ADMIN ? "Publish car" : "Submit for approval"}</button><p class="msg" id="pm" role="alert"></p></form>`;
    if (PREFILL) { const P = PREFILL; $("n").value = P.name || ""; $("b").value = P.brand || ""; $("y").value = P.year || ""; $("k").value = P.km || ""; if (P.price) $("p").value = P.price; if (P.fuel) $("f").value = P.fuel; $("ph").required = false; $("pprev").innerHTML = (P.images || []).map(u => `<img src="${E(u)}" alt="">`).join("") + `<small>${(P.images || []).length} photo(s) from the seller are included. You can add more.</small>`; $("pm").textContent = "Filled in from the seller’s request. Check everything before publishing."; }
    $("ph").onchange = () => { const fl = [...$("ph").files].slice(0, 12); $("pprev").innerHTML = fl.map(f => `<img src="${URL.createObjectURL(f)}" alt="">`).join("") + `<small>${fl.length} photo${fl.length === 1 ? "" : "s"}${fl.length + (PREFILL ? PREFILL.images.length : 0) < 5 ? " (add at least 5 in total)" : ""}</small>`; };
    if ($("aiDraft")) $("aiDraft").onclick = async () => {
      const o = $("aiOut"), b = $("aiDraft"); if (!$("n").value.trim() || !$("b").value.trim() || !$("y").value) { o.hidden = false; o.textContent = "Fill in the car name, brand, year and kms first, and add your photos."; return; }
      b.disabled = true; o.hidden = false; o.textContent = "Checking your photos and writing a draft… this can take about 20 seconds."; const imgs = [];
      try { for (const f of [...$("ph").files].slice(0, 6)) imgs.push(await blobB64(await shrink(f, 1024))); } catch (e) {}
      const r = await aiCall("listing", { car: { name: $("n").value, brand: $("b").value, year: +$("y").value || null, km: +$("k").value || null, fuel: $("f").value, trans: $("t").value, owner: $("o").value, body: $("bd").value, tags: $("tg").value, insp: inspCollect($("insf")) }, images: imgs }); b.disabled = false;
      if (r.error) { o.textContent = r.error; return; }
      if (r.description && (!$("ds").value.trim() || confirm("Replace your description with the AI draft?"))) $("ds").value = r.description;
      if ((r.highlights || []).length && !$("tg").value.trim()) $("tg").value = r.highlights.join(", ");
      const li = (h, a) => a && a.length ? `<p><strong>${h}</strong></p><ul>${a.map(x => `<li>${E(x)}</li>`).join("")}</ul>` : "";
      o.innerHTML = `<p><strong>AI draft added. Please read and edit it before you submit.</strong></p>${r.title ? `<p>Suggested name: <strong>${E(r.title)}</strong></p>` : ""}${r.odometer_reading ? `<p>Odometer in photo: ${r.odometer_reading} km</p>` : ""}${li("Check these", r.warnings)}${li("Photo notes", r.photo_notes)}${li("Missing photos", r.missing_photos)}`;
    };
    $("pf").onsubmit = async e => {
      e.preventDefault(); const pre = PREFILL ? PREFILL.images : [], fl = [...$("ph").files].slice(0, 12);
      if (fl.length + pre.length < 5) { $("pm").textContent = "Please add at least 5 photos so buyers can see the car properly."; return; }
      $("pb").disabled = true; $("pm").textContent = "Uploading photos… this can take a little while."; const imgs = [];
      try { for (const f of fl) imgs.push(await blobB64(await shrink(f))); } catch (x) { $("pb").disabled = false; $("pm").textContent = "One of the photos could not be read. Please choose it again."; return; }
      const L = s => s.split(",").map(x => x.trim()).filter(Boolean);
      const r = await A("postCar", { name: $("n").value.trim(), brand: $("b").value.trim(), year: +$("y").value, km: +$("k").value, price: +$("p").value, fuel: $("f").value, trans: $("t").value, body: $("bd").value, owner_type: $("o").value, insp: inspCollect($("insf")), tags: L($("tg").value), description: $("ds").value.trim(), images: imgs, imageUrls: pre, sellId: PREFILL ? PREFILL.id : undefined });
      $("pb").disabled = false; if (r.error) { $("pm").textContent = r.error; return; }
      PREFILL = null; $("pm").textContent = ADMIN ? "Published. It is now live on the website." : "Submitted. We’ll review it and publish it soon."; $("pf").reset(); $("pprev").innerHTML = "";
    };
  }
  if (tab === "mine") { const r = await A("carsList"); v.innerHTML = r.error ? err(r) : r.rows.length ? HINT + r.rows.map(c => row(c, "", (c.status !== "sold" ? B("s", c.id, "Mark sold") : "") + B("x", c.id, "Delete"))).join("") : "<p>You haven’t listed any cars yet.</p>"; }
  if (tab === "leads") { const r = await A("leadsList"); v.innerHTML = r.error ? err(r) : r.rows.length ? r.rows.map(l => `<div class="item"><div class="m"><strong>${E(l.name)}</strong><small>${E(l.cars && l.cars.name)} · ${new Date(l.created_at).toLocaleDateString("en-IN")}</small></div><a class="btn btn-primary" href="tel:${E(l.phone)}">${E(l.phone)}</a></div>`).join("") : "<p>No enquiries yet.</p>"; }
  if (tab === "appr") { const r = await A("carsList", { scope: "pending" }); v.innerHTML = r.error ? err(r) : r.rows.length ? HINT + r.rows.map(c => row(c, by(c), B("a", c.id, "Approve", "btn-primary") + B("r", c.id, "Reject"))).join("") : "<p>Nothing is waiting for approval.</p>"; }
  if (tab === "sell") {
    const r = await A("sellList"); if (r.error) { v.innerHTML = err(r); return; } r.rows.forEach(s => SELLS[s.id] = s);
    v.innerHTML = r.rows.length ? r.rows.map(s => `<div class="item" style="align-items:flex-start"><div class="m"><strong>${E(s.car)} · ${s.year}</strong><small>${fmtKm(s.km)} · ${E(s.fuel || "")}${s.expected ? " · expects ₹" + s.expected + " lakh" : ""}</small><small>${E(s.name)} · <a href="tel:${E(s.phone)}" style="color:var(--gold-ink);font-weight:700">${E(s.phone)}</a> · ${new Date(s.created_at).toLocaleDateString("en-IN")}</small>${s.offer ? `<small><strong>Offer:</strong> ${E(s.offer)}</small>` : ""}${s.reason ? `<small><strong>Reason:</strong> ${E(s.reason)}</small>` : ""}<div class="pprev">${(s.images || []).map(u => `<a href="${E(u)}" target="_blank" rel="noopener"><img src="${E(u)}" alt="Seller photo"></a>`).join("")}</div></div><span class="pill ${s.status === "closed" ? "rejected" : s.status}">${s.status}</span><div class="acts"><a class="btn btn-primary" href="tel:${E(s.phone)}">Call</a><a class="btn btn-wa" href="https://wa.me/91${E(s.phone)}?text=${encodeURIComponent(s.offer ? "Hi " + s.name + ", this is Dharti Motors. Our offer for your " + s.car + " (" + s.year + ") is " + s.offer + ". Please let us know if you would like to go ahead." : "Hi " + s.name + ", this is Dharti Motors about your " + s.car + " (" + s.year + ").")}" target="_blank" rel="noopener">${WA_ICON}WhatsApp</a>${sellActs(s)}</div></div>`).join("") : "<p>No sell requests yet.</p>";
  }
  if (tab === "all") { const r = await A("carsList", { scope: "all" }); v.innerHTML = r.error ? err(r) : r.rows.length ? HINT + r.rows.map(c => row(c, by(c), (c.status !== "approved" && c.status !== "sold" ? B("a", c.id, "Approve", "btn-primary") : "") + (c.status !== "rejected" ? B("r", c.id, "Reject") : "") + B("f", c.id, c.featured ? "Unfeature" : "Feature", null, `data-on="${c.featured ? 0 : 1}"`) + (c.status !== "sold" ? B("s", c.id, "Mark sold") : "") + B("x", c.id, "Delete"))).join("") : "<p>No listings yet.</p>"; }
  if (tab === "brk") { const r = await A("usersList"); v.innerHTML = r.error ? err(r) : r.rows.length ? r.rows.map(p => `<div class="item"><div class="m"><strong>${E(p.name)}</strong><small>${E(p.firm || "")} ${E(p.phone || "")} · ${E(p.email || "")} · ${E(p.role)}</small></div><span class="pill">${p.verified ? "verified" : "not verified"}</span>${p.active ? "" : '<span class="pill rejected">disabled</span>'}<div class="acts">${B("v", p.id, p.verified ? "Remove badge" : "Verify", null, `data-on="${p.verified ? 0 : 1}"`)}${B("u", p.id, p.active ? "Disable" : "Enable", null, `data-on="${p.active ? 0 : 1}"`)}</div></div>`).join("") : "<p>No brokers yet.</p>"; }
  if (tab === "teach") {
    const r = await A("factsList"); if (r.error) { v.innerHTML = err(r); return; } r.rows.forEach(f => FROWS[f.id] = f); const ed = EDIT_FACT ? FROWS[EDIT_FACT] : null;
    v.innerHTML = `<div class="card"><h3 style="margin-bottom:6px">Teach the AI</h3><p class="note" style="margin:0 0 12px">Write real answers about your business. The AI uses them straight away. Only add things that are true. Do not put phone numbers or secrets here, because customers can see what the AI says.</p><div class="chips wr" id="tq">${QUICK.map(q => `<button class="chip" type="button" data-q="${E(q)}">${E(q)}</button>`).join("")}</div>
  <form id="tf"><div class="row"><div class="field"><label for="tkind">Type</label><select id="tkind"><option value="qa">Question and answer</option><option value="fact">General fact or rule</option></select></div><div class="field" id="tqw"><label for="tqn">Customer question</label><input id="tqn" maxlength="300" placeholder="e.g. Which documents do I need to buy a car?"></div></div><div class="field full" style="margin-top:10px"><label for="tan">Answer (what the AI should say)</label><textarea id="tan" maxlength="800" placeholder="Write it exactly as you want customers to hear it."></textarea></div><div class="acts" style="margin-top:12px"><button class="btn btn-primary" type="submit">${ed ? "Save changes" : "Add"}</button>${ed ? '<button class="btn btn-navy" type="button" id="tcancel">Cancel</button>' : ""}</div><p class="msg" id="tmsg" role="alert"></p></form></div>
  <h3 style="margin:24px 0 10px">${r.rows.length} saved</h3>${r.rows.length ? r.rows.map(f => `<div class="item"><div class="m"><strong>${f.kind === "qa" ? "Q: " + E(f.question) : "Fact or rule"}</strong><small>${E(f.answer)}</small></div><span class="pill ${f.active ? "approved" : "rejected"}">${f.active ? "on" : "off"}</span><div class="acts">${B("fe", f.id, "Edit")}${B("ft", f.id, f.active ? "Turn off" : "Turn on")}${B("fd", f.id, "Delete")}</div></div>`).join("") : "<p>Nothing yet. Tap one of the suggestions above to start.</p>"}`;
    const sk = () => { $("tqw").hidden = $("tkind").value === "fact"; }; if (ed) { $("tkind").value = ed.kind; $("tqn").value = ed.question || ""; $("tan").value = ed.answer; } sk(); $("tkind").onchange = sk;
    if ($("tcancel")) $("tcancel").onclick = () => { EDIT_FACT = null; boot(); };
    $("tq").onclick = e => { const b = e.target.closest("[data-q]"); if (b) { $("tkind").value = "qa"; sk(); $("tqn").value = b.dataset.q; $("tan").focus(); } };
    $("tf").onsubmit = async e => {
      e.preventDefault(); const kind = $("tkind").value, q = $("tqn").value.trim(), a = $("tan").value.trim(), m = $("tmsg");
      if (kind === "qa" && q.length < 3) { m.textContent = "Please write the customer question."; return; } if (a.length < 2) { m.textContent = "Please write the answer."; return; }
      if (/\b\d{10}\b/.test(a) && !confirm("This answer contains a 10-digit number that looks like a phone number. Customers will see it. Continue?")) return;
      const s = await A("factsSave", { id: EDIT_FACT || undefined, kind, question: kind === "qa" ? q : "", answer: a }); if (s.error) { m.textContent = s.error; return; } EDIT_FACT = null; boot();
    };
  }
  if (tab === "aitest") { v.innerHTML = window.AI_ENABLED ? `<div class="card"><h3>AI self-test</h3><p class="note">Asks the AI ${AI_TESTS.length} typical questions in English, Hindi and Gujarati, and checks the answers: the right language, the budget, no false promises, handing over when unsure. It uses ${AI_TESTS.length} AI requests and takes a few minutes, so stay on this page. Answers marked REVIEW need your own eye.</p><div class="acts">${B("tr", "1", "Run self-test", "btn-primary")}${B("ts", "1", "Stop")}</div><p class="msg" id="tsum"></p></div><div id="tres" style="margin-top:14px"></div>` : "<p>Turn the AI on first: set <code>window.AI_ENABLED = true</code> in js/config.js.</p>"; }
  if (tab === "aiuse") usagePage();
}

/* ---------- actions ---------- */
async function act(d) {
  if (d.ai) { aiReview(d.ai); return; } if (d.tr) { runTests(); return; } if (d.ts) { STOP = true; return; } if (d.tc) { testConn(); return; }
  let ch = false; const ok = r => { if (r.error) { alert(r.error); return false; } return true; }, S = (id, op, x) => A("sellAction", { id, op, ...x });
  if (d.ft && FROWS[d.ft] && ok(await A("factsAction", { id: d.ft, op: "toggle" }))) ch = true;
  if (d.fd && confirm("Delete this entry?") && ok(await A("factsAction", { id: d.fd, op: "delete" }))) ch = true;
  if (d.fe) { EDIT_FACT = +d.fe; ch = true; }
  if (d.s && ok(await A("carAction", { id: d.s, op: "sold" }))) ch = true;
  if (d.x && confirm("Delete this listing?") && ok(await A("carAction", { id: d.x, op: "delete" }))) ch = true;
  if (d.a && ok(await A("carAction", { id: d.a, op: "approve" }))) ch = true;
  if (d.r) { const why = prompt("Reason for rejecting (the broker will see this):"); if (why === null) return; if (ok(await A("carAction", { id: d.r, op: "reject", reason: why }))) ch = true; }
  if (d.f && ok(await A("carAction", { id: d.f, op: d.on === "1" ? "feature" : "unfeature" }))) ch = true;
  if (d.v && ok(await A("userAction", { id: d.v, op: d.on === "1" ? "verify" : "unverify" }))) ch = true;
  if (d.u && ok(await A("userAction", { id: d.u, op: d.on === "1" ? "enable" : "disable" }))) ch = true;
  if (d.sc && ok(await S(d.sc, "contacted"))) ch = true;
  if (d.sa && ok(await S(d.sa, "approve"))) ch = true;
  if (d.so) { const o = prompt("Offer for the seller, e.g. ₹4.5 lakh, valid for 3 days:", (SELLS[d.so] && SELLS[d.so].offer) || ""); if (o === null) return; if (ok(await S(d.so, "offer", { offer: o }))) { ch = true; toast("Offer saved. Tap WhatsApp on that request to send it to the seller."); } }
  if (d.sdn && ok(await S(d.sdn, "accepted"))) ch = true;
  if (d.sr) { const w = prompt("Reason for rejecting (optional):"); if (w === null) return; if (ok(await S(d.sr, "reject", { reason: w || "" }))) ch = true; }
  if (d.sx && ok(await S(d.sx, "close"))) ch = true;
  if (d.sre && ok(await S(d.sre, "reopen"))) ch = true;
  if (d.sl) { const s = SELLS[d.sl]; if (s) { PREFILL = { id: s.id, name: s.car, brand: (s.car || "").split(" ")[0], year: s.year, km: s.km, fuel: s.fuel, price: s.expected, images: s.images || [] }; tab = "post"; ch = true; } }
  if (d.sd && confirm("Delete this request?") && ok(await S(d.sd, "delete"))) ch = true;
  if (ch) { $("dov").hidden = true; boot(); }
}
$("v").onclick = e => { const b = e.target.closest("button"); if (b && b.closest(".acts")) return act(b.dataset); const it = e.target.closest(".item[data-view]"); if (it && !e.target.closest("a")) openDetail(it.dataset.view); };
$("dbody").onclick = e => { const t = e.target.closest("[data-i]"); if (t) return showPhoto(+t.dataset.i); const b = e.target.closest("button"); if (b) act(b.dataset); };
$("dclose").onclick = () => $("dov").hidden = true; $("dov").onclick = e => { if (e.target === $("dov")) $("dov").hidden = true; };
document.addEventListener("keydown", e => { if (e.key === "Escape") $("dov").hidden = true; });
boot();
