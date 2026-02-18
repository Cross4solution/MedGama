/**
 * Client-side image resize utility.
 * Resizes images before upload to reduce bandwidth and speed up uploads.
 * Uses canvas to resize and compress to WebP/JPEG.
 */

const MAX_WIDTH = 2048;
const MAX_HEIGHT = 2048;
const QUALITY = 0.82; // WebP/JPEG quality (0-1)

/**
 * Resize a single image File.
 * @param {File} file - Original image file
 * @param {Object} opts - Options
 * @param {number} opts.maxWidth - Max width (default 2048)
 * @param {number} opts.maxHeight - Max height (default 2048)
 * @param {number} opts.quality - Output quality 0-1 (default 0.82)
 * @returns {Promise<File>} - Resized file (WebP if supported, else JPEG)
 */
export async function resizeImage(file, opts = {}) {
  const maxW = opts.maxWidth || MAX_WIDTH;
  const maxH = opts.maxHeight || MAX_HEIGHT;
  const quality = opts.quality || QUALITY;

  // Skip non-image files
  if (!file.type.startsWith('image/')) return file;

  // Skip small files (< 500KB) — not worth resizing
  if (file.size < 500 * 1024) return file;

  // Skip GIFs (animated)
  if (file.type === 'image/gif') return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Skip if already within limits
      if (width <= maxW && height <= maxH && file.size < 1024 * 1024) {
        resolve(file);
        return;
      }

      // Calculate new dimensions
      const ratio = Math.min(maxW / width, maxH / height, 1);
      const newW = Math.round(width * ratio);
      const newH = Math.round(height * ratio);

      // Draw to canvas
      const canvas = document.createElement('canvas');
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, newW, newH);

      // Always use JPEG for maximum backend compatibility
      const outputType = 'image/jpeg';
      const ext = '.jpg';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file); // fallback to original
            return;
          }

          // Only use resized if it's actually smaller
          if (blob.size >= file.size) {
            resolve(file);
            return;
          }

          const resizedName = file.name.replace(/\.[^.]+$/, ext);
          const resizedFile = new File([blob], resizedName, {
            type: outputType,
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback to original
    };

    img.src = url;
  });
}

/**
 * Resize multiple image Files in parallel.
 * @param {File[]} files
 * @param {Object} opts
 * @returns {Promise<File[]>}
 */
export async function resizeImages(files, opts = {}) {
  return Promise.all(files.map((f) => resizeImage(f, opts)));
}

// WebP support detection (cached)
let _webpSupport = null;
function supportsWebP() {
  if (_webpSupport !== null) return _webpSupport;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    _webpSupport = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    _webpSupport = false;
  }
  return _webpSupport;
}
