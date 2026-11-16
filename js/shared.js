const $=i=>document.getElementById(i);
const E=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const CAR_SVG='<svg viewBox="0 0 120 50" aria-hidden="true"><path d="M8 34c0-5 3-7 8-8l14-12c3-3 7-4 12-4h26c6 0 10 2 14 6l8 8c8 1 14 3 14 9v3H8z" fill="currentColor"/><circle cx="32" cy="38" r="7" fill="#0B2545" stroke="currentColor" stroke-width="3"/><circle cx="92" cy="38" r="7" fill="#0B2545" stroke="currentColor" stroke-width="3"/></svg>';
const WA_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"/></svg>',HEART='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
const fmtKm=k=>Number(k).toLocaleString("en-IN")+" km";
const fmtP=p=>"₹"+(+p).toFixed(2).replace(/\.?0+$/,"")+" lakh";
const emiEst=p=>{const P=p*1e5*.8,r=.11/12,n=36;return Math.round(P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1))};
const imgsOf=c=>c.imgs&&c.imgs.length?c.imgs:(c.img?[c.img]:[]);
const CAR_MAP={};
function toast(t){const d=document.createElement("div");d.className="toast";d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),6000)}
const IG="dharti_motors_official";
function send(t){try{navigator.clipboard.writeText(t)}catch(e){}window.open("https://ig.me/m/"+IG,"_blank");toast("Your details are copied. Paste them in the Instagram chat and send.")}
const carUrl=id=>new URL("car.html?id="+id,location.href).href;
const waLink=c=>"https://wa.me/?text="+encodeURIComponent(`${c.name} (${c.year})\n${fmtP(c.price)} · ${fmtKm(c.km)} · ${c.fuel}\nDharti Motors, Ahmedabad\n${carUrl(c.id)}`);
const NT=()=>matchMedia("(max-width:720px)").matches?"":' target="_blank" rel="noopener"';
const getSaved=()=>{try{return JSON.parse(localStorage.getItem("dm_saved")||"[]")}catch(e){return[]}};
const isSaved=id=>getSaved().includes(String(id));
function updSavedUI(){const n=getSaved().length;document.querySelectorAll(".sv-n").forEach(e=>e.textContent=n||"")}
function toggleSave(id){id=String(id);let s=getSaved();s=s.includes(id)?s.filter(x=>x!==id):[...s,id];try{localStorage.setItem("dm_saved",JSON.stringify(s))}catch(e){}updSavedUI();return s.includes(id)}
const INSP_GROUPS=[["Engine and transmission",["Engine start and idle","Engine oil leaks","Gearbox and clutch","Exhaust smoke","AC cooling"]],["Brakes and suspension",["Brake pads and discs","Suspension","Steering"]],["Tyres and wheels",["Front tyres","Rear tyres","Spare tyre"]],["Body and paint",["Front body","Rear body","Doors and panels","Paint condition","Windscreen and glass","Accident or flood signs"]],["Interior",["Seats and upholstery","Dashboard","Odometer and warning lights","Power windows","Music system"]],["Electricals",["Battery","Headlights and indicators","Wipers","Horn"]],["Documents",["RC book","Insurance","Service history","Loan cleared"]]];
const parseInsp=s=>(s||"").split(",").map(x=>x.split(":").map(y=>y.trim())).filter(a=>a[0]&&a[1]);
const isBad=r=>/poor|work|repair|replace/i.test(r);
function inspStat(c){const a=parseInsp(c.insp);return{n:a.length,good:a.filter(x=>/^good$/i.test(x[1])).length}}
function inspHtml(c){const a=parseInsp(c.insp);if(!a.length)return"";const st=inspStat(c),by=c.seller==="Dharti Motors"?"Inspected by Dharti Motors":"Reported by the seller, not checked by Dharti Motors",m=new Map(a.map(x=>[x[0],x[1]])),used=new Set(),li=r=>r.map(i=>`<li>${E(i[0])}<b class="${isBad(i[1])?"bad":""}">${E(i[1])}</b></li>`).join("");
 let h=`<h4 class="mh">Inspection report</h4><div class="isum"><strong>${st.good} of ${st.n}</strong> checked points are good<div class="bar"><i style="width:${Math.round(st.good/st.n*100)}%"></i></div><small>${by}</small></div>`;
 INSP_GROUPS.forEach(([g,items])=>{const rows=items.filter(i=>m.has(i));if(!rows.length)return;rows.forEach(i=>used.add(i));h+=`<h5 class="ig">${g}</h5><ul class="insp">${li(rows.map(i=>[i,m.get(i)]))}</ul>`});
 const rest=a.filter(x=>!used.has(x[0]));if(rest.length)h+=`<h5 class="ig">Other</h5><ul class="insp">${li(rest)}</ul>`;return h}
