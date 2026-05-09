#!/bin/sh
# Safety net: Pods (Debug + Release) перед xcodebuild.
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
DEBUG_FRAMEWORKS_LIST="$PODS_SUPPORT/Pods-AltonMobile-frameworks-Debug-input-files.xcfilelist"

if [ -f "$REPO_ROOT/.gitmodules" ] && [ ! -f "$IOS_DIR/Podfile" ]; then
  echo "==> Submodules: attempting init before Pod check..."
  git -C "$REPO_ROOT" submodule update --init --recursive
fi

pods_look_complete() {
  [ -f "$DEBUG_XCCONFIG" ] && [ -f "$RELEASE_XCCONFIG" ] && [ -f "$DEBUG_FRAMEWORKS_LIST" ]
}

if pods_look_complete; then
  echo "==> ci_pre_xcodebuild: Pods OK (debug+release + xcfilelists)"
  exit 0
fi

echo "==> ci_pre_xcodebuild: Pods incomplete or missing, running install..."

if [ ! -f "$IOS_DIR/Podfile" ]; then
  echo "error: Podfile not found at $IOS_DIR/Podfile" >&2
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
if ! bundle exec pod install; then
  bundle exec pod install --verbose
fi

if ! pods_look_complete; then
  echo "error: pod install failed — Pods still incomplete" >&2
  ls -la "$PODS_SUPPORT" 2>&1 || true
  exit 1
fi
echo "==> ci_pre_xcodebuild OK"
