// Функция для транслитерации кириллицы в латиницу
const transliterationMap: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
  'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
  'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
  'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
  'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
};

/**
 * Генерирует URL-friendly slug из заголовка
 * @param title - Заголовок поста
 * @param existingSlugs - Массив существующих slug для проверки уникальности
 * @returns Уникальный slug
 */
export function generateSlug(title: string, existingSlugs: string[] = []): string {
  // Транслитерация
  let slug = title
    .split('')
    .map(char => transliterationMap[char] || char)
    .join('')
    .toLowerCase();

  // Оставляем только буквы, цифры, дефисы и подчеркивания
  slug = slug.replace(/[^a-z0-9_-]+/g, '-');
  
  // Убираем дефисы в начале и конце
  slug = slug.replace(/^-+|-+$/g, '');
  
  // Убираем множественные дефисы
  slug = slug.replace(/-+/g, '-');

  // Если slug пустой, используем дефолтное значение
  if (!slug) {
    slug = 'post';
  }

  // Проверяем уникальность
  let finalSlug = slug;
  let counter = 1;
  while (existingSlugs.includes(finalSlug)) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  return finalSlug;
}








