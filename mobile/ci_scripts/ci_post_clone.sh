#!/usr/bin/env bash
# Xcode Cloud: корень клона = отдельный mobile-репозиторий (package.json в корне).
# Workspace в workflow: ios/AltonMobile.xcworkspace
# См. ios/ci_scripts/ci_post_clone.sh — та же логика Node / npm ci (без Homebrew на CI).
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export HOMEBREW_NO_ANALYTICS=1
export HOMEBREW_NO_INSTALL_CLEANUP=1
export COCOAPODS_DISABLE_STATS=true
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export GIT_TERMINAL_PROMPT=0
export NPM_CONFIG_FETCH_TIMEOUT="${NPM_CONFIG_FETCH_TIMEOUT:-600000}"

CI_NODE_VERSION="${CI_NODE_VERSION:-20.18.1}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${CI_PRIMARY_REPOSITORY_PATH:-$(cd "$SCRIPT_DIR/.." && pwd)}"
MOBILE_DIR="$REPO_ROOT"
IOS_DIR="$REPO_ROOT/ios"
PODS_SUPPORT="$IOS_DIR/Pods/Target Support Files/Pods-AltonMobile"
DEBUG_XCCONFIG="$PODS_SUPPORT/Pods-AltonMobile.debug.xcconfig"
RELEASE_XCCONFIG="$PODS_SUPPORT/Pods-AltonMobile.release.xcconfig"

echo "==> ci_post_clone (standalone mobile repo): REPO_ROOT=$REPO_ROOT"
echo "==> CI_PRIMARY_REPOSITORY_PATH=${CI_PRIMARY_REPOSITORY_PATH:-<unset>}"

if [ ! -f "$IOS_DIR/Podfile" ]; then
  echo "error: Podfile not found at $IOS_DIR/Podfile" >&2
  exit 1
fi

install_node_from_nodejs_org() {
  local arch
  case "$(uname -m)" in
    arm64) arch=arm64 ;;
    x86_64) arch=x64 ;;
    *) echo "error: unsupported architecture: $(uname -m)" >&2; exit 1 ;;
  esac
  local name="node-v${CI_NODE_VERSION}-darwin-${arch}"
  local url="https://nodejs.org/dist/v${CI_NODE_VERSION}/${name}.tar.gz"
  local root="${TMPDIR:-/tmp}/ci-node-${CI_NODE_VERSION}-$$"
  mkdir -p "$root"
  echo "==> Downloading Node.js v${CI_NODE_VERSION} from nodejs.org (no Homebrew)..."
  curl -fsSL "$url" -o "$root/node.tgz"
  tar -xzf "$root/node.tgz" -C "$root"
  export PATH="$root/${name}/bin:$PATH"
  hash -r
}

ensure_node() {
  if command -v node >/dev/null 2>&1; then
    return 0
  fi
  if command -v brew >/dev/null 2>&1; then
    echo "==> Installing Node.js via Homebrew..."
    brew install node
    hash -r
    return 0
  fi
  install_node_from_nodejs_org
}

ensure_node
node --version
command -v npm >/dev/null 2>&1 || {
  echo "error: npm not found after Node install" >&2
  exit 1
}

cd "$MOBILE_DIR"
if [ ! -f "$MOBILE_DIR/package-lock.json" ]; then
  echo "error: package-lock.json required for npm ci: $MOBILE_DIR/package-lock.json" >&2
  exit 1
fi
echo "==> npm ci in $MOBILE_DIR"
npm ci --no-audit --no-fund

if ! command -v bundle >/dev/null 2>&1; then
  echo "==> Installing Bundler..."
  gem install bundler --no-document 2>/dev/null || gem install bundler --user-install --no-document
  export PATH="$(ruby -e 'puts Gem.bindir'):$(ruby -e 'puts File.join(Gem.user_dir, "bin")'):$PATH"
fi
bundle --version

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
  echo "  expected: $DEBUG_XCCONFIG" >&2
  echo "  expected: $RELEASE_XCCONFIG" >&2
  ls -la "$PODS_SUPPORT" 2>&1 || ls -la "$IOS_DIR/Pods" 2>&1 || true
  exit 1
fi

echo "==> ci_post_clone OK (Pods debug+release present)"
