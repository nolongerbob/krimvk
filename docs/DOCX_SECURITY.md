# DOCX / xmldom

Неиспользуемый `docxtemplater-link-module` удалён: он подтягивал уязвимый `xmldom` без исправленной версии. В коде не было его импортов. Основной `docxtemplater` и `mammoth` сохранены; их `@xmldom/xmldom` обновляется через override.

**Правила:**

- Использовать только в **server** route handlers (`fill-pdf`, admin templates).
- Не импортировать в client components.
- Перед релизом: `npm audit --omit=dev` и проверка генерации DOCX. Не возвращать старый link-module.
