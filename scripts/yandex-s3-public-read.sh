#!/usr/bin/env bash
# УСТАРЕЛО для krimvk: публичная политика на бакете часто ломает PutObject (AccessDenied).
# Используйте раздачу через сайт: /api/public-file (см. docs/YANDEX_S3_SETUP.md).
echo "Для krimvk политику GetObject на бакете ставить не нужно." >&2
echo "Файлы открываются через https://ваш-домен/api/public-file?key=..." >&2
echo "Убедитесь: git pull, npm run build, pm2 restart krimvk" >&2
exit 0
