(()=>{
if(!window.AI_ENABLED||!window.API_OK)return;
const KEY="dm_chat",SPARK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z"/></svg>';let hist=[],busy=false;
try{hist=JSON.parse(sessionStorage.getItem(KEY)||"[]")}catch(e){}
const root=document.createElement("div");
root.innerHTML=`<button class="ai-fab" id="aiFab" type="button" aria-label="Ask our AI assistant">${SPARK}<span>Ask AI</span></button>
<div class="ai-panel" id="aiPanel" hidden role="dialog" aria-label="AI assistant"><div class="ai-h"><strong>${SPARK}Dharti Motors AI</strong><button class="close" id="aiX" type="button" aria-label="Close">✕</button></div><div class="ai-m" id="aiM" aria-live="polite"></div><div class="ai-chips" id="aiC"></div><form class="ai-f" id="aiF"><input id="aiQ" maxlength="300" placeholder="Ask in English, हिंदी or ગુજરાતી" autocomplete="off" aria-label="Your question"><button class="btn btn-primary" type="submit">Send</button></form><p class="ai-n">AI can make mistakes. Please confirm details with our team. Please do not type phone numbers or personal details here.</p></div>`;
document.body.appendChild(root);
const M=$("aiM"),P=$("aiPanel"),CH=["Family car under ₹8 lakh","How do I sell my car?","૮ લાખ સુધીની ફેમિલી કાર બતાવો","6 लाख तक की कार दिखाओ"];
function bubble(role,text,ids,hand){const d=document.createElement("div");d.className="ai-b "+role;d.textContent=text;M.appendChild(d);
 if(ids&&ids.length){const w=document.createElement("div");w.className="ai-cars";w.innerHTML=ids.map(id=>{const c=CAR_MAP[id];if(!c)return"";const im=imgsOf(c)[0];return `<a class="aic" href="car.html?id=${c.id}"><span class="aim">${im?`<img src="${E(im)}" alt="" loading="lazy">`:CAR_SVG}</span><span><b>${E(c.name)}</b><small>${fmtP(c.price)} · ${fmtKm(c.km)} · ${E(c.fuel)}</small></span></a>`}).join("");if(w.innerHTML)M.appendChild(w)}
 if(hand){const a=document.createElement("a");a.className="btn btn-navy";a.style.alignSelf="flex-start";a.href="https://ig.me/m/"+IG;a.target="_blank";a.rel="noopener";a.textContent="Message us on Instagram";M.appendChild(a)}
 M.scrollTop=M.scrollHeight}
function chips(){$("aiC").innerHTML=hist.length?"":CH.map(c=>`<button class="chip" type="button">${E(c)}</button>`).join("")}
function draw(){M.innerHTML="";bubble("assistant","Hi! I can help you find a car, answer questions, or explain how to sell your car. Ask in English, हिंदी or ગુજરાતી.");hist.forEach(m=>bubble(m.role,m.text,m.ids,m.hand));chips()}
function open(o){P.hidden=!o;$("aiFab").hidden=o;document.body.classList.toggle("lockb",o&&matchMedia("(max-width:720px)").matches);if(o){draw();$("aiQ").focus()}}
async function ask(q){q=q.trim();if(!q||busy)return;busy=true;bubble("user",q);hist.push({role:"user",text:q});$("aiC").innerHTML="";$("aiQ").value="";
 const th=document.createElement("div");th.className="ai-b assistant ai-typing";th.textContent="Thinking…";M.appendChild(th);M.scrollTop=M.scrollHeight;
 const r=await aiCall("assistant",{messages:hist.slice(-8).map(m=>({role:m.role,text:m.text})),car_id:window.AI_CAR_ID||null});th.remove();busy=false;
 if(r.error){hist.pop();bubble("assistant",r.error);return}
 hist.push({role:"assistant",text:r.reply,ids:r.car_ids||[],hand:!!r.handoff});bubble("assistant",r.reply,r.car_ids,r.handoff);
 try{sessionStorage.setItem(KEY,JSON.stringify(hist.slice(-20)))}catch(e){}}
$("aiFab").onclick=()=>open(true);$("aiX").onclick=()=>open(false);
$("aiF").onsubmit=e=>{e.preventDefault();ask($("aiQ").value)};
$("aiC").onclick=e=>{const b=e.target.closest(".chip");if(b)ask(b.textContent)};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!P.hidden)open(false)});
})();