const inspFormHtml=()=>INSP_GROUPS.map(([g,items],gi)=>`<details class="ig-d"${gi===0?" open":""}><summary>${g}</summary>${items.map(i=>`<label class="ir"><span>${i}</span><select data-ins="${E(i)}"><option value="">Not checked</option><option>Good</option><option>Fair</option><option>Needs work</option></select></label>`).join("")}</details>`).join("");
const inspCollect=root=>[...root.querySelectorAll("[data-ins]")].filter(x=>x.value).map(x=>x.dataset.ins+":"+x.value).join(", ");
const shrink=(f,mx=1280)=>new Promise(r=>{const i=new Image();i.onload=()=>{const k=Math.min(1,mx/Math.max(i.width,i.height)),c=document.createElement("canvas");c.width=i.width*k;c.height=i.height*k;c.getContext("2d").drawImage(i,0,0,c.width,c.height);c.toBlob(r,"image/jpeg",.82)};i.src=URL.createObjectURL(f)});
const cleanPhone=v=>v.replace(/[\s-]/g,"").replace(/^\+?91(?=\d{10}$)/,"");
const OK_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>';
const SELL_MSG={new:["Received","We’re reviewing your car details."],contacted:["We’ll contact you","Our team will reach out shortly."],approved:["Approved","Your offer is being prepared."],offered:["Offer ready",""],accepted:["Deal confirmed","Thank you! Our team will arrange the next steps."],rejected:["Not able to proceed","Sorry, we can’t buy this car right now."],listed:["Completed","Thank you for choosing Dharti Motors."],closed:["Completed","Thank you for choosing Dharti Motors."]};
function sellInfo(r){const m=SELL_MSG[r.status]||SELL_MSG.new;return{title:m[0],text:r.status==="offered"?"Our offer: "+(r.offer||"")+". We’ll contact you to confirm.":m[1]}}
async function sellStatus(t){if(!window.API_OK||!t)return null;const r=await apiGet("sellStatus",{token:t});return r&&!r.error&&!r.notFound?r:null}
const blobB64=b=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(String(f.result).split(",")[1]);f.readAsDataURL(b)});
async function aiCall(mode,payload){if(!window.API_OK||!window.AI_ENABLED)return{error:"The AI assistant is not switched on yet."};
 const adm=["review","status","selftest"].includes(mode)||(mode==="listing"&&typeof ADMIN!=="undefined"&&ADMIN);
 const r=await api("ai",{mode,vid:visitorId(),...payload},mode==="assistant"?undefined:adm?"admin":"user");
 return r&&!r.error?r:{error:(r&&r.error)||"The AI assistant is unavailable right now."}}
async function loadCars(){let r;
  if(window.API_OK){const j=await apiGet("listApproved");r=Array.isArray(j)?{live:true,list:j.map(c=>({...c,db:true}))}:{live:true,list:[],failed:true}}
  if(!r)r={live:false,list:(typeof CARS!=="undefined"?CARS:[]).map(c=>({...c}))};
  r.list.forEach(c=>CAR_MAP[c.id]=c);return r}
