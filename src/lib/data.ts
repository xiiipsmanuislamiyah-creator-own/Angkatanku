// Compatibility layer for existing screens. Authorization and projection are server-side.
import {api,currentSession,getSessionRevision} from './api';
type Ref={collection:string;id?:string;constraints?:any[]};
export const collection=(_db:any,name:string):Ref=>({collection:name});
export function doc(_db:any,name:string,id:string):Ref{const u=currentSession().user;if(name==='students'&&u&&id===u.uid)return{collection:u.profileCollection,id:u.profileId};return{collection:name,id};}
export const query=(ref:Ref,...constraints:any[]):Ref=>({...ref,constraints});
export const where=(field:string,op:string,value:any)=>({kind:'where',field,op,value});
export const orderBy=(field:string,direction='asc')=>({kind:'order',field,direction});
export const limit=(value:number)=>({kind:'limit',value});
export const serverTimestamp=()=>Date.now();
export const arrayUnion=(...values:any[])=>({__arrayUnion:values});
const document=(row:any)=>({id:row?.id,exists:()=>!!row,data:()=>row});
async function read(ref:Ref){const started=getSessionRevision();let rows:any[]=[],after:string|undefined;for(let page=0;page<5;page++){const r=await api('/data/query',{collection:ref.collection,id:ref.id,after});if(started!==getSessionRevision())throw new Error('Sesi berubah.');rows.push(...r.items);after=r.next;if(!after||ref.id)break;}
 for(const c of ref.constraints||[])if(c.kind==='where')rows=rows.filter(r=>c.op==='=='?r[c.field]===c.value:c.op==='in'?c.value.includes(r[c.field]):c.op==='array-contains'?r[c.field]?.includes(c.value):false);
 for(const c of [...(ref.constraints||[])].reverse())if(c.kind==='order')rows.sort((a,b)=>{const x=a[c.field]??0,y=b[c.field]??0;return(x<y?-1:x>y?1:0)*(c.direction==='desc'?-1:1);});
 for(const c of ref.constraints||[])if(c.kind==='limit')rows=rows.slice(0,c.value);return rows;
}
export async function getDoc(ref:Ref){return document((await read(ref))[0]);}
export async function getDocs(ref:Ref){const rows=await read(ref);const docs=rows.map(document);return{docs,size:docs.length,empty:!docs.length,forEach:(fn:any)=>docs.forEach(fn)};}
export function setDoc(ref:Ref,data:any,_options?:any){return api('/data/write',{collection:ref.collection,id:ref.id,operation:'set',data});}
export function updateDoc(ref:Ref,data:any){if(data.viewedBy?.__arrayUnion)return api('/interactions',{collection:ref.collection,id:ref.id,action:'view'});return api('/data/write',{collection:ref.collection,id:ref.id,operation:'update',data});}
export function deleteDoc(ref:Ref){return api('/data/write',{collection:ref.collection,id:ref.id,operation:'delete'});}
export async function addDoc(ref:Ref,data:any){const id=crypto.randomUUID();await setDoc({...ref,id},data);return{id};}
export function onSnapshot(ref:Ref,success:(s:any)=>void,error?:(e:any)=>void){let live=true,busy=false,pending=false;
 const poll=async()=>{if(!live||documentHidden())return;if(busy){pending=true;return;}busy=true;const started=getSessionRevision();try{const r=ref.id?await getDoc(ref):await getDocs(ref);if(live&&started===getSessionRevision())success(r);}catch(e){if(live)error?.(e);}finally{busy=false;if(pending){pending=false;void poll();}}};
 const reset=()=>{success(ref.id?document(null):{docs:[],empty:true,size:0,forEach:()=>{}});void poll();};
 const interval=window.setInterval(poll,10000);window.addEventListener('angkatan:session',reset);window.document.addEventListener('visibilitychange',poll);void poll();return()=>{live=false;clearInterval(interval);window.removeEventListener('angkatan:session',reset);window.document.removeEventListener('visibilitychange',poll);};
}
function documentHidden(){return window.document.visibilityState==='hidden';}
