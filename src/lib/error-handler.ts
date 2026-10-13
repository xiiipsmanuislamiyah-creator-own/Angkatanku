export enum OperationType{CREATE='create',UPDATE='update',DELETE='delete',LIST='list',GET='get',WRITE='write'}
export function handleFirestoreError(_error:unknown,_operationType:OperationType,_path:string|null):never{throw new Error('Operasi data gagal. Periksa izin akun atau coba kembali.');}
