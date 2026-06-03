# DOCX / xmldom

`docxtemplater-link-module` тянет уязвимый `xmldom` без официального fix в npm.

**Правила:**

- Использовать только в **server** route handlers (`fill-pdf`, admin templates).
- Не импортировать в client components.
- Перед релизом: `npm audit` и план замены link-module.
