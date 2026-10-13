// Legacy import path retained; data now lives in the existing Firebase server database.
import {api} from './api';
import {collection,doc,getDocs,addDoc,updateDoc,deleteDoc} from './data';
import {db} from './firebase';
export interface MediaItem{id:string;post_id:string;type:'image'|'video';url:string;width?:number;height?:number;size?:number;order:number;created_at?:string}
export interface CommentItem{id:string;post_id:string;author:string;content:string;created_at:string;user_id?:string;is_guest?:boolean}
export interface PostItem{id:string;caption:string;pinned:boolean;hidden:boolean;created_at:string;media:MediaItem[];comments:CommentItem[];likes_count:number}
let cached:PostItem[]=[];
window.addEventListener('angkatan:session',()=>{cached=[];});
export const databaseService={
 async fetchPosts(includeHidden=false):Promise<PostItem[]>{const snap=await getDocs(collection(db,'posts'));cached=snap.docs.map(d=>({caption:'',media:[],comments:[],likes_count:0,...d.data(),id:d.id})).filter(p=>includeHidden||!p.hidden).sort((a,b)=>Number(b.pinned)-Number(a.pinned)||Date.parse(b.created_at)-Date.parse(a.created_at));return cached;},
 async addPost(caption:string,media:Omit<MediaItem,'id'|'post_id'>[],audience='members'):Promise<PostItem>{const ref=await addDoc(collection(db,'posts'),{caption,media,audience,pinned:false,hidden:false});return{id:ref.id,caption,media:media as MediaItem[],audience,pinned:false,hidden:false,created_at:new Date().toISOString(),comments:[],likes_count:0} as PostItem;},
 async addComment(id:string,_author:string,content:string,_uid?:string,_guest?:boolean):Promise<CommentItem>{const r=await api('/interactions',{collection:'posts',id,action:'comment',content});return r.comment;},
 async toggleLike(id:string):Promise<number>{return(await api('/interactions',{collection:'posts',id,action:'like'})).likes_count;},
 async updatePost(id:string,updates:any){await updateDoc(doc(db,'posts',id),updates);},
 async deletePost(id:string){await deleteDoc(doc(db,'posts',id));},
 getAllComments(){return cached.flatMap(p=>p.comments.map(comment=>({comment,postCaption:p.caption,postId:p.id})));},
 async deleteComment(commentId:string){const post=cached.find(p=>p.comments.some(c=>c.id===commentId));if(!post)throw new Error('Komentar perlu dimuat ulang.');await api('/interactions',{collection:'posts',id:post.id,action:'deleteComment',commentId});}
};
