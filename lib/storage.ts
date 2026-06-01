/**
 * Абстракция для хранилища файлов
 * Позволяет легко переключаться между разными провайдерами
 */

import { s3KeyFromStoredUrl, storedFileUrlForS3Key } from './file-url';

export interface StorageProvider {
  upload(file: File | Buffer, path: string, options?: UploadOptions): Promise<UploadResult>;
  delete(url: string): Promise<void>;
}

export interface UploadOptions {
  contentType?: string;
  access?: 'public' | 'private';
}

export interface UploadResult {
  url: string;
  path: string;
}

// Vercel Blob Storage implementation
class VercelBlobStorage implements StorageProvider {
  async upload(file: File | Buffer, path: string, options?: UploadOptions): Promise<UploadResult> {
    const { put } = await import('@vercel/blob');
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      throw new Error('BLOB_READ_WRITE_TOKEN is not set');
    }

    const blob = await put(path, file, {
      access: (options?.access === 'private' ? 'private' : 'public') as 'public',
      contentType: options?.contentType || 'application/octet-stream',
      token: blobToken,
    });

    return {
      url: blob.url,
      path: blob.pathname,
    };
  }

  async delete(url: string): Promise<void> {
    const { del } = await import('@vercel/blob');
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      throw new Error('BLOB_READ_WRITE_TOKEN is not set');
    }

    await del(url, { token: blobToken });
  }
}

// S3-compatible storage (AWS, Yandex Object Storage, MinIO)
class S3Storage implements StorageProvider {
  private bucket: string;
  private region: string;
  private endpoint: string | undefined;
  private forcePathStyle: boolean;
  private publicUrlBase: string | undefined;

  constructor() {
    this.bucket = process.env.S3_BUCKET_NAME || '';
    this.region = process.env.S3_REGION || 'us-east-1';
    this.endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '');
    this.forcePathStyle =
      process.env.S3_FORCE_PATH_STYLE === '1' ||
      process.env.S3_FORCE_PATH_STYLE === 'true' ||
      Boolean(this.endpoint);
    this.publicUrlBase = process.env.S3_PUBLIC_URL_BASE?.replace(/\/$/, '');

    if (!this.bucket) {
      throw new Error('S3_BUCKET_NAME is not set');
    }
  }

  private async getClient() {
    const { S3Client } = await import('@aws-sdk/client-s3');
    return new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      forcePathStyle: this.forcePathStyle,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  private objectUrl(key: string): string {
    // Прямой URL к Yandex без политики GetObject не открывается в браузере.
    // Раздача через /api/public-file (ключи SA), политику бакета не нужна.
    if (process.env.S3_PUBLIC_VIA_PROXY !== '0') {
      return storedFileUrlForS3Key(key);
    }
    if (this.publicUrlBase) {
      return `${this.publicUrlBase}/${key}`;
    }
    if (this.endpoint) {
      if (this.forcePathStyle) {
        return `${this.endpoint}/${this.bucket}/${key}`;
      }
      return `https://${this.bucket}.storage.yandexcloud.net/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  private keyFromUrl(url: string): string {
    const fromProxy = s3KeyFromStoredUrl(url);
    if (fromProxy) {
      return fromProxy;
    }
    if (this.publicUrlBase && url.startsWith(this.publicUrlBase)) {
      return url.slice(this.publicUrlBase.length + 1);
    }
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts[0] === this.bucket) {
        return parts.slice(1).join('/');
      }
      return parts.join('/');
    } catch {
      return url.split('.com/')[1] || url.split('/').pop() || '';
    }
  }

  async upload(file: File | Buffer, path: string, options?: UploadOptions): Promise<UploadResult> {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();

    const buffer = file instanceof File ? await file.arrayBuffer() : file;
    const bodyBuffer = buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer;

    const putInput: {
      Bucket: string;
      Key: string;
      Body: Buffer;
      ContentType: string;
      ACL?: 'public-read' | 'private';
    } = {
      Bucket: this.bucket,
      Key: path,
      Body: bodyBuffer,
      ContentType: options?.contentType || 'application/octet-stream',
    };

    if (process.env.S3_USE_ACL !== '0') {
      putInput.ACL = options?.access === 'public' ? 'public-read' : 'private';
    }

    await client.send(new PutObjectCommand(putInput));

    return {
      url: this.objectUrl(path),
      path,
    };
  }

  async delete(url: string): Promise<void> {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();
    const key = this.keyFromUrl(url);

    await client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }
}

// Local filesystem storage (для разработки или простых случаев)
class LocalStorage implements StorageProvider {
  private basePath: string;

  constructor() {
    this.basePath = process.env.STORAGE_PATH || './public/uploads';
  }

  async upload(file: File | Buffer, path: string, options?: UploadOptions): Promise<UploadResult> {
    const fs = await import('fs/promises');
    const pathModule = await import('path');

    const fullPath = pathModule.join(this.basePath, path);
    const dir = pathModule.dirname(fullPath);

    await fs.mkdir(dir, { recursive: true });

    const buffer = file instanceof File ? await file.arrayBuffer() : file;
    const bodyBuffer = buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer;
    await fs.writeFile(fullPath, bodyBuffer);

    const baseUrl = process.env.STORAGE_BASE_URL || '';
    const url = baseUrl ? `${baseUrl}/uploads/${path}` : `/uploads/${path}`;

    return {
      url,
      path: fullPath,
    };
  }

  async delete(url: string): Promise<void> {
    const fs = await import('fs/promises');
    const pathModule = await import('path');

    const path = url.replace('/uploads/', '');
    const fullPath = pathModule.join(this.basePath, path);

    try {
      await fs.unlink(fullPath);
    } catch {
      console.warn('File not found for deletion:', fullPath);
    }
  }
}

export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'vercel';

  switch (provider) {
    case 's3':
      return new S3Storage();
    case 'local':
      return new LocalStorage();
    case 'vercel':
    default:
      return new VercelBlobStorage();
  }
}

export const storage = getStorageProvider();
