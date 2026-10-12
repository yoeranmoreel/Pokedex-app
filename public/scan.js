import{$,api,requireUser}from"./shared.js";
let current=null;
const user=await requireUser();
if(user){
  $("#cameraInput").onchange=async e=>{
    const file=e.target.files[0];if(!file)return;
    $("#result").classList.add("hidden");$("#correction").classList.add("hidden");$("#status").textContent="SCAN RUNNING // dier herkennen…";
    try{
      const image=await resize(file),data=await api("/identify",{method:"POST",body:JSON.stringify({image})});
      if(!data.animal?.species)throw Error("Geen soort met voldoende zekerheid herkend. Probeer een duidelijkere foto.");
      current={...data.animal};
      $("#preview").src=image;
      renderResult();
      $("#result").classList.remove("hidden");
      $("#status").textContent="SCAN COMPLETE // foto wordt niet opgeslagen";
    }catch(error){$("#status").textContent="SCAN FAILED // "+error.message}
  };

  $("#correctBtn").onclick=()=>{
    const box=$("#correction"),open=box.classList.toggle("hidden")===false;
    $("#correctBtn").textContent=open?"× Aanpassen sluiten":"✎ Herkenning aanpassen";
    if(open){$("#editSpecies").value=current?.species||"";$("#editScientific").value=current?.scientificName||"";$("#editCategory").value=current?.category||""}
  };

  $("#saveBtn").onclick=async()=>{
    if(!current)return;
    if(!$("#correction").classList.contains("hidden")){
      const species=$("#editSpecies").value.trim();if(!species){$("#status").textContent="Naam mag niet leeg zijn.";return}
      current={...current,species,scientificName:$("#editScientific").value.trim(),category:$("#editCategory").value.trim()};
      renderResult();
    }
    $("#saveBtn").disabled=true;$("#status").textContent="DATABASE // registratie opslaan…";
    try{
      const result=await api("/sightings",{method:"POST",body:JSON.stringify(current)});
      sessionStorage.setItem("anidex_last",JSON.stringify({species:current.species,encounters:result.encounters,isNew:result.isNew}));
      location.href="/dex.html";
    }catch(error){$("#status").textContent=error.message}finally{$("#saveBtn").disabled=false}
  };

  $("#retryBtn").onclick=()=>{
    current=null;$("#result").classList.add("hidden");$("#correction").classList.add("hidden");$("#cameraInput").value="";$("#status").textContent="";$("#cameraInput").click();
  };
}

function renderResult(){
  $("#animalName").textContent=current.species;
  $("#latin").textContent=current.scientificName||"Wetenschappelijke naam onbekend";
  $("#description").textContent=current.description||"";
  $("#categoryChip").textContent=(current.category||"DIER").toUpperCase();
  $("#confidenceText").textContent=current.confidence==null?"AI SCORE // —":"AI SCORE // "+Math.round(Number(current.confidence)*100)+"%";
}

function resize(file){return new Promise((resolve,reject)=>{const image=new Image(),url=URL.createObjectURL(file);image.onload=()=>{const scale=Math.min(1,1280/Math.max(image.width,image.height)),canvas=document.createElement("canvas");canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);resolve(canvas.toDataURL("image/jpeg",.78))};image.onerror=()=>{URL.revokeObjectURL(url);reject(Error("Foto kon niet worden geopend"))};image.src=url})}
