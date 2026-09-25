import { getSupabaseBrowserClient } from "./client";

export const STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024; // 1 GB free/starter plan tier limit

/**
 * Uploads an asset (image, photo) to the private site-assets bucket.
 * Path convention: `${projectId}/${filename}`
 */
export async function uploadSiteAsset(
  projectId: string,
  filename: string,
  file: File | Blob | Buffer,
  contentType?: string
): Promise<{ path: string; signedUrl: string }> {
  const supabase = getSupabaseBrowserClient();
  const cleanFilename = filename.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
  const storagePath = `${projectId}/${cleanFilename}`;

  const { error } = await supabase.storage.from("site-assets").upload(storagePath, file, {
    upsert: true,
    contentType: contentType || "image/jpeg",
  });

  if (error) {
    throw new Error(`Failed to upload asset: ${error.message}`);
  }

  // Create a 24-hour signed preview URL (since bucket is private)
  const { data: signedData, error: signError } = await supabase.storage
    .from("site-assets")
    .createSignedUrl(storagePath, 60 * 60 * 24);

  if (signError || !signedData?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${signError?.message || "Unknown error"}`);
  }

  return {
    path: storagePath,
    signedUrl: signedData.signedUrl,
  };
}

/**
 * Generates a signed preview URL for any file in site-assets.
 */
export async function getAssetSignedUrl(storagePath: string, expiresInSec: number = 86400): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.storage
    .from("site-assets")
    .createSignedUrl(storagePath, expiresInSec);

  if (error || !data?.signedUrl) {
    throw new Error(`Could not generate signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}

/**
 * Uploads a .siteproject backup or export ZIP to the private backups bucket.
 */
export async function uploadBackupZip(
  projectId: string,
  filename: string,
  zipBlob: Blob | Buffer
): Promise<{ path: string; signedUrl: string }> {
  const supabase = getSupabaseBrowserClient();
  const storagePath = `${projectId}/${filename}`;

  const { error } = await supabase.storage.from("backups").upload(storagePath, zipBlob, {
    upsert: true,
    contentType: "application/zip",
  });

  if (error) {
    throw new Error(`Failed to upload backup: ${error.message}`);
  }

  const { data: signedData, error: signError } = await supabase.storage
    .from("backups")
    .createSignedUrl(storagePath, 60 * 60 * 2); // 2 hours

  return {
    path: storagePath,
    signedUrl: signedData?.signedUrl || "",
  };
}

/**
 * Calculates storage usage for both buckets.
 */
export async function getStorageUsageReport(): Promise<{
  usedBytes: number;
  limitBytes: number;
  usedFormatted: string;
  percentUsed: number;
  isNearLimit: boolean;
}> {
  try {
    const res = await fetch("/api/storage/usage");
    if (!res.ok) throw new Error("Failed to fetch storage usage");
    return await res.json();
  } catch {
    return {
      usedBytes: 0,
      limitBytes: STORAGE_LIMIT_BYTES,
      usedFormatted: "0 MB",
      percentUsed: 0,
      isNearLimit: false,
    };
  }
}
