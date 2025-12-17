import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

let s3Client: S3Client | null = null;
let s3Region: string = "eu-north-1";
let s3Bucket: string = "";

export function initializeS3(
  accessKeyId: string,
  secretAccessKey: string,
  region: string = "eu-north-1",
  bucket: string,
) {
  console.log("🔧 Initializing S3 client...");
  console.log("  Region:", region);
  console.log("  Bucket:", bucket);
  console.log("  Access Key ID:", accessKeyId?.substring(0, 5) + "...");

  s3Region = region;
  s3Bucket = bucket;

  // Explicitly set the regional endpoint
  const endpoint = `https://s3.${region}.amazonaws.com`;
  console.log("  Endpoint:", endpoint);

  s3Client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  console.log("✅ S3 client initialized successfully");

  return { s3Client, bucket };
}

export async function uploadToS3(
  file: File | Buffer,
  fileName: string,
  bucket: string,
  folder: string = "products",
): Promise<string> {
  console.log("📤 Starting S3 upload...");
  console.log("  File:", fileName);
  console.log("  Bucket:", bucket);
  console.log("  Folder:", folder);
  console.log("  S3 Client exists:", !!s3Client);
  console.log("  Current s3Region:", s3Region);
  console.log("  Current s3Bucket:", s3Bucket);

  if (!s3Client) {
    throw new Error(
      "S3 client not initialized. Please configure AWS credentials first.",
    );
  }

  const key = `${folder}/${Date.now()}-${fileName}`;
  const contentType = file instanceof File ? file.type : "image/jpeg";

  console.log("  Generated key:", key);
  console.log("  Content type:", contentType);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file instanceof File ? Buffer.from(await file.arrayBuffer()) : file,
    ContentType: contentType,
  });

  console.log("  Command created, sending to S3...");

  try {
    await s3Client.send(command);
    console.log("✅ Upload successful!");
  } catch (error) {
    console.error("❌ S3 upload failed:", error);
    throw error;
  }

  // Return the public URL using the correct regional format
  const url = `https://${bucket}.s3.${s3Region}.amazonaws.com/${key}`;
  console.log("  Generated URL:", url);

  return url;
}

export async function uploadMultipleToS3(
  files: File[],
  bucket: string,
  folder: string = "products",
): Promise<string[]> {
  const uploadPromises = files.map((file) =>
    uploadToS3(file, file.name, bucket, folder),
  );
  return Promise.all(uploadPromises);
}
