#!/bin/bash
#
# ci_post_clone.sh — Xcode Cloud: подготовка React Native (Node, Yarn, зависимости JS, CocoaPods).
#
# Расположение: каталог ci_scripts рядом с *.xcworkspace / *.xcodeproj.
# В этом репозитории: mobile/ios/ci_scripts (в корне клона также доступно как ios/ci_scripts
# при симлинке ios → mobile/ios).
#
# Документация Apple: кастомные скрипты Xcode Cloud ищутся начиная с папки workspace
# и поднимаются к корню репозитория; первый найденный ci_scripts используется для этапа.
#

set -euo pipefail

# --- Окружение CI (стабильный PATH, UTF-8 для CocoaPods/Ruby, без интерактива) ---
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
export HOMEBREW_NO_ANALYTICS=1
export COCOAPODS_DISABLE_STATS=true
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export GIT_TERMINAL_PROMPT=0

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Каталог iOS-проекта (Podfile, *.xcworkspace) — родитель ci_scripts
IOS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Корень клона репозитория: в Xcode Cloud задаётся автоматически
if [[ -n "${CI_PRIMARY_REPOSITORY_PATH:-}" ]]; then
  REPO_ROOT="$CI_PRIMARY_REPOSITORY_PATH"
else
  # Локальный запуск: корень git от каталога ios
  REPO_ROOT="$(git -C "$IOS_DIR" rev-parse --show-toplevel)"
fi

echo "==> ci_post_clone: REPO_ROOT=$REPO_ROOT"
echo "==> ci_post_clone: IOS_DIR=$IOS_DIR"
echo "==> CI_PRIMARY_REPOSITORY_PATH=${CI_PRIMARY_REPOSITORY_PATH:-<unset>}"

# --- Подмодули (если mobile или другие части подключены как submodule) ---
if [[ -f "$REPO_ROOT/.gitmodules" ]]; then
  echo "==> Initializing git submodules..."
  git -C "$REPO_ROOT" submodule update --init --recursive
fi

# --- Где лежит React Native package.json: монорепозиторий vs отдельный mobile-репозиторий ---
if [[ -f "$REPO_ROOT/mobile/package.json" ]]; then
  MOBILE_DIR="$REPO_ROOT/mobile"
elif [[ -f "$REPO_ROOT/package.json" ]]; then
  MOBILE_DIR="$REPO_ROOT"
else
  echo "error: не найден package.json (ожидали \$REPO_ROOT/mobile или \$REPO_ROOT)" >&2
  exit 1
fi

if [[ ! -f "$IOS_DIR/Podfile" ]]; then
  echo "error: Podfile не найден: $IOS_DIR/Podfile" >&2
  exit 1
fi

# --- Node.js (нужен для react-native/scripts в Podfile и для фаз сборки Xcode) ---
if ! command -v node >/dev/null 2>&1; then
  echo "==> Устанавливаем Node.js через Homebrew..."
  brew install node
fi
node --version

# --- Yarn (по требованию CI; в репозитории также есть package-lock.json — yarn подхватит package.json) ---
if ! command -v yarn >/dev/null 2>&1; then
  echo "==> Включаем Corepack и активируем Yarn Classic (стабильно для RN)..."
  corepack enable
  corepack prepare yarn@1.22.22 --activate
fi
yarn --version

# --- JS-зависимости React Native ---
cd "$MOBILE_DIR"
echo "==> yarn install в $MOBILE_DIR"
yarn install --network-timeout 600000

# --- CocoaPods: версии из Gemfile / Gemfile.lock в ios ---
if ! command -v bundle >/dev/null 2>&1; then
  echo "==> Устанавливаем Bundler..."
  gem install bundler --no-document 2>/dev/null || gem install bundler --user-install --no-document
  export PATH="$(ruby -e 'puts Gem.bindir'):$(ruby -e 'puts File.join(Gem.user_dir, "bin")'):$PATH"
fi
bundle --version

cd "$IOS_DIR"
echo "==> bundle install в $IOS_DIR"
bundle install

echo "==> pod install в $IOS_DIR"
if ! bundle exec pod install; then
  echo "==> pod install завершился с ошибкой, повтор с --verbose"
  bundle exec pod install --verbose
fi

# --- Явный NODE_BINARY для Run Script фаз Xcode (файл в .gitignore) ---
NODE_BIN="$(command -v node)"
echo "export NODE_BINARY=${NODE_BIN}" >"$IOS_DIR/.xcode.env.local"
echo "==> записан .xcode.env.local с NODE_BINARY=$NODE_BIN"

# --- Проверка: после pod install должны существовать xcconfig и file lists (иначе Xcode ругается на отсутствующие *.xcfilelist) ---
PODS_SUPPORT="$IOS_DIR/Pods/Target Support Files/Pods-AltonMobile"
RELEASE_XCCONFIG="$PODS_SUPPORT/Pods-AltonMobile.release.xcconfig"
DEBUG_XCCONFIG="$PODS_SUPPORT/Pods-AltonMobile.debug.xcconfig"
RES_RELEASE_IN="$PODS_SUPPORT/Pods-AltonMobile-resources-Release-input-files.xcfilelist"
FW_RELEASE_OUT="$PODS_SUPPORT/Pods-AltonMobile-frameworks-Release-output-files.xcfilelist"

for f in "$RELEASE_XCCONFIG" "$DEBUG_XCCONFIG" "$RES_RELEASE_IN" "$FW_RELEASE_OUT"; do
  if [[ ! -f "$f" ]]; then
    echo "error: после pod install отсутствует ожидаемый файл CocoaPods: $f" >&2
    ls -la "$PODS_SUPPORT" 2>&1 || ls -la "$IOS_DIR/Pods" 2>&1 || true
    exit 1
  fi
done

echo "==> ci_post_clone OK (Pods-AltonMobile xcconfig + Release xcfilelists на месте)"
