/** Имя для публичных страниц — без утечки email админа. */
export function formatPublicAuthorName(
  name: string | null | undefined,
  email: string | null | undefined
): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  return 'Редакция';
}
