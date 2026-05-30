# SSH-ключи для GitHub

В `~/.ssh/config` настроены два хоста:

| Host | Аккаунт | Ключ |
|------|---------|------|
| `github-nolongerbob` | nolongerbob | `~/.ssh/id_ed25519` |
| `github-nolongerbob2` | nolongerbob2 | `~/.ssh/id_ed25519_github_new` |

## Push в этот репозиторий (nolongerbob/krimvk)

```bash
git remote set-url origin git@github-nolongerbob:nolongerbob/krimvk.git
git push origin main
git push origin develop
```

## Если перенесёте репо на nolongerbob2

1. Создайте пустой репозиторий `krimvk` на GitHub под **nolongerbob2**.
2. Переключите remote:

```bash
git remote set-url origin git@github-nolongerbob2:nolongerbob2/krimvk.git
git push -u origin main
git push -u origin develop
```

3. На VPS в `vps-init.sh` укажите `REPO_URL=https://github.com/nolongerbob2/krimvk.git`.
