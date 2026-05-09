#!/bin/sh
# Xcode Cloud: install JS deps + CocoaPods before xcodebuild.
# Workspace in workflow may be ios/AltonMobile.xcworkspace (symlink → mobile/ios) or mobile/ios/AltonMobile.xcworkspace.
set -e

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
export HOMEBREW_NO_ANALYTICS=1

REPO_ROOT="${CI_PRIMARY_REPOSITORY_PATH:?CI_PRIMARY_REPOSITORY_PATH is unset}"
MOBILE_DIR="$REPO_ROOT/mobile"
IOS_DIR="$MOBILE_DIR/ios"

if [ ! -d "$IOS_DIR" ]; then
  echo "error: expected iOS project at $IOS_DIR" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Installing Node via Homebrew (required for React Native bundle step)..."
  brew install node
fi

cd "$MOBILE_DIR"
npm ci

cd "$IOS_DIR"
bundle install
bundle exec pod install
