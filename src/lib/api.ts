export type Session={user:any;profile?:any;csrfToken:string|null};
let session:Session={user:null,profile:null,csrfToken:null};let revision=0;
const listeners=new Set<(s:Session)=>void>();
export const currentSession=()=>session;
export const getSessionRevision=()=>revision;
export function acceptSession(next:Session){const changed=session.user?.uid!==next.user?.uid||session.csrfToken!==next.csrfToken;session=next;if(changed)revision++;listeners.forEach(fn=>fn(session));if(changed)window.dispatchEvent(new Event('angkatan:session'));}
export function subscribeSession(fn:(s:Session)=>void){listeners.add(fn);return()=>{listeners.delete(fn);};}
export async function api<T=any>(path:string,body?:unknown,method=body===undefined?'GET':'POST'):Promise<T>{
 const started=revision,form=body instanceof FormData;const response=await fetch('/api'+path,{method,credentials:'same-origin',headers:{...(body===undefined||form?{}:{'Content-Type':'application/json'}),...(session.csrfToken?{'X-CSRF-Token':session.csrfToken}:{})},body:body===undefined?undefined:form?body:JSON.stringify(body)});
 const data=await response.json().catch(()=>({error:'Respons server tidak valid.'}));
 if(!response.ok){if(response.status===401&&!['/auth/login','/auth/reauth'].includes(path)&&started===revision)acceptSession({user:null,profile:null,csrfToken:null});const e:any=new Error(data.error||'Permintaan gagal.');e.code=data.code;e.status=response.status;throw e;}
 return data;
}
export async function loadSession(){const started=revision;const data=await api<Session>('/auth/session');if(started===revision)acceptSession(data);return session;}
