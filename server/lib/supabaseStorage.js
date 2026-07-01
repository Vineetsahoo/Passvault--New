import { supabaseAdmin } from './supabaseClient.js';

/**
 * Thin wrapper around Supabase Storage for the buckets created by the
 * migration (documents, attachments, backups). Every path is expected to
 * start with the owning user's id — e.g. `${userId}/${filename}` — which is
 * what the storage.objects RLS policies in the schema check against.
 */

export const uploadFile = async (bucket, path, buffer, contentType) => {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert: false });

  if (error) throw error;
  return path;
};

export const downloadFile = async (bucket, path) => {
  const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
  if (error) throw error;
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export const deleteFile = async (bucket, path) => {
  const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
  if (error) throw error;
};

/**
 * Useful if you later want the client to upload/download directly against
 * Supabase Storage (skipping Express for the file bytes entirely) — hand it
 * a signed URL instead of proxying. Not used by documents.js yet since that
 * would also mean moving file encryption to the client; noted here as the
 * natural next optimization.
 */
export const createSignedUrl = async (bucket, path, expiresInSeconds = 60) => {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
};
