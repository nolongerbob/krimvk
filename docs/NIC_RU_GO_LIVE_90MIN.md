# nic.ru Go-Live за 90 минут

## 0) Что должно быть заранее

- VPS на nic.ru (Ubuntu 22.04/24.04).
- Домен на nic.ru и доступ к DNS-зоне.
- GitHub репозиторий с веткой `main`.

## 1) Подготовка сервера (15-20 мин)

```bash
ssh root@<VPS_IP>
cd /tmp
git clone <REPO_URL> krimvk-bootstrap
cd krimvk-bootstrap
sudo bash scripts/bootstrap-vps.sh
```

## 2) Деплой пользователя и код (10 мин)

```bash
sudo -u krimvk -H bash -lc '
  cd /var/www/krimvk
  git clone <REPO_URL> .
  cp .env.example.vps .env
  chmod +x scripts/deploy-vps.sh scripts/backup-db.sh scripts/backup-uploads.sh scripts/restore-db.sh
'
```

Заполните `/var/www/krimvk/.env` актуальными значениями.

## 3) Nginx + TLS (15-20 мин)

```bash
sudo cp /var/www/krimvk/nginx.conf.example /etc/nginx/sites-available/krimvk
sudo ln -s /etc/nginx/sites-available/krimvk /etc/nginx/sites-enabled/krimvk
sudo nginx -t
sudo systemctl reload nginx
```

В DNS nic.ru добавьте:
- `A` для `yourdomain.ru` -> `<VPS_IP>`
- `A` для `www.yourdomain.ru` -> `<VPS_IP>`

После распространения DNS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.ru -d www.yourdomain.ru
```

## 4) Первый релиз (10-15 мин)

```bash
sudo -u krimvk -H bash -lc '
  cd /var/www/krimvk
  ./scripts/deploy-vps.sh
'
curl -fsS https://yourdomain.ru/api/health
```

## 5) GitHub Actions деплой (10 мин)

Добавьте secrets из `docs/GITHUB_SECRETS.md` и выполните push в `main`.

## 6) Финальная проверка (10 мин)

- Открывается сайт и личный кабинет.
- Работают формы/загрузки.
- Доступны:
  - `/legal/privacy`
  - `/legal/terms`
  - `/legal/cookies`
- Cookie banner фиксирует выбор.

## 7) После запуска

- Настроить cron backup jobs из `docs/PRODUCTION_RUNBOOK.md`.
- Пройти `docs/SERVER_HARDENING.md`.
- Пройти `docs/GO_LIVE_CHECKLIST.md`.
