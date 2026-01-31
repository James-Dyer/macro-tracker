/**
 * Image utility functions for processing meal photos
 */

import { supabase } from "../services/supabase";

/**
 * Convert a File or Blob to base64 string
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a URL (object URL) to base64 string
 */
export async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return fileToBase64(blob);
}

/**
 * Compress an image file to reduce size before upload
 * Uses browser-image-compression library
 */
export async function compressImage(
  file: File,
  options: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
  } = {}
): Promise<File> {
  // Dynamic import to keep bundle size small
  const imageCompression = (await import("browser-image-compression")).default;

  const defaultOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  const compressedFile = await imageCompression(file, {
    ...defaultOptions,
    ...options,
  });

  return compressedFile;
}

/**
 * Validate image file type and size
 */
export function validateImage(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSizeMB = 5, allowedTypes = ["image/jpeg", "image/png", "image/webp"] } = options;

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { valid: true };
}

/**
 * Generate a unique filename for storage
 */
export function generateMealPhotoFilename(userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${userId}/${timestamp}-${random}.jpg`;
}

/**
 * Generate a thumbnail from an image file
 * Creates a smaller version optimized for list views
 */
export async function generateThumbnail(
  file: File,
  options: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    quality?: number;
  } = {}
): Promise<File> {
  const imageCompression = (await import("browser-image-compression")).default;

  const thumbnail = await imageCompression(file, {
    maxSizeMB: 0.1,           // 100KB target for fast loading
    maxWidthOrHeight: 400,     // 400px covers @2x displays
    quality: 0.85,
    useWebWorker: true,
    ...options,
  });

  // Create new file with _thumb suffix
  return new File(
    [thumbnail],
    file.name.replace(/(\.[^.]+)$/, '_thumb$1'),
    { type: file.type }
  );
}

/**
 * Upload meal photo to Supabase Storage
 * Uploads both full-resolution image and optimized thumbnail
 * Returns storage paths (signed URLs generated on fetch)
 */
export async function uploadMealPhoto(
  file: File,
  userId: string
): Promise<{ path: string; thumbnailPath: string } | { error: string }> {
  try {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const baseFilename = `${userId}/${timestamp}-${random}`;

    const fullPath = `${baseFilename}.jpg`;
    const thumbPath = `${baseFilename}_thumb.jpg`;

    // Upload full-resolution image
    const { data: fullData, error: fullError } = await supabase.storage
      .from("meal-photos")
      .upload(fullPath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (fullError) {
      console.error("Upload error:", fullError);
      return { error: fullError.message };
    }

    // Generate and upload thumbnail
    const thumbnail = await generateThumbnail(file);
    const { data: thumbData, error: thumbError } = await supabase.storage
      .from("meal-photos")
      .upload(thumbPath, thumbnail, {
        cacheControl: "86400", // 24hr cache for thumbnails
        upsert: false,
      });

    if (thumbError) {
      console.warn("Thumbnail upload failed, falling back to full image:", thumbError);
      // Fallback to full image if thumbnail fails
      return {
        path: fullData.path,
        thumbnailPath: fullData.path,
      };
    }

    return {
      path: fullData.path,
      thumbnailPath: thumbData.path,
    };
  } catch (err) {
    console.error("Unexpected upload error:", err);
    return { error: err instanceof Error ? err.message : "Upload failed" };
  }
}
