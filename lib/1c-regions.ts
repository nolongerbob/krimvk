/**
 * Допустимые сегменты пути 1С: /{region}/hs/WebAccounts/...
 * Совпадают с выбором в ЛК и админке «прямой л/с».
 */
export const ALLOWED_1C_REGIONS = [
  'prog',
  'saki',
  'evpatoria',
  'chernomor',
] as const;

export type OneCRegion = (typeof ALLOWED_1C_REGIONS)[number];

const REGION_SET = new Set<string>(ALLOWED_1C_REGIONS);

const REGION_PATH_SEGMENT = /^[a-z0-9_-]+$/;

export class Invalid1cRegionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Invalid1cRegionError';
  }
}

/** Проверка и нормализация региона перед подстановкой в URL к 1С. */
export function assertValid1cRegion(region: string | null | undefined): OneCRegion {
  if (region == null || String(region).trim() === '') {
    throw new Invalid1cRegionError('Регион обязателен для работы с 1С API');
  }

  const normalized = String(region).trim().toLowerCase();

  if (!REGION_PATH_SEGMENT.test(normalized)) {
    throw new Invalid1cRegionError('Недопустимый формат региона');
  }

  if (!REGION_SET.has(normalized)) {
    throw new Invalid1cRegionError(
      `Регион «${normalized}» не поддерживается. Доступны: ${ALLOWED_1C_REGIONS.join(', ')}`
    );
  }

  return normalized as OneCRegion;
}
