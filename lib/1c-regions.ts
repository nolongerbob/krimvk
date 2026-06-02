/**
 * Сегменты пути 1С: /{region}/hs/WebAccounts/...
 * Список как на старом сайте и в форме добавления л/с (AddAccountForm).
 */

export const ONE_C_REGION_OPTIONS = [
  { value: 'krasn', label: 'Красногвардейский район' },
  { value: 'saki', label: 'Сакский и Симферопольский районы' },
  { value: 'pervom', label: 'Первомайский район' },
  { value: 'nignegorsk', label: 'Нижнегорский район' },
  { value: 'ruch', label: 'Раздольненский район' },
  { value: 'sovetskoe', label: 'Советский район' },
  { value: 'chernomorsk', label: 'Черноморский район' },
] as const;

export const ALLOWED_1C_REGIONS = ONE_C_REGION_OPTIONS.map(
  (o) => o.value
) as readonly [
  'krasn',
  'saki',
  'pervom',
  'nignegorsk',
  'ruch',
  'sovetskoe',
  'chernomorsk',
];

export type OneCRegion = (typeof ALLOWED_1C_REGIONS)[number];

const REGION_SET = new Set<string>(ALLOWED_1C_REGIONS);

const REGION_PATH_SEGMENT = /^[a-z0-9_-]+$/;

export class Invalid1cRegionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Invalid1cRegionError';
  }
}

export function get1cRegionLabel(code: string | null | undefined): string {
  if (!code) return '';
  const found = ONE_C_REGION_OPTIONS.find((o) => o.value === code);
  return found?.label ?? code;
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
      `Регион «${normalized}» не поддерживается. Выберите район из списка в личном кабинете.`
    );
  }

  return normalized as OneCRegion;
}

export function isValid1cRegion(
  region: string | null | undefined
): region is OneCRegion {
  try {
    assertValid1cRegion(region);
    return true;
  } catch {
    return false;
  }
}
