# Убирает параметры Prisma из DATABASE_URL для pg_dump/psql (libpq).
pg_url_for_cli() {
  local url="$1"
  if [[ "$url" != *"?"* ]]; then
    printf '%s' "$url"
    return 0
  fi

  local base="${url%%\?*}"
  local qs="${url#*\?}"
  local out=""
  local part key

  IFS='&' read -ra params <<< "$qs"
  for part in "${params[@]}"; do
    [[ -z "$part" ]] && continue
    key="${part%%=*}"
    case "$key" in
      schema | connection_limit | pool_timeout | pgbouncer | connect_timeout)
        continue
        ;;
    esac
    if [[ -z "$out" ]]; then
      out="$part"
    else
      out="${out}&${part}"
    fi
  done

  if [[ -n "$out" ]]; then
    printf '%s?%s' "$base" "$out"
  else
    printf '%s' "$base"
  fi
}
