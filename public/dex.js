import{$,api,esc,requireUser}from"./shared.js";
let items=[];
if(await requireUser())load();

async function load(){
  try{
    items=(await api("/sightings")).sightings||[];
    $("#speciesCount").textContent=items.length;
    const categories=[...new Set(items.map(x=>(x.category||"Overig").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"nl"));
    $("#categoryFilter").innerHTML='<option value="">Alle groepen</option>'+categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");
    const last=sessionStorage.getItem("anidex_last");
    if(last){sessionStorage.removeItem("anidex_last");const d=JSON.parse(last);$("#notice").textContent=d.isNew?"★ NIEUWE SOORT GEREGISTREERD // "+d.species.toUpperCase():"ENCOUNTER BIJGEWERKT // "+d.species.toUpperCase()+" // "+d.encounters+"×";$("#notice").classList.remove("hidden")}
    render();
  }catch(e){$("#grid").innerHTML=`<p class="empty">${esc(e.message)}</p>`}
}

function render(){
  const q=$("#searchInput").value.trim().toLowerCase(),cat=$("#categoryFilter").value,sort=$("#sortSelect").value;
  let rows=items.filter(a=>(!q||[a.species,a.scientific_name,a.category].some(v=>String(v||"").toLowerCase().includes(q)))&&(!cat||(a.category||"Overig")===cat));
  if(sort==="name")rows.sort((a,b)=>a.species.localeCompare(b.species,"nl"));
  else if(sort==="encounters")rows.sort((a,b)=>(Number(b.encounters)||1)-(Number(a.encounters)||1)||a.species.localeCompare(b.species,"nl"));
  else rows.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)||Number(b.id)-Number(a.id));
  $("#resultCount").textContent=`DATABASE // ${rows.length} VAN ${items.length} SOORTEN`;
  $("#grid").innerHTML=rows.length?rows.map(a=>{const n=items.indexOf(a)+1;return `<button class="card" data-id="${a.id}"><div class="species-photo" data-name="${esc(a.scientific_name||a.species)}"><span>?</span><em>#${String(n).padStart(3,"0")}</em></div><div><b>${esc(a.species)}</b><small>${esc(a.category||"Dier")} · ${Number(a.encounters)||1}× gezien</small></div></button>`}).join(""):'<p class="empty">Geen soorten gevonden voor dit filter.</p>';
  document.querySelectorAll(".card").forEach(button=>button.onclick=()=>detail(items.find(x=>String(x.id)===button.dataset.id)));
  document.querySelectorAll(".species-photo").forEach(el=>photo(el,el.dataset.name));
}

$("#refreshBtn").onclick=load;
$("#searchInput").oninput=render;
$("#categoryFilter").onchange=render;
$("#sortSelect").onchange=render;

async function photo(el,name){
  try{const d=await api("/species-image?name="+encodeURIComponent(name));if(d.url){const number=el.querySelector("em")?.cloneNode(true),img=document.createElement("img");img.src=d.url;img.alt=name;img.loading="lazy";img.referrerPolicy="no-referrer";img.onerror=()=>img.remove();el.replaceChildren(img);if(number)el.append(number)}}catch{}
}

function detail(a){
  if(!a)return;
  $("#detailPhoto").replaceChildren(document.createTextNode("?"));
  photo($("#detailPhoto"),a.scientific_name||a.species);
  const number=items.indexOf(a)+1;
  $("#detailNo").textContent="ANIDEX #"+String(number).padStart(3,"0");
  $("#detailCat").textContent=(a.category||"DIER").toUpperCase();
  $("#detailName").textContent=a.species;
  $("#detailLatin").textContent=a.scientific_name||"Wetenschappelijke naam onbekend";
  $("#detailDesc").textContent=a.description||"Nog geen beschrijving beschikbaar.";
  $("#detailEncounters").textContent="ENCOUNTERS // "+(Number(a.encounters)||1);
  $("#detailConfidence").textContent=a.confidence==null?"AI SCORE // —":"AI SCORE // "+Math.round(Number(a.confidence)*100)+"%";
  $("#detailMeta").textContent="Eerste registratie: "+new Date(a.created_at+"Z").toLocaleDateString("nl-NL");
  $("#detail").showModal();
}
$(".close").onclick=()=>$("#detail").close();
