import{$,api,requireUser,esc}from"./shared.js";
if(await requireUser()){
  try{
    const s=await api("/stats"),species=Number(s.speciesCount)||0,encounters=Number(s.encounterCount)||0,groups=(s.categories||[]).length;
    $("#badgeSpecies").textContent=species;$("#badgeEncounters").textContent=encounters;$("#badgeGroups").textContent=groups;
    const defs=[
      ["🌱","Eerste vondst","Registreer je eerste soort",species,1],
      ["🐾","Natuurspeurder","Ontdek 5 verschillende soorten",species,5],
      ["🔭","Ontdekker","Ontdek 10 verschillende soorten",species,10],
      ["🏆","Dexmeester","Ontdek 25 verschillende soorten",species,25],
      ["👣","Spoorzoeker","Bereik 10 encounters",encounters,10],
      ["🧭","Veldveteraan","Bereik 50 encounters",encounters,50],
      ["🗂️","Brede blik","Ontdek dieren uit 3 groepen",groups,3],
      ["🧬","Taxonoom","Ontdek dieren uit 6 groepen",groups,6]
    ];
    let earned=0;
    $("#badges").innerHTML=defs.map(([icon,name,desc,value,target])=>{const done=value>=target;if(done)earned++;const pct=Math.min(100,Math.round(value/target*100));return `<article class="badge ${done?"earned":""}"><strong>${icon}</strong><b>${esc(name)}</b><span>${esc(desc)}</span><div class="progress"><i style="width:${pct}%"></i></div><small>${done?"BEHAALD":Math.min(value,target)+" / "+target}</small></article>`}).join("");
    $("#badgeCount").textContent=earned+" / "+defs.length;
  }catch(e){$("#badges").innerHTML=`<p class="empty">${esc(e.message)}</p>`}
}
