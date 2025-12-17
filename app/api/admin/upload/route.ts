import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    console.log("✅ Admin authenticated");

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID!;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!;
    const region = "eu-north-1"; // HARDCODED
    const bucket = "lynoarvex"; // HARDCODED

    console.log("Creating FRESH S3 client with region:", region);

    // Create FRESH S3 client every time
    const s3 = new S3Client({
      region: region,
      endpoint: `https://s3.${region}.amazonaws.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const key = `uploads/${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    console.log("Uploading to:", `${bucket}/${key}`);

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    console.log("✅ Success! URL:", url);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("❌ Upload failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
