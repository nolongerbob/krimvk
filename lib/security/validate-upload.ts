import { validateImageUpload } from '@/lib/security/validate-image-upload';

export const USER_APPLICATION_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
] as const;

/** Вложения в посты/страницы (публичный S3). */
export const PUBLIC_ATTACHMENT_MIME = [
  ...USER_APPLICATION_MIME,
  'image/webp',
  'image/gif',
] as const;

export const CONTRACT_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const DISCLOSURE_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

export async function validateUserApplicationFile(file: File): Promise<string | null> {
  const mime = (file.type || '').toLowerCase();
  if (!USER_APPLICATION_MIME.includes(mime as (typeof USER_APPLICATION_MIME)[number])) {
    return 'Недопустимый тип файла. Разрешены: PDF, DOC, DOCX, JPG, PNG';
  }
  if (mime.startsWith('image/')) {
    return validateImageUpload(file);
  }
  return null;
}

export async function validatePublicAttachment(file: File): Promise<string | null> {
  const mime = (file.type || '').toLowerCase();
  if (!PUBLIC_ATTACHMENT_MIME.includes(mime as (typeof PUBLIC_ATTACHMENT_MIME)[number])) {
    return 'Недопустимый тип файла';
  }
  if (mime.startsWith('image/') || mime === 'image/jpg') {
    return validateImageUpload(file);
  }
  return null;
}

export function validateContractFile(file: File): string | null {
  const mime = (file.type || '').toLowerCase();
  if (!CONTRACT_MIME.includes(mime as (typeof CONTRACT_MIME)[number])) {
    return 'Недопустимый тип файла. Разрешены: PDF, DOC, DOCX';
  }
  return null;
}

export async function validateDisclosureFile(file: File): Promise<string | null> {
  const mime = (file.type || '').toLowerCase();
  if (!DISCLOSURE_MIME.includes(mime as (typeof DISCLOSURE_MIME)[number])) {
    return 'Недопустимый тип файла. Разрешены: PDF, DOC, DOCX, XLS, XLSX';
  }
  return null;
}

/** Отчёты качества воды — те же офисные форматы, что раскрытие информации. */
export async function validateWaterQualityFile(file: File): Promise<string | null> {
  return validateDisclosureFile(file);
}

/** Защита от забивания диска (админ может грузить большие PDF). */
export const WATER_QUALITY_MAX_BYTES = 200 * 1024 * 1024;
