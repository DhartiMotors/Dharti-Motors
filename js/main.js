const DEF={body:"All",brand:"",budget:"",fuel:"",trans:"",year:0,km:0,q:"",saved:false};
let F={...DEF,sort:"new"},ALL=[];
try{Object.assign(F,JSON.parse(sessionStorage.getItem("dm_f")||"{}"))}catch(e){}
const BODIES=["All","Hatchback","Sedan","SUV"],BUD=[["0-5","Under ₹5L"],["5-8","₹5–8L"],["8-12","₹8–12L"],["12-999","₹12L+"]];
const chip=(a,l,on,x)=>`<button class="chip${on?" on":""}${x?" x":""}" ${a} type="button">${l}</button>`;
const sk='<div class="ticket-wrap sk"><div class="cover"></div><div class="ln" style="width:60%"></div><div class="ln" style="width:85%"></div><div class="ln" style="width:40%;margin-bottom:22px"></div></div>';
$("grid").innerHTML=sk+sk+sk;
function ok(c){const [a,b]=F.budget?F.budget.split("-").map(Number):[0,1e9],q=F.q.trim().toLowerCase();
 return(F.body==="All"||c.body===F.body)&&(!F.brand||c.brand===F.brand)&&c.price>=a&&c.price<=b&&(!F.fuel||c.fuel===F.fuel)&&(!F.trans||c.trans===F.trans)&&(!F.year||c.year>=F.year)&&(!F.km||c.km<=F.km)&&(!F.saved||getSaved().includes(String(c.id)))&&(!q||(c.name+" "+c.brand).toLowerCase().includes(q))}
function renderChips(){const n=getSaved().length;
 $("chips").innerHTML=BODIES.map(b=>chip(`data-body="${b}"`,b==="All"?"All cars":b,F.body===b)).join("")+BUD.map(([v,l])=>chip(`data-budget="${v}"`,l,F.budget===v)).join("")+chip("data-saved",`♥ Saved${n?" ("+n+")":""}`,F.saved)}
function render(){
 const list=ALL.filter(ok),s=F.sort;list.sort((a,b)=>s==="low"?a.price-b.price:s==="high"?b.price-a.price:s==="km"?a.km-b.km:b.year-a.year);
 const nf=["brand","fuel","trans"].filter(k=>F[k]).length+(F.year?1:0)+(F.km?1:0)+(F.budget?1:0),any=nf||F.body!=="All"||F.q||F.saved;
 $("fCount").textContent=nf||"";$("count").textContent=list.length+(list.length===1?" car":" cars");$("passCount").textContent=ALL.length+" cars in stock";$("fApply").textContent="Show "+list.length+(list.length===1?" car":" cars");
 const a=[];if(F.brand)a.push(chip('data-x="brand"',E(F.brand)+" ✕",1,1));if(F.fuel)a.push(chip('data-x="fuel"',F.fuel+" ✕",1,1));if(F.trans)a.push(chip('data-x="trans"',F.trans+" ✕",1,1));if(F.year)a.push(chip('data-x="year"',F.year+" or newer ✕",1,1));if(F.km)a.push(chip('data-x="km"',"Under "+F.km.toLocaleString("en-IN")+" km ✕",1,1));if(any)a.push(chip('data-x="all"',"Clear all",0,0));
 $("active").innerHTML=a.join("");renderChips();$("sort").value=F.sort;$("q").value=F.q;
 $("grid").innerHTML=list.length?list.map(cardHtml).join(""):`<div class="no-match"><h3>${F.saved&&!getSaved().length?"No saved cars yet":"No cars match these filters"}</h3><p>${F.saved&&!getSaved().length?"Tap the heart on a car to save it here.":"Try removing a filter, or message us what you want and we’ll look for it."}</p></div>`;
 try{sessionStorage.setItem("dm_f",JSON.stringify(F))}catch(e){}}
$("chips").onclick=e=>{const b=e.target.closest(".chip");if(!b)return;const d=b.dataset;if(d.body!==undefined)F.body=d.body;else if(d.budget!==undefined)F.budget=F.budget===d.budget?"":d.budget;else F.saved=!F.saved;render()};
$("active").onclick=e=>{const b=e.target.closest("[data-x]");if(!b)return;const k=b.dataset.x;if(k==="all")F={...DEF,sort:F.sort};else F[k]=(k==="year"||k==="km")?0:"";render()};
$("q").oninput=e=>{F.q=e.target.value;render();$("q").focus()};$("sort").onchange=e=>{F.sort=e.target.value;render()};
document.addEventListener("saved-changed",()=>{if(F.saved)render();else renderChips()});
$("savedBtn").onclick=()=>{F.saved=true;render();$("cars").scrollIntoView()};
$("hSearch").onclick=()=>{F.brand=$("hBrand").value;F.budget=$("hBudget").value;F.fuel=$("hFuel").value;render();$("cars").scrollIntoView()};
/* filter sheet */
const fs=$("fs");
function syncSheet(){$("fBrand").value=F.brand;$("fBudget").value=F.budget;$("fYear").value=F.year;$("fKm").value=F.km;fs.querySelectorAll("[data-sf]").forEach(b=>b.classList.toggle("on",F[b.dataset.sf]===b.dataset.v))}
const shut=()=>{fs.hidden=true;document.body.classList.remove("lockb")};
$("fBtn").onclick=()=>{syncSheet();fs.hidden=false;document.body.classList.add("lockb")};
fs.onchange=e=>{const t=e.target,m={fBrand:["brand",v=>v],fBudget:["budget",v=>v],fYear:["year",Number],fKm:["km",Number]}[t.id];if(m){F[m[0]]=m[1](t.value);render()}};
fs.onclick=e=>{const b=e.target.closest("[data-sf]");if(b){F[b.dataset.sf]=F[b.dataset.sf]===b.dataset.v?"":b.dataset.v;render();syncSheet();return}
 if(e.target.id==="fReset"){Object.assign(F,{brand:"",budget:"",fuel:"",trans:"",year:0,km:0});render();syncSheet();return}
 if(e.target===fs||e.target.closest("[data-fx]"))shut()};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!fs.hidden)shut()});
