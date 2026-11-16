(async()=>{
const id=new URLSearchParams(location.search).get("id"),{list}=await loadCars(),c=list.find(x=>String(x.id)===String(id)),root=$("cwrap");
if(!c){root.innerHTML='<div class="no-match" style="grid-column:1/-1"><h3>This car is no longer available</h3><p>It may have been sold. <a href="index.html#cars" style="color:var(--gold-ink);font-weight:700">Browse other cars</a></p></div>';$("more").hidden=true;$("simWrap").hidden=true;return}
document.title=c.name+" | Dharti Motors";window.AI_CAR_ID=c.id;$("crumb").textContent=c.name;
const sv=$("cSave");sv.dataset.save=c.id;sv.classList.toggle("on",isSaved(c.id));$("cShare").href=waLink(c);
const im=imgsOf(c),est=`Est. EMI ₹${emiEst(c.price).toLocaleString("en-IN")}/mo`;
root.innerHTML=`<div><div class="galw"><div class="gal" id="gal">${(im.length?im:[null]).map((s,i)=>`<div class="slide">${s?`<img src="${E(s)}" alt="${E(c.name)} photo ${i+1}"${i?' loading="lazy"':""}>`:CAR_SVG}</div>`).join("")}</div>${im.length>1?`<span class="gct" id="gct">1 / ${im.length}</span>`:""}</div>${im.length>1?`<div class="thumbs" id="th" style="padding:10px 0 0">${im.map((s,k)=>`<button type="button" data-i="${k}" class="${k?"":"on"}" aria-label="Photo ${k+1}"><img src="${E(s)}" alt=""></button>`).join("")}</div>`:""}</div>
<div><span class="ticket-tag">${E(c.seller||c.owner)}</span><h1 class="ctitle">${E(c.name)}</h1><p>${E(c.brand)} · ${c.year} · ${E(c.owner)}</p>
<div class="price" style="margin:12px 0 16px;font-size:32px">${fmtP(c.price)}<small>${est}</small></div>
<div class="specs" style="padding:0">${[["Year",c.year],["Driven",fmtKm(c.km)],["Fuel",c.fuel],["Gear",c.trans],["Type",c.body],["Owner",c.owner]].map(x=>`<div><span>${x[0]}</span><strong>${E(x[1])}</strong></div>`).join("")}</div>
${c.description?`<div class="dbox"><h4 class="mh">About this car</h4><p style="white-space:pre-wrap">${E(c.description)}</p></div>`:""}
<div class="tags">${(c.tags||[]).map(t=>`<span>${E(t)}</span>`).join("")}</div>
${c.seller?`<div class="dbox"><p>Sold by <strong>${E(c.seller)}</strong>${c.firm&&c.seller!=="Dharti Motors"?" · "+E(c.firm):""}</p></div>`:""}
<button class="btn btn-primary" data-book="${c.id}" type="button" style="width:100%">Book a test drive</button>
<div class="row2"><a class="btn btn-wa" href="${waLink(c)}" target="_blank" rel="noopener">${WA_ICON}Share on WhatsApp</a><button class="btn btn-navy" id="sh" type="button">Copy link</button></div></div>`;
const g=$("gal");if(im.length>1){g.onscroll=()=>{const i=Math.round(g.scrollLeft/g.clientWidth);$("gct").textContent=`${i+1} / ${im.length}`;document.querySelectorAll("#th button").forEach((b,k)=>b.classList.toggle("on",k===i))};$("th").onclick=e=>{const b=e.target.closest("[data-i]");if(b)g.scrollTo({left:b.dataset.i*g.clientWidth,behavior:"smooth"})}}
$("sh").onclick=()=>{navigator.clipboard.writeText(location.href).then(()=>toast("Link copied"),()=>toast(location.href))};
const sb=$("sbar");sb.innerHTML=`<div class="price">${fmtP(c.price)}<small>${est}</small></div><button class="btn btn-primary" data-book="${c.id}" type="button">Book test drive</button>`;sb.hidden=false;
$("insp").innerHTML=inspHtml(c);
function emi(){const P=c.price*1e5*(1-(+$("eDp").value||0)/100),r=(+$("eRate").value||0)/1200,n=Math.max(1,+$("eYrs").value||1)*12,m=r?P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):P/n,f=x=>"₹"+Math.round(x).toLocaleString("en-IN");$("eOut").innerHTML=`<span>Monthly EMI</span><strong>${f(m)}</strong><small>for ${n} months, loan ${f(P)}</small>`}
["eDp","eRate","eYrs"].forEach(i=>$(i).oninput=emi);emi();
const sim=list.filter(x=>String(x.id)!==String(id)).sort((a,b)=>((b.body===c.body)-(a.body===c.body))||((b.brand===c.brand)-(a.brand===c.brand))).slice(0,8);
if(sim.length)$("sim").innerHTML=sim.map(cardHtml).join("");else $("simWrap").hidden=true;
})();
