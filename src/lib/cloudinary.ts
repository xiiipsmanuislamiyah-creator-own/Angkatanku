import {api} from './api';
export async function uploadToCloudinary(file:File,_resourceType:'image'|'video'|'auto'='auto'):Promise<string>{const body=new FormData();body.append('file',file);const result=await api('/media',body);return result.url;}
export async function deleteFromCloudinary(url:string):Promise<boolean>{const match=url.match(/^\/api\/media\/([\w-]+)$/);if(!match)return false;await api('/cloudinary-delete',{id:match[1]});return true;}