/* forms */
$("sellForm").onsubmit=async e=>{e.preventDefault();const f=$("sellForm"),m=$("sM"),n=$("sName").value.trim(),ph=cleanPhone($("sPhone").value);
 if($("sHp").value)return;
 if(n.length<2){m.textContent="Please enter your name.";return}
 if(!/^[6-9]\d{9}$/.test(ph)){m.textContent="Enter a valid 10-digit mobile number.";return}
 const car=$("sCar").value.trim(),yr=+$("sYear").value,km=+$("sKm").value||0,fuel=$("sFuel").value,ex=parseFloat($("sExp").value)||null;
 try{localStorage.setItem("dm_me",JSON.stringify({n,p:ph}))}catch(e){}
 if(!window.API_OK){send(`Hi Dharti Motors, I want to sell my car.\nCar: ${car} (${yr})\nKms: ${km||"n/a"}\nFuel: ${fuel}\nExpected: ${ex?"₹"+ex+" lakh":"n/a"}\nName: ${n}\nPhone: ${ph}`);return}
 const b=f.querySelector("button[type=submit]");b.disabled=true;m.textContent="Sending…";const imgs=[];
 for(const fl of [...$("sPics").files].slice(0,6)){try{imgs.push(await blobB64(await shrink(fl)))}catch(err){}}
 const token=crypto.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{const r=crypto.getRandomValues(new Uint8Array(1))[0]%16;return(c==="x"?r:(r&3|8)).toString(16)});
 const j=await api("submitSell",{name:n,phone:ph,car,year:yr,km,fuel,expected:ex,token,images:imgs});
 if(j.error){b.disabled=false;m.textContent=j.error;return}
 try{localStorage.setItem("dm_sell",JSON.stringify({t:token,car,yr}))}catch(e){}
 f.innerHTML=`<div class="ok">${OK_ICON}<h3>Request received</h3><p>We’ll check the details and contact you on ${E(ph)} with an offer.</p><p>When we make an offer, it will show at the top of this site on this phone. You can also open your tracking link on any device.</p><a class="btn btn-primary" href="sell-status.html?t=${token}">Track my request</a><button class="btn btn-navy" id="cpTrack" type="button">Copy tracking link</button></div>`;
 const cb=$("cpTrack");if(cb)cb.onclick=()=>navigator.clipboard.writeText(new URL("sell-status.html?t="+token,location.href).href).then(()=>toast("Link copied"),()=>{})};
try{const sv=JSON.parse(localStorage.getItem("dm_me")||"{}");if(sv.n)$("sName").value=sv.n;if(sv.p)$("sPhone").value=sv.p}catch(e){}
$("contactForm").onsubmit=e=>{e.preventDefault();send(`Hi Dharti Motors, I’m looking for a car.\n${$("cMsg").value}\nName: ${$("cName").value}\nPhone: ${$("cPhone").value}`)};
const hm=location.hash.match(/^#car-(\d+)$/);if(hm)location.replace("car.html?id="+hm[1]);
/* bottom tab highlight + back-button scroll restore */
if("IntersectionObserver"in window){const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting)document.querySelectorAll(".tabbar a[data-s]").forEach(a=>a.classList.toggle("on",a.dataset.s===x.target.id))}),{rootMargin:"-40% 0px -55% 0px"});["hero","cars","sell"].forEach(i=>{const el=$(i);if(el)io.observe(el)})}
addEventListener("pagehide",()=>{try{sessionStorage.setItem("dm_y",scrollY)}catch(e){}});
loadCars().then(r=>{ALL=r.list;if(r.failed){$("grid").innerHTML='<div class="no-match"><h3>Could not load the cars</h3><p>Please check your connection and refresh the page. Or message us on Instagram.</p></div>';return}const br=[...new Set(ALL.map(c=>c.brand))].sort(),o='<option value="">Any brand</option>'+br.map(b=>`<option>${E(b)}</option>`).join("");$("hBrand").innerHTML=o;$("fBrand").innerHTML=o;$("hBrand").value=F.brand;$("hBudget").value=F.budget;$("hFuel").value=F.fuel;
 if(r.live){const n=document.querySelector("#cars .note");if(n)n.hidden=true}render();
 const nv=performance.getEntriesByType("navigation")[0];if(nv&&nv.type==="back_forward"){const y=+sessionStorage.getItem("dm_y")||0;if(y)scrollTo(0,y)}});
renderChips();

(async()=>{let sv=null;try{sv=JSON.parse(localStorage.getItem("dm_sell")||"null")}catch(e){}if(!sv||!sv.t)return;const r=await sellStatus(sv.t);if(!r)return;
 if(r.status==="closed"||r.status==="listed"){try{localStorage.removeItem("dm_sell")}catch(e){}return}
 const i=sellInfo(r);$("sstat").innerHTML=`<div class="wrap"><strong>Your sell request: ${E(r.car)} (${r.year})</strong><span>${E(i.title)}. ${E(i.text)}</span><a href="sell-status.html?t=${E(sv.t)}">Details</a></div>`;$("sstat").hidden=false})();
