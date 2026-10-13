import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import { randomToken, requireThat, HttpError } from "./security.js";
import type { RecordData } from "./store.js";
export interface MediaProvider {
  authorize?(asset: RecordData): Promise<{url:string;fields:Record<string,string>}>;
  inspect?(asset: RecordData): Promise<RecordData>;
  upload(buffer: Buffer, mime: string): Promise<RecordData>;
  download(asset: RecordData): Promise<Response>;
  destroy(asset: RecordData): Promise<void>;
}
export async function validateFile(buffer: Buffer, claimed: string) {
  const type = await fileTypeFromBuffer(buffer).catch(() => undefined);
  requireThat(
    type &&
      [
        "image/jpeg",
        "image/png",
        "image/webp",
        "video/mp4",
        "video/webm",
      ].includes(type.mime) &&
      claimed === type.mime,
    400,
    "INVALID_FILE",
    "Gunakan JPEG, PNG, WebP, MP4, atau WebM yang valid.",
  );
  requireThat(
    buffer.length <= (type.mime.startsWith("image/") ? 8 : 20) * 1024 * 1024,
    413,
    "FILE_TOO_LARGE",
  );
  if (type.mime.startsWith("image/")) {
    try {
      await sharp(buffer, {
        limitInputPixels: 24_000_000,
        failOn: "error",
      }).stats();
    } catch {
      throw new HttpError(
        400,
        "INVALID_FILE",
        "Gambar rusak atau melebihi batas resolusi.",
      );
    }
  }
  return type.mime;
}
export function assetIds(value: any): string[] {
  const ids = new Set<string>();
  function walk(x: any) {
    if (typeof x === "string") {
      const m = x.match(/^\/api\/media\/([\w-]+)$/);
      if (m) ids.add(m[1]);
    } else if (x && typeof x === "object") Object.values(x).forEach(walk);
  }
  walk(value);
  return [...ids];
}
export function cloudinaryProvider(): MediaProvider {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  function configured() {
    requireThat(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET,
      503,
      "MEDIA_UNAVAILABLE",
      "Penyimpanan media belum tersedia.",
    );
  }
  return {
    async authorize(asset){
      configured();
      const fields={timestamp:String(Math.floor(Date.now()/1000)),public_id:asset.publicId,type:'authenticated',overwrite:'false',allowed_formats:asset.resourceType==='video'?'mp4,webm':'jpg,jpeg,png,webp'};
      return{url:'https://api.cloudinary.com/v1_1/'+process.env.CLOUDINARY_CLOUD_NAME+'/'+asset.resourceType+'/upload',fields:{...fields,api_key:process.env.CLOUDINARY_API_KEY!,signature:cloudinary.utils.api_sign_request(fields,process.env.CLOUDINARY_API_SECRET!)}};
    },
    async inspect(asset){
      configured();
      let r:any;
      try{r=await cloudinary.api.resource(asset.publicId,{resource_type:asset.resourceType,type:'authenticated'});}catch{throw new HttpError(502,'MEDIA_UNAVAILABLE','Upload belum dapat diverifikasi. Coba lagi.');}
      return{publicId:r.public_id,resourceType:r.resource_type,deliveryType:r.type,format:r.format,size:r.bytes,width:r.width||0,height:r.height||0};
    },
    async upload(buffer, mime) {
      configured();
      const publicId = "angkatanku-v2/" + randomToken();
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            type: "authenticated",
            resource_type: mime.startsWith("video/") ? "video" : "image",
            overwrite: false,
            allowed_formats: ["jpg", "jpeg", "png", "webp", "mp4", "webm"],
            timeout: 30000,
          },
          (err, r) => {
            if (err || !r)
              return reject(
                new HttpError(
                  502,
                  "MEDIA_UNAVAILABLE",
                  "Upload belum berhasil.",
                ),
              );
            resolve({
              publicId: r.public_id,
              resourceType: r.resource_type,
              format: r.format,
              mime,
              size: buffer.length,
            });
          },
        );
        stream.end(buffer);
      });
    },
    async download(asset) {
      configured();
      const url = cloudinary.utils.private_download_url(
        asset.publicId,
        asset.format,
        {
          type: "authenticated",
          resource_type: asset.resourceType,
          expires_at: Math.floor(Date.now() / 1000) + 60,
        },
      );
      const response = await fetch(url, {
        redirect: "error",
        signal: AbortSignal.timeout(30000),
      });
      requireThat(response.ok, 502, "MEDIA_UNAVAILABLE");
      return response;
    },
    async destroy(asset) {
      configured();
      const r = await cloudinary.uploader.destroy(asset.publicId, {
        resource_type: asset.resourceType,
        type: "authenticated",
        invalidate: true,
      });
      requireThat(
        ["ok", "not found"].includes(r.result),
        502,
        "MEDIA_DELETE_FAILED",
      );
    },
  };
}
