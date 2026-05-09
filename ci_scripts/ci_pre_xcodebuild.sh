#!/bin/sh
# Safety net: if Pods were not integrated (skipped post-clone, cache, or flaky run), install now.
set -eu

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
export HOMEBREW_NO_ANALYTICS=1
export COCOAPODS_DISABLE_STATS=true

SCRIPT_DIR="$(CDPATH= cd "$(dirname "$0")" && pwd)"
REPO_ROOT="${CI_PRIMARY_REPOSITORY_PATH:-$(cd "$SCRIPT_DIR/.." && pwd)}"
MOBILE_DIR="$REPO_ROOT/mobile"
IOS_DIR="$MOBILE_DIR/ios"
PODS_XCCONFIG="$IOS_DIR/Pods/Target Support Files/Pods-AltonMobile/Pods-AltonMobile.release.xcconfig"

if [ -f "$PODS_XCCONFIG" ]; then
  echo "==> ci_pre_xcodebuild: Pods already present"
  exit 0
fi

echo "==> ci_pre_xcodebuild: Pods missing, running install..."

if [ ! -d "$IOS_DIR" ]; then
  echo "error: expected iOS project at $IOS_DIR" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  brew install node
fi
if ! command -v bundle >/dev/null 2>&1; then
  gem install bundler --no-document 2>/dev/null || gem install bundler --user-install --no-document
  export PATH="$(ruby -e 'puts Gem.bindir'):$(ruby -e 'puts File.join(Gem.user_dir, "bin")'):$PATH"
fi

cd "$MOBILE_DIR"
npm ci
cd "$IOS_DIR"
bundle install
bundle exec pod install

if [ ! -f "$PODS_XCCONFIG" ]; then
  echo "error: pod install failed — still missing $PODS_XCCONFIG" >&2
  exit 1
fi
echo "==> ci_pre_xcodebuild OK"
