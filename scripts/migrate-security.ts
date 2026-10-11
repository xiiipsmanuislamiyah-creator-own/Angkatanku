import 'dotenv/config';
import {readFileSync,writeFileSync} from 'node:fs';
import {firebaseStore} from '../server/store';
import {prepareMigration,applyMigration,encryptBackup,decryptBackup} from '../server/migration';
const args=Object.fromEntries(process.argv.slice(2).map(x=>{const i=x.indexOf('=');return i<0?[x.replace(/^--/,''),'true']:[x.slice(0,i).replace(/^--/,''),x.slice(i+1)];}));
async function run(){
 if(!args.project||args.project!==process.env.FIREBASE_PROJECT_ID||!args.database||args.database!==(process.env.FIREBASE_DATABASE_ID||'(default)'))throw new Error('Target mismatch');
 const store=firebaseStore();if(args.rollback){if(!args.key||!process.env.MIGRATION_CHANGE_ID)throw new Error('Rollback configuration missing');const plan=decryptBackup(readFileSync(args.rollback),readFileSync(args.key));if(plan.projectId!==args.project||plan.databaseId!==args.database)throw new Error('Backup target mismatch');if(args.apply==='true'){await applyMigration(store,plan,true);console.log('Rollback selesai; audit tersimpan.');}else console.log('Dry-run rollback: target tervalidasi, 0 writes.');return;}
 const manifest=JSON.parse(readFileSync(args.manifest,'utf8'));if(manifest.projectId!==args.project||manifest.databaseId!==args.database||!Array.isArray(manifest.accounts)||!Array.isArray(manifest.issues)||manifest.issues.length)throw new Error('Manifest invalid');
 if(args.apply!=='true'){let existing=0;for(const a of manifest.accounts)if(await store.get('security_accounts/'+a.uid))existing++;console.log(JSON.stringify({dryRun:true,accounts:manifest.accounts.length,existingSecurityAccounts:existing,productionWrites:0}));return;}
 if(!args.backup||!args.key||!args['owner-password-file']||!process.env.MIGRATION_CHANGE_ID)throw new Error('Protected inputs missing');const key=readFileSync(args.key);const plan=await prepareMigration(store,manifest.accounts,readFileSync(args['owner-password-file'],'utf8').trim());Object.assign(plan,{projectId:args.project,databaseId:args.database,changeId:process.env.MIGRATION_CHANGE_ID});writeFileSync(args.backup,encryptBackup(plan,key),{mode:0o600,flag:'wx'});await applyMigration(store,plan);console.log(JSON.stringify({applied:true,accounts:manifest.accounts.length,backupWritten:true}));
}
run().catch(()=>{console.error('Migrasi dihentikan: periksa target, manifest, input terlindungi, backup, atau konflik data. Tidak ada rahasia dicetak.');process.exitCode=1;});
