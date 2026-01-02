/**
 * Абстракция для хранилища файлов
 * Позволяет легко переключаться между разными провайдерами
 */

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
      access: options?.access || 'public',
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

// AWS S3 Storage implementation
class S3Storage implements StorageProvider {
  private bucket: string;
  private region: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET_NAME || '';
    this.region = process.env.S3_REGION || 'us-east-1';
    
    if (!this.bucket) {
      throw new Error('S3_BUCKET_NAME is not set');
    }
  }

  async upload(file: File | Buffer, path: string, options?: UploadOptions): Promise<UploadResult> {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    
    const client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    const buffer = file instanceof File ? await file.arrayBuffer() : file;
    
    await client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: Buffer.from(buffer),
      ContentType: options?.contentType || 'application/octet-stream',
      ACL: options?.access === 'public' ? 'public-read' : 'private',
    }));

    const url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${path}`;
    
    return {
      url,
      path,
    };
  }

  async delete(url: string): Promise<void> {
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    
    const client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    // Извлекаем ключ из URL
    const key = url.split('.com/')[1] || url.split('/').pop() || '';
    
    await client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
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
    await fs.writeFile(fullPath, Buffer.from(buffer));
    
    // Для локального хранилища URL должен быть относительным или абсолютным
    // В зависимости от того, как настроен Nginx
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
    } catch (error) {
      // Файл может не существовать, это нормально
      console.warn('File not found for deletion:', fullPath);
    }
  }
}

// Factory function для получения провайдера
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

// Экспортируем singleton
export const storage = getStorageProvider();

