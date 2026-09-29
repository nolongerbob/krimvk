# Логотип сайта

Используется согласованный пользователем вариант с красным, синим и бирюзовым цветами. Это обновлённая графическая версия, не оригинальный CorelDRAW-файл.

- Исходник: `public/images/brand/company-logo-source.png`.
- Подготовка размеров: `node scripts/prepare-brand-assets.mjs <approved-logo.png>`.
- Шапка и футер: вариант 256 px; формы авторизации: 512 px на белой подложке без инвертирования цвета.
- Иконки: 16, 32 и 180 px. Новые URL исключают повторное использование закэшированных старых иконок.
- Старые исходные изображения сохранены, но компоненты сайта больше на них не ссылаются.

Изображение создано встроенным ImageGen. Последний промпт: recolor only; preserve typography, all Cyrillic wording, Crimea silhouette, three swooshes, composition and white outlines; cherry red #CC3545, blue #256BB5, turquoise #48BBC5; crisp balanced colors without neon or washed-out gray; flat fills, no new elements. Сгенерированный результат имеет прозрачный фон. При подготовке размеров рисунок не перерисовывался.

Изменения подготовлены локально; публикация этим действием не выполнялась.
