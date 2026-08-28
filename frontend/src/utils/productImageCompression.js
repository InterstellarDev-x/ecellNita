import imageCompressionWorkerUrl from "browser-image-compression/dist/browser-image-compression.js?url";

export const MAX_SOURCE_PRODUCT_IMAGE_SIZE_MB = 10;
export const TARGET_PRODUCT_IMAGE_SIZE_MB = 1;
export const MAX_COMPRESSED_UPLOAD_SIZE_MB = 3;
export const MAX_PRODUCT_IMAGE_DIMENSION = 1600;
export const ALLOWED_PRODUCT_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateProductImage(file) {
  if (!ALLOWED_PRODUCT_IMAGE_TYPES.has(file?.type)) {
    return "Only JPG, PNG, or WebP images are allowed.";
  }
  if (file.size > MAX_SOURCE_PRODUCT_IMAGE_SIZE_MB * 1024 * 1024) {
    return `Each source image must be ${MAX_SOURCE_PRODUCT_IMAGE_SIZE_MB}MB or smaller.`;
  }
  return "";
}

export async function compressProductImage(file) {
  const { default: imageCompression } = await import("browser-image-compression");
  const compressedFile = await imageCompression(file, {
    maxSizeMB: TARGET_PRODUCT_IMAGE_SIZE_MB,
    maxWidthOrHeight: MAX_PRODUCT_IMAGE_DIMENSION,
    useWebWorker: true,
    libURL: imageCompressionWorkerUrl,
    preserveExif: false,
  });
  if (compressedFile.size > MAX_COMPRESSED_UPLOAD_SIZE_MB * 1024 * 1024) {
    throw new Error("The optimized image is still too large to upload");
  }
  return compressedFile;
}
