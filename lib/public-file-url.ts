/**
 * @deprecated Импортируйте из @/lib/file-url и @/lib/s3-file-access
 */
export {
  isAllowedPublicS3Key,
  isPublicS3Key,
  isPrivateS3Key,
  PUBLIC_S3_PREFIXES,
  PRIVATE_S3_PREFIXES,
} from '@/lib/s3-file-access';

export {
  publicFilePathForS3Key,
  privateFilePathForS3Key,
  storedFileUrlForS3Key as publicFileUrlForS3Key,
  s3KeyFromStoredUrl,
  fileHrefForStoredUrl as publicFileHref,
} from '@/lib/file-url';
