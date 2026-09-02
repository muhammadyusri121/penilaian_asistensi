import "server-only";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://127.0.0.1:9000";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "minioadmin";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "minioadmin";
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "tugas-asistensi";
const S3_REGION = process.env.S3_REGION || "us-east-1";

export const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true, // Wajib untuk MinIO lokal
});

/**
 * Generate Presigned Upload URL (berlaku 10 menit)
 */
export async function getPresignedUploadUrl(
  fileKey: string,
  contentType: string
): Promise<{ uploadUrl: string; fileKey: string }> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });
  return { uploadUrl, fileKey };
}

/**
 * Generate Presigned View / Download URL (berlaku 1 jam)
 */
export async function getPresignedDownloadUrl(fileKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: fileKey,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
