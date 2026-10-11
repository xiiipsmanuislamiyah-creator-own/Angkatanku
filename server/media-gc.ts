import {requireThat,audit,randomToken} from './security';
import type {Store,RecordData} from './store';
import type {MediaProvider} from './media';
export const canCollect=(a:RecordData,now=Date.now())=>!a.deleted&&!(a.parents||[]).length&&(a.pendingDelete||a.deleting||a.createdAt<now-86400000);
export async function collectMedia(store:Store,provider:MediaProvider,id:string){const key='security_media/'+id;const asset=await store.atomic([key],([a])=>{requireThat(a&&canCollect(a)&&/^angkatanku-v2\/[A-Za-z0-9_-]+$/.test(a.publicId),409,'MEDIA_NOT_COLLECTIBLE');return{value:a,writes:{[key]:{...a,deleting:true}}};});await provider.destroy(asset);await store.atomic([key],([a])=>{requireThat(a?.deleting&&!(a.parents||[]).length,409,'MEDIA_STATE_CHANGED');return{value:null,writes:{[key]:{...a,deleted:true,deleting:false,deletedAt:Date.now()},['security_audit/'+randomToken()]:audit('server-gc','media.delete',id)}};});}