function cardHtml(c){CAR_MAP[c.id]=c;const im=imgsOf(c),sv=isSaved(c.id);
return `<div class="ticket-wrap"><a class="ticket" href="car.html?id=${c.id}"${NT()}><div class="cover">${im[0]?`<img src="${E(im[0])}" alt="${E(c.name)}" loading="lazy">`:CAR_SVG}<span class="ticket-tag">${E(c.seller||c.owner)}</span>${im.length>1?`<span class="pc">${im.length} photos</span>`:""}${inspStat(c).n>=10?`<span class="ib">✓ ${inspStat(c).good}/${inspStat(c).n} OK</span>`:""}</div><div class="ticket-head"><div class="ticket-route">${E(c.name)}<small>${E(c.brand)} · ${c.year}</small></div></div><div class="sl"><span>${fmtKm(c.km)}</span><span>${E(c.fuel)}</span><span>${E(c.trans)}</span><span>${E(c.owner)}</span></div></a><button class="hrt${sv?" on":""}" data-save="${c.id}" type="button" aria-pressed="${sv}" aria-label="Save ${E(c.name)}">${HEART}</button><a class="wa-share" href="${waLink(c)}" target="_blank" rel="noopener" aria-label="Share ${E(c.name)} on WhatsApp" title="Share on WhatsApp">${WA_ICON}</a><div class="cfoot"><div class="price">${fmtP(c.price)}<small>Est. EMI ₹${emiEst(c.price).toLocaleString("en-IN")}/mo</small></div><button class="btn btn-primary" data-book="${c.id}" type="button">Book test drive</button></div></div>`}
/* booking sheet: 2 fields, remembers the visitor */
function closeBook(){const o=$("bk");if(o){o.remove();document.body.classList.remove("lockb")}}
function openBook(id){const c=CAR_MAP[id];if(!c)return;closeBook();let sv={};try{sv=JSON.parse(localStorage.getItem("dm_me")||"{}")}catch(e){}
 const o=document.createElement("div");o.className="overlay sheet-o";o.id="bk";
 o.innerHTML=`<div class="sheet" role="dialog" aria-modal="true" aria-label="Book a test drive"><div class="sheet-h"><strong>Book a test drive</strong><button class="close" data-bkx type="button" aria-label="Close">✕</button></div><form class="sheet-b" id="bkf" novalidate><p class="bk-car"><strong>${E(c.name)}</strong> · ${c.year} · ${fmtP(c.price)}</p><div class="field"><label for="bkN">Your name</label><input id="bkN" autocomplete="name" value="${E(sv.n||"")}"></div><div class="field"><label for="bkP">Mobile number</label><input id="bkP" type="tel" inputmode="numeric" autocomplete="tel" maxlength="18" placeholder="98XXXXXXXX" value="${E(sv.p||"")}"></div><p class="msg" id="bkM" role="alert"></p><button class="btn btn-primary" id="bkS" type="submit" style="width:100%">Confirm booking</button><p class="form-note">We’ll contact you to confirm a time.</p></form></div>`;
 document.body.appendChild(o);document.body.classList.add("lockb");(sv.n?$("bkP"):$("bkN")).focus();
 o.onclick=e=>{if(e.target===o||e.target.closest("[data-bkx]"))closeBook()};
 $("bkf").onsubmit=async e=>{e.preventDefault();const n=$("bkN").value.trim(),ph=$("bkP").value.replace(/[\s-]/g,"").replace(/^\+?91(?=\d{10}$)/,""),m=$("bkM");
  if(n.length<2){m.textContent="Please enter your name.";return}
  if(!/^[6-9]\d{9}$/.test(ph)){m.textContent="Enter a valid 10-digit mobile number.";return}
  try{localStorage.setItem("dm_me",JSON.stringify({n,p:ph}))}catch(e){}
  if(c.db&&window.API_OK){$("bkS").disabled=true;const j=await api("logLead",{carId:c.id,name:n,phone:ph});if(j.error){$("bkS").disabled=false;m.textContent=j.error;return}
   $("bkf").outerHTML=`<div class="sheet-b ok">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>'}<h3>Request sent</h3><p>The seller will contact you on ${E(ph)}.</p><a class="btn btn-wa" style="width:100%" href="${waLink(c)}" target="_blank" rel="noopener">${WA_ICON}Share this car on WhatsApp</a><button class="btn btn-navy" data-bkx style="width:100%" type="button">Done</button></div>`}
  else{send(`Hi Dharti Motors, I’d like to book a test drive for the ${c.name} (${c.year}, ${fmtP(c.price)}).\nName: ${n}\nPhone: ${ph}`);closeBook()}}}
document.addEventListener("click",e=>{const s=e.target.closest("[data-save]");if(s){e.preventDefault();const on=toggleSave(s.dataset.save);s.classList.toggle("on",on);s.setAttribute("aria-pressed",on);document.dispatchEvent(new CustomEvent("saved-changed"));return}
 const b=e.target.closest("[data-book]");if(b){e.preventDefault();openBook(b.dataset.book)}});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeBook()});
updSavedUI();
