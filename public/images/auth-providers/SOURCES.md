# Preview provider marks

Collected 2026-09-22 from the sources below, stored locally to avoid
third-party requests on the login page. Marks belong to their respective owners.

- Gosuslugi mark: https://logo-teka.com/wp-content/uploads/2025/06/gosusligi-logo.svg (third-party vector copy; replaces the old flag favicon in the preview)
- Yandex: `yandex.svg` uses the Я glyph path from https://oauth.yandex.ru/?lang=ru, positioned on a red circle. Replaces the low-color raster favicon; not an official downloaded button asset.
- VK ID: https://id.vk.com/about/icons/id/favicon.svg
- MAX mark: silhouette path from https://max.ru/favicon.svg, rendered white on the preview's gradient background

Dev-only layout assets, not proof of support/approval for an authentication flow.
Before enabling real integrations validate each provider's current button requirements.
Yandex button guidance: https://yandex.ru/dev/id/doc/ru/codes/buttons-design
# Одноклассники и Mail

`ok.svg` и `mail.svg`: SVG из официального VK ID Web SDK,
https://github.com/VKCOM/vkid-web-sdk/blob/master/src/widgets/oauthList/template.ts
Размеры шаблона заменены на фиксированные 28px; геометрия и цвета сохранены.
