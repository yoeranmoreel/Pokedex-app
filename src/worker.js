const J=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json;charset=UTF-8","cache-control":"no-store",...headers}});
const enc=new TextEncoder();
const hex=buffer=>[...new Uint8Array(buffer)].map(x=>x.toString(16).padStart(2,"0")).join("");
async function sha(value){return hex(await crypto.subtle.digest("SHA-256",enc.encode(value)))}
async function passwordHash(password,salt){const key=await crypto.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveBits"]);return hex(await crypto.subtle.deriveBits({name:"PBKDF2",salt:enc.encode(salt),iterations:210000,hash:"SHA-256"},key,256))}
function cookie(req,name){return req.headers.get("cookie")?.split(";").map(x=>x.trim()).find(x=>x.startsWith(name+"="))?.slice(name.length+1)||null}
async function currentUser(req,env){const token=cookie(req,"anidex_session");if(!token)return null;return env.DB.prepare("SELECT u.id,u.email,u.display_name,u.created_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>datetime('now')").bind(await sha(token)).first()}
async function createSession(userId,env){const token=crypto.randomUUID()+crypto.randomUUID(),expiresAt=new Date(Date.now()+30*864e5).toISOString();await env.DB.prepare("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").bind(await sha(token),userId,expiresAt).run();return `anidex_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`}
function safeText(value,max){return String(value||"").trim().slice(0,max)}
async function staticAsset(url){const path=url.pathname==="/"?"/index.html":url.pathname;if(path.includes("..")||path.includes("\\"))return new Response("Not found",{status:404});const raw="https://raw.githubusercontent.com/yoeranmoreel/Pokedex-app/main/public"+path;const response=await fetch(raw,{cf:{cacheEverything:true,cacheTtl:60}});if(!response.ok)return new Response("Not found",{status:404});const headers=new Headers(response.headers);headers.set("cache-control","public,max-age=60");headers.delete("set-cookie");return new Response(response.body,{status:response.status,headers})}

export default{async fetch(req,env){
  const url=new URL(req.url);
  if(!url.pathname.startsWith("/api/")&&!url.pathname.startsWith("/media/"))return env.ASSETS?env.ASSETS.fetch(req):staticAsset(url);
  try{
    if(req.method!=="GET"&&req.method!=="HEAD"){const origin=req.headers.get("origin");if(origin&&origin!==url.origin)return J({error:"Ongeldige herkomst"},403)}

    if(url.pathname==="/api/health")return J({ok:true,app:"AniDex",version:"2.2.0"});

    if(url.pathname==="/api/auth/register"&&req.method==="POST"){
      const body=await req.json(),email=safeText(body.email,160).toLowerCase(),name=safeText(body.displayName,40),password=String(body.password||"");
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||name.length<2||password.length<8)return J({error:"Controleer naam, e-mail en wachtwoord (minimaal 8 tekens)."},400);
      if(await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first())return J({error:"Er bestaat al een account met dit e-mailadres."},409);
      const id=crypto.randomUUID(),salt=crypto.randomUUID();
      await env.DB.prepare("INSERT INTO users(id,email,display_name,password_hash,password_salt) VALUES(?,?,?,?,?)").bind(id,email,name,await passwordHash(password,salt),salt).run();
      return J({ok:true,user:{id,email,displayName:name}},201,{"set-cookie":await createSession(id,env)});
    }

    if(url.pathname==="/api/auth/login"&&req.method==="POST"){
      const body=await req.json(),email=safeText(body.email,160).toLowerCase(),row=await env.DB.prepare("SELECT * FROM users WHERE email=?").bind(email).first();
      if(!row||await passwordHash(String(body.password||""),row.password_salt)!==row.password_hash)return J({error:"E-mailadres of wachtwoord klopt niet."},401);
      await env.DB.prepare("DELETE FROM sessions WHERE expires_at<=datetime('now')").run();
      return J({ok:true,user:{id:row.id,email:row.email,displayName:row.display_name}},200,{"set-cookie":await createSession(row.id,env)});
    }

    if(url.pathname==="/api/auth/logout"&&req.method==="POST"){
      const token=cookie(req,"anidex_session");if(token)await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await sha(token)).run();
      return J({ok:true},200,{"set-cookie":"anidex_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"});
    }

    if(url.pathname==="/api/auth/me"){
      const me=await currentUser(req,env);return me?J({user:{id:me.id,email:me.email,displayName:me.display_name,createdAt:me.created_at}}):J({error:"Niet ingelogd"},401);
    }

    if(url.pathname==="/api/stats"&&req.method==="GET"){
      const me=await currentUser(req,env);if(!me)return J({error:"Niet ingelogd"},401);
      const summary=await env.DB.prepare("SELECT COUNT(*) speciesCount,COALESCE(SUM(encounters),0) encounterCount,MAX(created_at) lastDiscovery FROM sightings WHERE user_id=?").bind(me.id).first();
      const {results:recent}=await env.DB.prepare("SELECT id,species,scientific_name,category,created_at,encounters FROM sightings WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 3").bind(me.id).all();
      const {results:categories}=await env.DB.prepare("SELECT COALESCE(NULLIF(TRIM(category),''),'Overig') category,COUNT(*) speciesCount FROM sightings WHERE user_id=? GROUP BY COALESCE(NULLIF(TRIM(category),''),'Overig') ORDER BY speciesCount DESC,category ASC").bind(me.id).all();
      return J({speciesCount:Number(summary?.speciesCount)||0,encounterCount:Number(summary?.encounterCount)||0,lastDiscovery:summary?.lastDiscovery||null,recent,categories});
    }

    if(url.pathname==="/api/species-image"&&req.method==="GET"){
      const name=safeText(url.searchParams.get("name"),120);if(!name)return J({url:null});
      try{const api="https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&pithumbsize=500&titles="+encodeURIComponent(name);const response=await fetch(api,{headers:{"user-agent":"AniDex/2.2 (animal encyclopedia)"}});if(!response.ok)return J({url:null});const data=await response.json(),page=Object.values(data.query?.pages||{})[0];return J({url:page?.thumbnail?.source||null})}catch{return J({url:null})}
    }

    if(url.pathname==="/api/sightings"&&req.method==="GET"){
      const me=await currentUser(req,env);if(!me)return J({error:"Niet ingelogd"},401);
      const {results}=await env.DB.prepare("SELECT id,species,scientific_name,category,description,confidence,created_at,encounters FROM sightings WHERE user_id=? ORDER BY created_at DESC,id DESC").bind(me.id).all();
      return J({sightings:results});
    }

    if(url.pathname==="/api/sightings"&&req.method==="POST"){
      const me=await currentUser(req,env);if(!me)return J({error:"Niet ingelogd"},401);
      const body=await req.json(),species=safeText(body.species,120),scientific=safeText(body.scientificName,120),category=safeText(body.category,80),description=safeText(body.description,600),confidence=typeof body.confidence==="number"?Math.max(0,Math.min(1,body.confidence)):null;
      if(!species)return J({error:"Onvolledige waarneming"},400);
      const key=(scientific||species).toLowerCase();
      const existing=await env.DB.prepare("SELECT id,encounters FROM sightings WHERE user_id=? AND lower(coalesce(nullif(trim(scientific_name), ''), trim(species)))=?").bind(me.id,key).first();
      if(existing){await env.DB.prepare("UPDATE sightings SET encounters=encounters+1,description=COALESCE(NULLIF(?,''),description),category=COALESCE(NULLIF(?,''),category),confidence=COALESCE(?,confidence) WHERE id=? AND user_id=?").bind(description,category,confidence,existing.id,me.id).run();return J({ok:true,isNew:false,encounters:Number(existing.encounters)+1})}
      try{const result=await env.DB.prepare("INSERT INTO sightings(user_id,species,scientific_name,category,description,confidence,encounters) VALUES(?,?,?,?,?,?,1)").bind(me.id,species,scientific||null,category||null,description||null,confidence).run();return J({ok:true,isNew:true,id:result.meta.last_row_id,encounters:1},201)}catch(error){const row=await env.DB.prepare("SELECT id,encounters FROM sightings WHERE user_id=? AND lower(coalesce(nullif(trim(scientific_name), ''), trim(species)))=?").bind(me.id,key).first();if(!row)throw error;await env.DB.prepare("UPDATE sightings SET encounters=encounters+1 WHERE id=? AND user_id=?").bind(row.id,me.id).run();return J({ok:true,isNew:false,encounters:Number(row.encounters)+1})}
    }

    if(url.pathname==="/api/identify"&&req.method==="POST"){
      if(!await currentUser(req,env))return J({error:"Log eerst in om te scannen."},401);
      if(!env.OPENAI_API_KEY)return J({error:"AI-herkenning is nog niet geconfigureerd."},503);
      const {image}=await req.json();
      if(!image||typeof image!=="string"||!/^data:image\/(jpeg|png|webp);base64,/.test(image)||image.length>6000000)return J({error:"Ongeldige of te grote foto"},400);
      const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{authorization:"Bearer "+env.OPENAI_API_KEY,"content-type":"application/json"},body:JSON.stringify({model:"gpt-5-mini",input:[{role:"user",content:[{type:"input_text",text:"Identify the animal in the image. Return ONLY valid JSON with: species (Dutch common name or null), scientificName (Latin binomial if known), category (short Dutch group such as Vogel, Zoogdier, Insect, Reptiel, Amfibie, Vis, Spinachtige or Overig), description (two short factual Dutch sentences suitable for a child-friendly nature encyclopedia), confidence (number 0-1). Be conservative: if the species cannot be identified reliably, set species to null. Do not invent details."},{type:"input_image",image_url:image}]}]})});
      if(!response.ok)return J({error:"AI-herkenning mislukt"},502);
      const data=await response.json(),text=data.output?.flatMap(o=>o.content||[]).find(c=>c.type==="output_text")?.text||"";
      try{const animal=JSON.parse(text.replace(/^```json\s*|\s*```$/g,""));if(animal.confidence!=null)animal.confidence=Math.max(0,Math.min(1,Number(animal.confidence)||0));return J({animal})}catch{return J({error:"Herkenningsservice gaf geen bruikbaar antwoord"},502)}
    }

    return J({error:"Niet gevonden"},404);
  }catch(error){console.error(error);return J({error:"Serverfout"},500)}
}};
