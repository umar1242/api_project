import { Injectable, OnModuleInit, StreamableFile } from "@nestjs/common";
import { Readable } from "stream";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

@Injectable()
export class FilesService implements OnModuleInit {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.MINIO_BUCKET || "variant-files";
    this.client = new S3Client({
      endpoint: `http://${process.env.MINIO_ENDPOINT || "minio"}:${process.env.MINIO_PORT || "9000"}`,
      region: "us-east-1",
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER || "minioadmin",
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD || "minioadmin123",
      },
    });
  }

  async onModuleInit() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<{ fileUrl: string; key: string }> {
    const ext = file.originalname.split(".").pop() || "bin";
    const key = `${randomUUID()}.${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return { fileUrl: `/api/files/${key}`, key };
  }

  async getFile(key: string): Promise<StreamableFile> {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const stream = result.Body as Readable;
    return new StreamableFile(stream, {
      type: result.ContentType,
    });
  }
}
