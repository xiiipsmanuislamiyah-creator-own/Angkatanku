import {getApps,initializeApp,applicationDefault} from 'firebase-admin/app';
import {getFirestore,FieldPath} from 'firebase-admin/firestore';
export type RecordData=Record<string,any>;
export type Row={id:string;data:RecordData};
export interface Store {
 get(key:string):Promise<RecordData|null>;
 list(collection:string,filters?:[string,any][],after?:string,count?:number):Promise<Row[]>;
 atomic<T>(keys:string[],fn:(values:(RecordData|null)[])=>{value:T;writes?:Record<string,RecordData|null>}):Promise<T>;
}
export function firebaseStore():Store {
 const projectId=process.env.FIREBASE_PROJECT_ID||process.env.GCLOUD_PROJECT;
 if(!projectId)throw new Error('FIREBASE_PROJECT_ID required');
 if(process.env.FIREBASE_PROJECT_ID&&process.env.GCLOUD_PROJECT&&process.env.FIREBASE_PROJECT_ID!==process.env.GCLOUD_PROJECT)throw new Error('Conflicting project configuration');
 if(process.env.FIRESTORE_EMULATOR_HOST&&!projectId.startsWith('demo-'))throw new Error('Emulator requires demo project');
 const app=getApps()[0]||initializeApp({projectId,...(process.env.FIRESTORE_EMULATOR_HOST?{}:{credential:applicationDefault()})});
 if(app.options.projectId!==projectId)throw new Error('Firebase project mismatch');
 const db=getFirestore(app,process.env.FIREBASE_DATABASE_ID||'(default)');
 return {
  async get(key){const d=await db.doc(key).get();return d.exists?d.data()!:null;},
  async list(c,filters=[],after,count=100){let q:FirebaseFirestore.Query=db.collection(c);for(const [k,v]of filters)q=q.where(k,'==',v);q=q.orderBy(FieldPath.documentId()).limit(Math.min(count,500));if(after)q=q.startAfter(after);return(await q.get()).docs.map(d=>({id:d.id,data:d.data()}));},
  async atomic(keys,fn){return db.runTransaction(async tx=>{const docs=await tx.getAll(...keys.map(k=>db.doc(k)));const result=fn(docs.map(d=>d.exists?d.data()!:null));for(const [k,v]of Object.entries(result.writes||{}))v===null?tx.delete(db.doc(k)):tx.set(db.doc(k),v);return result.value;});}
 };
}
