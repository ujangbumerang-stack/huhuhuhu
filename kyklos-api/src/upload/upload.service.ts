import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import * as path from 'path';
import 'multer';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private s3Client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    this.bucket = process.env.AWS_BUCKET || '';
    this.publicUrl = process.env.AWS_URL || '';
    
    if (process.env.AWS_ACCESS_KEY_ID) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'auto',
        endpoint: process.env.AWS_ENDPOINT,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
      });
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'kyklos'): Promise<string> {
    if (!this.s3Client) {
      throw new InternalServerErrorException('Cloudflare R2 is not configured.');
    }

    const ext = path.extname(file.originalname);
    const filename = `${folder}/${randomUUID()}${ext}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );
      
      const url = `${this.publicUrl}/${filename}`;
      this.logger.log(`File uploaded successfully: ${url}`);
      return url;
    } catch (error: any) {
      this.logger.error(`Error uploading file to R2: ${error.message}`);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }
}
