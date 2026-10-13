import { api, currentSession, getSessionRevision } from "./api";
export async function uploadToCloudinary(
  file: File,
  _resourceType: "image" | "video" | "auto" = "auto",
  onProgress?: (value: number) => void,
): Promise<string> {
  const rev = getSessionRevision(),
    configuration = await api("/media/config");
  const data = new FormData();
  data.append("file", file);
  let url = "/api/media",
    reservation: string | undefined;
  if (configuration.direct) {
    const signed = await api("/media/authorize", {
      mime: file.type,
      size: file.size,
    });
    // Accept upload endpoints only. No arbitrary destination for the selected file.
    if (
      !/^https:\/\/api\.cloudinary\.com\/v1_1\/[\w-]+\/(image|video)\/upload$/.test(
        signed.url,
      )
    )
      throw new Error("Tujuan upload tidak valid.");
    url = signed.url;
    reservation = signed.id;
    Object.entries(signed.fields).forEach(([k, v]) =>
      data.append(k, String(v)),
    );
  }
  const response: any = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.timeout = 120000;
    if (!reservation && currentSession().csrfToken)
      xhr.setRequestHeader("X-CSRF-Token", currentSession().csrfToken!);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress?.(Math.round((e.loaded / e.total) * 90));
    };
    xhr.onerror = xhr.ontimeout = () =>
      reject(new Error("Upload terputus. Coba lagi."));
    xhr.onload = () => {
      try {
        const r = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(r);
        else
          reject(
            new Error(
              reservation
                ? "Upload belum berhasil. Periksa file dan coba lagi."
                : r.error || "Upload belum berhasil.",
            ),
          );
      } catch {
        reject(new Error("Upload belum berhasil."));
      }
    };
    xhr.send(data);
  });
  if (rev !== getSessionRevision())
    throw new Error("Sesi berubah. Masuk kembali sebelum menerbitkan.");
  const result = reservation
    ? await api("/media/complete", { id: reservation })
    : response;
  onProgress?.(100);
  return result.url;
}
export async function deleteFromCloudinary(url: string): Promise<boolean> {
  const match = url.match(/^\/api\/media\/([\w-]+)$/);
  if (!match) return false;
  await api("/cloudinary-delete", { id: match[1] });
  return true;
}
