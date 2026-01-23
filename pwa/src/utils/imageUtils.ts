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
 * Upload meal photo to Supabase Storage
 * Returns the storage path on success
 */
export async function uploadMealPhoto(
  file: File,
  userId: string
): Promise<{ path: string; url: string } | { error: string }> {
  try {
    // Generate unique filename
    const filePath = generateMealPhotoFilename(userId);

    // Upload to storage
    const { data, error } = await supabase.storage
      .from("meal-photos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return { error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("meal-photos")
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: urlData.publicUrl,
    };
  } catch (err) {
    console.error("Unexpected upload error:", err);
    return { error: err instanceof Error ? err.message : "Upload failed" };
  }
}
