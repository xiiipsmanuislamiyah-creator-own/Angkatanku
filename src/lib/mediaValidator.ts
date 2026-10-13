/**
 * Media Validator & Client-side Optimizer
 * Enforces file size and resolution rules:
 * - < 3 MB: Normal, uploaded directly
 * - 3 MB - 8 MB: Moderate high-res, prompts warning & auto-compresses via canvas
 * - > 8 MB: Rejected with educational message
 */

export interface MediaValidationResult {
  allowed: boolean;
  shouldCompress: boolean;
  warning?: string;
  error?: string;
}

export function validateMediaFile(file: File): MediaValidationResult {
  const sizeInMB = file.size / (1024 * 1024);

  // Reject extreme resolutions / large payloads
  if (sizeInMB > 8) {
    return {
      allowed: false,
      shouldCompress: false,
      error: `File berukuran ${sizeInMB.toFixed(1)} MB (melebihi batas 8 MB). Foto/video beresolusi sangat tinggi ditolak untuk menjaga kestabilan dan kuota server madrasah.`
    };
  }

  // Warning & auto-compress for medium-high files
  if (sizeInMB >= 3) {
    return {
      allowed: true,
      shouldCompress: true,
      warning: `Foto beresolusi tinggi (${sizeInMB.toFixed(1)} MB) terdeteksi. Sistem mengompresi gambar secara otomatis agar cepat dimuat di perangkat teman-teman.`
    };
  }

  return {
    allowed: true,
    shouldCompress: false
  };
}

/**
 * Client-side canvas compression for high-res images
 */
export async function compressImageIfNeeded(file: File, maxDimension: number = 1600, quality: number = 0.82): Promise<File> {
  // If not an image or under 3MB, return original
  if (!file.type.startsWith('image/') || file.size < 3 * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
