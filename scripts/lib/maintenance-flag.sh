# Общая логика пути к флагу обслуживания (source из maintenance-on/off).

# Переопределение: MAINTENANCE_FLAG_FILE=/path/to/flag
krimvk_maintenance_flag_path() {
  local app_dir="$1"
  if [[ -n "${MAINTENANCE_FLAG_FILE:-}" ]]; then
    echo "$MAINTENANCE_FLAG_FILE"
    return 0
  fi
  if [[ -w "$app_dir" ]]; then
    echo "${app_dir}/.maintenance"
    return 0
  fi
  if touch "${app_dir}/.maintenance" 2>/dev/null; then
    rm -f "${app_dir}/.maintenance"
    echo "${app_dir}/.maintenance"
    return 0
  fi
  echo "/tmp/krimvk-maintenance"
}

krimvk_set_maintenance_env() {
  local mode="$1"
  local env_file="$2"
  if [[ ! -f "$env_file" ]]; then
    echo "WARN: $env_file not found — set MAINTENANCE_MODE=${mode} manually" >&2
    return 0
  fi
  if [[ ! -w "$env_file" ]]; then
    echo "WARN: cannot write $env_file — set MAINTENANCE_MODE=${mode} (e.g. sudo nano) or fix: sudo chown krimvk:krimvk $env_file" >&2
    return 0
  fi
  if grep -q '^MAINTENANCE_MODE=' "$env_file"; then
    sed -i "s/^MAINTENANCE_MODE=.*/MAINTENANCE_MODE=${mode}/" "$env_file"
  else
    echo "MAINTENANCE_MODE=${mode}" >> "$env_file"
  fi
}
