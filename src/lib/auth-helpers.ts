import {api,acceptSession,loadSession} from './api';
export {extractCredentialsFromQR} from './qr';
export async function authenticateUser(username:string,password:string){const result=await api('/auth/login',{username,password});acceptSession(result);await loadSession();return{user:result.user};}
export async function registerUser(..._args:any[]){throw new Error('Akun baru dibuat owner melalui pusat kontrol.');}
export async function setupInitialStudents(..._args:any[]){throw new Error('Migrasi akun dijalankan di server menggunakan manifest terverifikasi.');}
export async function setupInitialTeachers(..._args:any[]){throw new Error('Migrasi akun dijalankan di server menggunakan manifest terverifikasi.');}
