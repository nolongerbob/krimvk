# VPS Quickstart (nic.ru)

Репозиторий: `git@github.com:nolongerbob2/krimvk.git`

## На Mac (перед VPS)

```bash
cd /path/to/krimvk
bash scripts/generate-deploy-ssh-key.sh
bash scripts/print-github-secrets-checklist.sh
```

Закоммитьте и запушьте код, создайте ветку `develop`:

```bash
git push origin main
git checkout -b develop
git push -u origin develop
```

## На VPS (одной командой init)

Скопируйте проект на сервер или клонируйте и запустите:

```bash
ssh root@<VPS_IP>
git clone https://github.com/nolongerbob2/krimvk.git /tmp/krimvk-setup
cd /tmp/krimvk-setup
sudo bash scripts/vps-init.sh
```

Либо после clone вручную — см. [CI_CD.md](./CI_CD.md).

## После init

1. Отредактировать `/var/www/krimvk/.env` и `/var/www/krimvk-dev/.env.dev`
2. Первый деплой (см. вывод `vps-init.sh`)
3. GitHub Secrets — [GITHUB_SECRETS.md](./GITHUB_SECRETS.md)
4. Push в `develop` / `main` → автодеплой

## Проверка

- Prod: `http://<IP>/` и `curl http://127.0.0.1:3000/api/health`
- Dev: `http://<IP>:8080/` и `curl http://127.0.0.1:3001/api/health`
