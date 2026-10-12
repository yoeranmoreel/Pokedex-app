import{$,api,me,esc}from"./shared.js";
async function render(){
  const user=await me();
  $("#guest").classList.toggle("hidden",!!user);$("#profile").classList.toggle("hidden",!user);
  if(user){
    $("#profileName").textContent=user.displayName;$("#profileEmail").textContent=user.email;
    $("#memberSince").textContent=user.createdAt?"Lid sinds "+new Date(user.createdAt+"Z").toLocaleDateString("nl-NL",{month:"long",year:"numeric"}):"";
    try{const s=await api("/stats");$("#profileSpecies").textContent=s.speciesCount;$("#profileEncounters").textContent=s.encounterCount;$("#profileGroups").textContent=(s.categories||[]).length;$("#profileGroupsList").innerHTML=(s.categories||[]).map(c=>`<span class="data-chip">${esc(c.category)} // ${c.speciesCount}</span>`).join("")||'<span class="screen-note">Nog geen diergroepen geregistreerd.</span>'}catch(e){$("#profileGroupsList").textContent=e.message}
  }
}
render();
document.querySelectorAll("[data-tab]").forEach(button=>button.onclick=()=>{const register=button.dataset.tab==="register";$("#loginForm").classList.toggle("hidden",register);$("#registerForm").classList.toggle("hidden",!register);document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===button))});
for(const [id,path]of[["loginForm","/auth/login"],["registerForm","/auth/register"]])$("#"+id).onsubmit=async event=>{event.preventDefault();$("#authStatus").textContent="AUTH // even wachten…";const data=Object.fromEntries(new FormData(event.currentTarget));try{await api(path,{method:"POST",body:JSON.stringify(data)});const next=new URLSearchParams(location.search).get("next");if(next&&next.startsWith("/"))location.href=next;else await render();$("#authStatus").textContent=""}catch(error){$("#authStatus").textContent="AUTH FAILED // "+error.message}};
$("#logoutBtn").onclick=async()=>{await api("/auth/logout",{method:"POST",body:"{}"});await render()};
