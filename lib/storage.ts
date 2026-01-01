/**
 * Универсальный модуль для работы с хранилищем файлов
 * Поддерживает Yandex Object Storage (S3-совместимый)
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Конфигурация для Yandex Object Storage
const s3Client = new S3Client({
  endpoint: process.env.YANDEX_STORAGE_ENDPOINT || "https://storage.yandexcloud.net",
  region: "ru-central1",
  credentials: {
    accessKeyId: process.env.YANDEX_STORAGE_ACCESS_KEY || "",
    secretAccessKey: process.env.YANDEX_STORAGE_SECRET_KEY || "",
  },
  forcePathStyle: false,
});

const BUCKET_NAME = process.env.YANDEX_STORAGE_BUCKET || "";

/**
 * Загружает файл в Object Storage
 */
export async function uploadFile(
  file: File | Buffer,
  path: string,
  contentType?: string
): Promise<{ url: string; key: string }> {
  const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: path,
    Body: buffer,
    ContentType: contentType || "application/octet-stream",
    ACL: "public-read", // Для публичного доступа
  });

  await s3Client.send(command);

  // Формируем публичный URL
  const url = `${process.env.YANDEX_STORAGE_ENDPOINT}/${BUCKET_NAME}/${path}`;

  return { url, key: path };
}

/**
 * Удаляет файл из Object Storage
 */
export async function deleteFile(path: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: path,
  });

  await s3Client.send(command);
}

/**
 * Получает подписанный URL для временного доступа к файлу
 */
export async function getSignedFileUrl(path: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: path,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Проверяет, настроено ли хранилище
 */
export function isStorageConfigured(): boolean {
  return !!(
    process.env.YANDEX_STORAGE_ACCESS_KEY &&
    process.env.YANDEX_STORAGE_SECRET_KEY &&
    process.env.YANDEX_STORAGE_BUCKET
  );
}

