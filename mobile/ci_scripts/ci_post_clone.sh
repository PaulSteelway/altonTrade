#!/bin/sh
# Xcode Cloud when this folder is the Git repo root (отдельный mobile-репозиторий).
# Workspace в workflow: ios/AltonMobile.xcworkspace
set -eu

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
export HOMEBREW_NO_ANALYTICS=1
export COCOAPODS_DISABLE_STATS=true

SCRIPT_DIR="$(CDPATH= cd "$(dirname "$0")" && pwd)"
# Репозиторий = родитель ci_scripts (корень mobile-проекта).
REPO_ROOT="${CI_PRIMARY_REPOSITORY_PATH:-$(cd "$SCRIPT_DIR/.." && pwd)}"
MOBILE_DIR="$REPO_ROOT"
IOS_DIR="$REPO_ROOT/ios"
PODS_XCCONFIG="$IOS_DIR/Pods/Target Support Files/Pods-AltonMobile/Pods-AltonMobile.release.xcconfig"

echo "==> ci_post_clone (standalone mobile repo): REPO_ROOT=$REPO_ROOT"

if [ ! -d "$IOS_DIR" ]; then
  echo "error: expected iOS project at $IOS_DIR" >&2
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
bundle exec pod install

if [ ! -f "$PODS_XCCONFIG" ]; then
  echo "error: pod install did not produce $PODS_XCCONFIG" >&2
  ls -la "$IOS_DIR/Pods/Target Support Files/Pods-AltonMobile" 2>&1 || true
  exit 1
fi

echo "==> ci_post_clone OK (Pods present)"
