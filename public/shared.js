export const $=selector=>document.querySelector(selector);

export async function api(path,options={}){
  const response=await fetch("/api"+path,{...options,headers:{"content-type":"application/json",...(options.headers||{})}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(data.error||"Er ging iets mis");
  return data;
}

export const esc=value=>{const div=document.createElement("div");div.textContent=value||"";return div.innerHTML};

export async function me(){try{return (await api("/auth/me")).user}catch{return null}}

export async function requireUser(){const user=await me();if(!user){location.href="/account.html?next="+encodeURIComponent(location.pathname);return null}return user}

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));
