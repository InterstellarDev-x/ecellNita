const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";

const isPositiveNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0;

export function isCloudinaryImageUrl(url) {
  if (typeof url !== "string" || !url.includes(CLOUDINARY_UPLOAD_MARKER)) return false;
  try {
    return new URL(url).hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export function getOptimizedImageUrl(url, {
  width,
  height,
  crop = "fill",
  gravity = "auto",
  quality = "auto:good",
  format = "auto",
} = {}) {
  if (!isCloudinaryImageUrl(url)) return url;

  const transformations = [];
  if (isPositiveNumber(width)) transformations.push(`w_${Math.round(Number(width))}`);
  if (isPositiveNumber(height)) transformations.push(`h_${Math.round(Number(height))}`);
  if (crop) transformations.push(`c_${crop}`);
  if (gravity && crop === "fill") transformations.push(`g_${gravity}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);

  if (!transformations.length) return url;
  return url.replace(CLOUDINARY_UPLOAD_MARKER, `${CLOUDINARY_UPLOAD_MARKER}${transformations.join(",")}/`);
}

export function getResponsiveImageSrcSet(url, widths, options = {}) {
  if (!isCloudinaryImageUrl(url) || !Array.isArray(widths)) return undefined;
  return widths
    .filter(isPositiveNumber)
    .map((width) => {
      const numericWidth = Math.round(Number(width));
      const height = options.aspectRatio ? Math.round(numericWidth / options.aspectRatio) : options.height;
      return `${getOptimizedImageUrl(url, { ...options, width: numericWidth, height })} ${numericWidth}w`;
    })
    .join(", ");
}

export const productCardImageProps = (url, priority = false) => ({
  src: getOptimizedImageUrl(url, { width: 480, height: 360 }),
  srcSet: getResponsiveImageSrcSet(url, [320, 480, 720], { aspectRatio: 4 / 3 }),
  sizes: "(max-width: 560px) 100vw, (max-width: 900px) 50vw, 25vw",
  loading: priority ? "eager" : "lazy",
  decoding: "async",
  fetchPriority: priority ? "high" : "auto",
});

export const productDetailImageProps = (url, priority = false) => ({
  src: getOptimizedImageUrl(url, { width: 1200, crop: "limit", gravity: null }),
  srcSet: getResponsiveImageSrcSet(url, [640, 900, 1200, 1600], { crop: "limit", gravity: null }),
  sizes: "(max-width: 900px) 100vw, 70vw",
  loading: priority ? "eager" : "lazy",
  decoding: "async",
  fetchPriority: priority ? "high" : "auto",
});

export const productThumbnailImageProps = (url) => ({
  src: getOptimizedImageUrl(url, { width: 180, height: 135 }),
  srcSet: getResponsiveImageSrcSet(url, [120, 180, 240], { aspectRatio: 4 / 3 }),
  sizes: "180px",
  loading: "lazy",
  decoding: "async",
});

