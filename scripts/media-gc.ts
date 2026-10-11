import 'dotenv/config';
import {firebaseStore} from '../server/store';
import {cloudinaryProvider} from '../server/media';
import {canCollect,collectMedia} from '../server/media-gc';
const args=Object.fromEntries(process.argv.slice(2).map(x=>{const i=x.indexOf('=');return i<0?[x.replace(/^--/,''),'true']:[x.slice(0,i).replace(/^--/,''),x.slice(i+1)];}));
async function run(){if(!args.project||args.project!==process.env.FIREBASE_PROJECT_ID||args.database!==(process.env.FIREBASE_DATABASE_ID||'(default)'))throw new Error('Target mismatch');if(args.apply&&!process.env.MIGRATION_CHANGE_ID)throw new Error('Change ID missing');const store=firebaseStore(),provider=cloudinaryProvider();let after:string|undefined,candidates=0,deleted=0;do{const rows=await store.list('security_media',[],after,100);for(const r of rows)if(canCollect(r.data)&&r.data.publicId?.startsWith('angkatanku-v2/')){candidates++;if(args.apply==='true'){await collectMedia(store,provider,r.id);deleted++;}}after=rows.length===100?rows.at(-1)!.id:undefined;}while(after);console.log(JSON.stringify({dryRun:args.apply!=='true',candidates,deleted}));}
run().catch(()=>{console.error('GC dihentikan; periksa konfigurasi atau status media.');process.exitCode=1;});
