import type {Request,Response} from 'express';
import type {Store} from './store';
import {digest,randomToken,requireThat,normalizeUsername,verifyPassword,rateLimit,audit,type Principal} from './security';
export const MAX_SESSION_MS=7*86400_000,IDLE_SESSION_MS=12*3600_000;
export const cookieName=()=>process.env.NODE_ENV==='production'?'__Host-angkatan_session':'angkatan_session';
function cookie(req:Request){const token=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName()+'='))?.slice(cookieName().length+1);return token&&/^[A-Za-z0-9_-]{43}$/.test(token)?token:null;}
export const sessionCsrf=(req:Request)=>digest('csrf:'+cookie(req));
export function setCookie(res:Response,token:string){res.cookie(cookieName(),token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:MAX_SESSION_MS});}
export function clearCookie(res:Response){res.clearCookie(cookieName(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/'});}
export async function principal(store:Store,req:Request):Promise<Principal|null>{const token=cookie(req);if(!token)return null;const sid=digest(token),session=await store.get('security_sessions/'+sid);if(!session||session.revoked||session.expiresAt<=Date.now()||session.idleExpiresAt<=Date.now())return null;const account=await store.get('security_accounts/'+session.uid);if(!account||account.status!=='active'||account.version!==session.version)return null;return{uid:session.uid,sid,session,account};}
export function authenticated(p:Principal|null):asserts p is Principal{requireThat(p,401,'AUTH_REQUIRED','Masuk untuk melanjutkan.');}
export function originCheck(req:Request,origins:string[]){requireThat(typeof req.headers.origin==='string'&&origins.includes(req.headers.origin)&&req.headers['sec-fetch-site']!=='cross-site',403,'ORIGIN_DENIED','Asal permintaan tidak diizinkan.');}
export function csrfCheck(req:Request,p:Principal){requireThat(typeof req.headers['x-csrf-token']==='string'&&digest(req.headers['x-csrf-token'])===p.session.csrfHash,403,'CSRF_INVALID','Sesi perlu dimuat ulang.');}
export function userView(p:Principal){return{uid:p.uid,username:p.account.username,displayName:p.account.displayName||p.account.username,email:null,photoURL:null,isAnonymous:false,role:p.account.role,permissions:p.account.permissions||[],scope:p.account.scope,classRooms:p.account.classRooms||[],profileId:p.account.profileId||p.uid,profileKind:p.account.profileKind||'student',profileCollection:p.account.profileCollection||(p.account.profileKind==='teacher'?'teachers':'students'),mustChangePassword:!!p.account.mustChangePassword};}
export async function login(store:Store,req:Request,res:Response){
 await rateLimit(store,'login-ip:'+req.ip,30,600_000);const username=normalizeUsername(req.body.username);await rateLimit(store,'login-user:'+username,5,600_000);
 const index=await store.get('security_usernames/'+digest(username)),account=index?await store.get('security_accounts/'+index.uid):null;
 const verified=await verifyPassword(req.body.password,account?.passwordHash);
 requireThat(verified&&account?.status==='active',401,'INVALID_CREDENTIALS','Username atau kata sandi tidak cocok, atau akses belum aktif.');
 const token=randomToken(),sid=digest(token),csrf=digest('csrf:'+token),now=Date.now(),previous=cookie(req);
 const session={uid:index!.uid,csrfHash:digest(csrf),version:account.version,createdAt:now,reauthenticatedAt:now,expiresAt:now+MAX_SESSION_MS,idleExpiresAt:now+IDLE_SESSION_MS,revoked:false};
 await store.atomic(['security_accounts/'+index!.uid],([latest])=>{requireThat(latest?.version===account.version&&latest.status==='active',401,'INVALID_CREDENTIALS');return{value:null,writes:{['security_sessions/'+sid]:session,...(previous?{['security_sessions/'+digest(previous)]:null}:{}),['security_audit/'+randomToken()]:audit(index!.uid,'session.login',sid)}};});
 setCookie(res,token);res.json({user:userView({uid:index!.uid,account,session,sid}),csrfToken:csrf});
}
