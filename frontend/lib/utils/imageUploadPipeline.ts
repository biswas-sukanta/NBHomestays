import imageCompression from 'browser-image-compression';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGES_PER_UPLOAD = 5;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE_BYTES = 10 * 1024 * 1024;
const COMPRESSION_THRESHOLD_BYTES = 2 * 1024 * 1024;

export const IMAGE_UPLOAD_HELPER_TEXT =
  'Max 5 images - 5MB per image - Large images will be automatically optimized';

export async function processImages(files: File[]): Promise<File[]> {
  if (!files.length) return [];

  if (files.length > MAX_IMAGES_PER_UPLOAD) {
    throw new Error('Maximum 5 images allowed.');
  }

  const processed: File[] = [];

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error('Only images are allowed.');
    }

    let nextFile = file;

    if (file.size > COMPRESSION_THRESHOLD_BYTES) {
      nextFile = await imageCompression(file, {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1920,
        initialQuality: 0.85,
        useWebWorker: true,
      });
    }

    if (nextFile.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error('Each image must be under 5MB.');
    }

    processed.push(nextFile);
  }

  const totalSize = processed.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_TOTAL_SIZE_BYTES) {
    throw new Error('Total upload size must be under 10MB.');
  }

  return processed;
}
