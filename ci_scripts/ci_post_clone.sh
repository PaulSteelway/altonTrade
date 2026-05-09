#!/bin/sh
# Xcode Cloud (монорепозиторий): JS deps + CocoaPods. Подтягивает submodule mobile при наличии .gitmodules.
# Workspace: ios/AltonMobile.xcworkspace (symlink → mobile/ios).
set -eu

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
export HOMEBREW_NO_ANALYTICS=1
export COCOAPODS_DISABLE_STATS=true
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export GIT_TERMINAL_PROMPT=0

SCRIPT_DIR="$(CDPATH= cd "$(dirname "$0")" && pwd)"
REPO_ROOT="${CI_PRIMARY_REPOSITORY_PATH:-$(cd "$SCRIPT_DIR/.." && pwd)}"
MOBILE_DIR="$REPO_ROOT/mobile"
IOS_DIR="$MOBILE_DIR/ios"
PODS_SUPPORT="$IOS_DIR/Pods/Target Support Files/Pods-AltonMobile"
DEBUG_XCCONFIG="$PODS_SUPPORT/Pods-AltonMobile.debug.xcconfig"
RELEASE_XCCONFIG="$PODS_SUPPORT/Pods-AltonMobile.release.xcconfig"

echo "==> ci_post_clone: REPO_ROOT=$REPO_ROOT"

if [ -f "$REPO_ROOT/.gitmodules" ]; then
  echo "==> Initializing git submodules (mobile как отдельный submodule)..."
  git -C "$REPO_ROOT" submodule update --init --recursive
fi

if [ ! -f "$IOS_DIR/Podfile" ]; then
  echo "error: Podfile not found at $IOS_DIR/Podfile (проверьте submodule mobile)" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "==> Installing Node via Homebrew (React Native bundle step)..."
  brew install node
fi
node --version

if ! command -v bundle >/dev/null 2>&1; then
  echo "==> Installing Bundler (CocoaPods via Gemfile)..."
  gem install bundler --no-document 2>/dev/null || gem install bundler --user-install --no-document
  export PATH="$(ruby -e 'puts Gem.bindir'):$(ruby -e 'puts File.join(Gem.user_dir, "bin")'):$PATH"
fi
bundle --version

cd "$MOBILE_DIR"
echo "==> npm ci in $MOBILE_DIR"
npm ci

cd "$IOS_DIR"
echo "==> bundle install in $IOS_DIR"
bundle install
echo "==> pod install in $IOS_DIR"
if ! bundle exec pod install; then
  echo "==> pod install failed, retry with --verbose"
  bundle exec pod install --verbose
fi

if [ ! -f "$DEBUG_XCCONFIG" ] || [ ! -f "$RELEASE_XCCONFIG" ]; then
  echo "error: pod install did not produce Debug/Release xcconfigs" >&2
  ls -la "$PODS_SUPPORT" 2>&1 || ls -la "$IOS_DIR/Pods" 2>&1 || true
  exit 1
fi

echo "==> ci_post_clone OK (Pods debug+release present)"
