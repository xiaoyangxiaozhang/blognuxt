#!/usr/bin/env bash

set -Eeuo pipefail

APP_ROOT="${1:?用法: activate.sh <app-root> <release-id>}"
RELEASE_ID="${2:?用法: activate.sh <app-root> <release-id>}"
SERVICE_NAME="${SERVICE_NAME:-blognuxt}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
SYSTEMCTL_BIN="${SYSTEMCTL_BIN:-/usr/bin/systemctl}"

if [[ "$APP_ROOT" != /* || "$APP_ROOT" == "/" || "$APP_ROOT" == *..* ]]; then
  echo "APP_ROOT 必须是安全的绝对路径（不能是 / 或包含 ..）: $APP_ROOT" >&2
  exit 2
fi

if [[ ! "$RELEASE_ID" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "非法 release id: $RELEASE_ID" >&2
  exit 2
fi

if [[ ! "$KEEP_RELEASES" =~ ^[1-9][0-9]*$ ]]; then
  echo "KEEP_RELEASES 必须是正整数" >&2
  exit 2
fi

RELEASE_DIR="$APP_ROOT/releases/$RELEASE_ID"
CURRENT_LINK="$APP_ROOT/current"

if [[ ! -d "$APP_ROOT/releases" ]]; then
  echo "找不到 release 目录: $APP_ROOT/releases" >&2
  exit 1
fi

if [[ -e "$CURRENT_LINK" && ! -L "$CURRENT_LINK" ]]; then
  echo "current 必须是软链接或不存在: $CURRENT_LINK" >&2
  exit 1
fi

if [[ ! -f "$RELEASE_DIR/.output/server/index.mjs" ]]; then
  echo "找不到 Nuxt 生产入口: $RELEASE_DIR/.output/server/index.mjs" >&2
  exit 1
fi

previous_target=""
if [[ -L "$CURRENT_LINK" ]]; then
  previous_target="$(readlink -f "$CURRENT_LINK" || true)"
fi

rollback() {
  echo "发布健康检查失败，开始回滚..." >&2

  if [[ -n "$previous_target" && -d "$previous_target" ]]; then
    ln -sfn "$previous_target" "$CURRENT_LINK"
  else
    rm -f -- "$CURRENT_LINK"
  fi

  sudo -n "$SYSTEMCTL_BIN" restart "$SERVICE_NAME" || true
}

ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"

if ! sudo -n "$SYSTEMCTL_BIN" restart "$SERVICE_NAME"; then
  rollback
  exit 1
fi

healthy=false
for attempt in {1..20}; do
  if curl --fail --silent --show-error --max-time 3 "$HEALTH_URL" >/dev/null; then
    healthy=true
    break
  fi
  sleep 1
done

if [[ "$healthy" != true ]]; then
  rollback
  exit 1
fi

echo "发布成功: $RELEASE_ID"

# 只清理旧 release 目录，保留当前版本和最近的几个版本用于回滚。
mapfile -t old_releases < <(
  find "$APP_ROOT/releases" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
    | sort -nr \
    | tail -n +$((KEEP_RELEASES + 1)) \
    | cut -d' ' -f2-
)

for old_release in "${old_releases[@]}"; do
  [[ -n "$old_release" ]] || continue
  [[ "$old_release" != "$RELEASE_DIR" ]] || continue
  rm -rf -- "$old_release"
done
