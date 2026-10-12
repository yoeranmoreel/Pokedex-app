import{$,api,me,esc}from"./shared.js";
const user=await me();
if(!user){$("#welcomeName").textContent="VERKENNER";$("#homeState").textContent="ACCOUNT NODIG VOOR SCANS";$("#guestHint").classList.remove("hidden");}
else{
  $("#welcomeName").textContent=user.displayName.toUpperCase();
  $("#homeState").textContent="FIELD SYSTEM // READY";
  try{
    const s=await api("/stats");
    $("#homeSpecies").textContent=s.speciesCount;
    $("#homeEncounters").textContent=s.encounterCount;
    $("#homeLast").textContent=s.lastDiscovery?new Date(s.lastDiscovery+"Z").toLocaleDateString("nl-NL",{day:"2-digit",month:"2-digit"}):"—";
    $("#recent").innerHTML=s.recent?.length?s.recent.map((a,i)=>`<a class="recent-row" href="/dex.html"><span class="dex-no">#${String(i+1).padStart(3,"0")}</span><span><b>${esc(a.species)}</b><small>${esc(a.category||"Dier")} · ${Number(a.encounters)||1}× gezien</small></span><span>›</span></a>`).join(""):'<p class="empty compact">Nog geen soorten geregistreerd.</p>';
  }catch(e){$("#recent").innerHTML=`<p class="empty compact">${esc(e.message)}</p>`}
}
