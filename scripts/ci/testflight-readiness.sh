#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
PROJECT_YML="$ROOT_DIR/ios/project.yml"
APP_PLIST="$ROOT_DIR/ios/App/Resources/Info.plist"
EXT_PLIST="$ROOT_DIR/ios/MessagesExtension/Resources/Info.plist"
SCHEME_FILE="$ROOT_DIR/ios/MusicConverter.xcodeproj/xcshareddata/xcschemes/MusicConverterApp.xcscheme"

failures=0
warnings=0

log_ok() {
  echo "[OK] $1"
}

log_warn() {
  echo "[WARN] $1"
  warnings=$((warnings + 1))
}

log_fail() {
  echo "[FAIL] $1"
  failures=$((failures + 1))
}

plist_value() {
  /usr/libexec/PlistBuddy -c "Print :$2" "$1" 2>/dev/null || true
}

require_file() {
  if [[ ! -f "$1" ]]; then
    log_fail "Missing required file: $1"
  else
    log_ok "Found $1"
  fi
}

echo "Running TestFlight readiness checks in $ROOT_DIR"

require_file "$PROJECT_YML"
require_file "$APP_PLIST"
require_file "$EXT_PLIST"
require_file "$SCHEME_FILE"

app_bundle_id="$(rg -N "PRODUCT_BUNDLE_IDENTIFIER:" "$PROJECT_YML" | sed -n '1p' | awk '{print $2}')"
ext_bundle_id="$(rg -N "PRODUCT_BUNDLE_IDENTIFIER:" "$PROJECT_YML" | sed -n '2p' | awk '{print $2}')"

if [[ -z "$app_bundle_id" ]]; then
  log_fail "Unable to parse app bundle ID from ios/project.yml"
elif [[ "$app_bundle_id" == com.example.* ]]; then
  log_fail "App bundle ID is still a placeholder: $app_bundle_id"
else
  log_ok "App bundle ID looks set: $app_bundle_id"
fi

if [[ -z "$ext_bundle_id" ]]; then
  log_fail "Unable to parse extension bundle ID from ios/project.yml"
elif [[ "$ext_bundle_id" == com.example.* ]]; then
  log_fail "Extension bundle ID is still a placeholder: $ext_bundle_id"
else
  log_ok "Extension bundle ID looks set: $ext_bundle_id"
fi

if [[ -n "$app_bundle_id" && -n "$ext_bundle_id" ]]; then
  if [[ "$ext_bundle_id" == "$app_bundle_id".* ]]; then
    log_ok "Extension bundle ID is namespaced under app bundle ID"
  else
    log_fail "Extension bundle ID should be prefixed by app bundle ID ($app_bundle_id.*)"
  fi
fi

team_id="$(rg -N "DEVELOPMENT_TEAM:" "$PROJECT_YML" | sed -n '1p' | awk '{print $2}')"
if [[ -z "$team_id" || "$team_id" == "" ]]; then
  log_fail "DEVELOPMENT_TEAM is missing in ios/project.yml"
else
  log_ok "DEVELOPMENT_TEAM is set: $team_id"
fi

app_version="$(plist_value "$APP_PLIST" "CFBundleShortVersionString")"
ext_version="$(plist_value "$EXT_PLIST" "CFBundleShortVersionString")"
app_build="$(plist_value "$APP_PLIST" "CFBundleVersion")"
ext_build="$(plist_value "$EXT_PLIST" "CFBundleVersion")"

if [[ -z "$app_version" || -z "$app_build" ]]; then
  log_fail "App Info.plist is missing CFBundleShortVersionString or CFBundleVersion"
else
  log_ok "App version/build: $app_version ($app_build)"
fi

if [[ -z "$ext_version" || -z "$ext_build" ]]; then
  log_fail "Extension Info.plist is missing CFBundleShortVersionString or CFBundleVersion"
else
  log_ok "Extension version/build: $ext_version ($ext_build)"
fi

if [[ -n "$app_version" && -n "$ext_version" && "$app_version" != "$ext_version" ]]; then
  log_fail "App and extension marketing versions do not match ($app_version vs $ext_version)"
fi

if [[ -n "$app_build" && -n "$ext_build" && "$app_build" != "$ext_build" ]]; then
  log_fail "App and extension build numbers do not match ($app_build vs $ext_build)"
fi

bundle_display_name="$(plist_value "$EXT_PLIST" "CFBundleDisplayName")"
ext_point="$(plist_value "$EXT_PLIST" "NSExtension:NSExtensionPointIdentifier")"
if [[ -z "$bundle_display_name" ]]; then
  log_fail "Messages extension CFBundleDisplayName is missing"
else
  log_ok "Messages extension display name is set"
fi

if [[ "$ext_point" == "com.apple.message-payload-provider" ]]; then
  log_ok "NSExtensionPointIdentifier is configured for iMessage"
else
  log_fail "Unexpected NSExtensionPointIdentifier: '$ext_point'"
fi

backend_url="$(plist_value "$EXT_PLIST" "BACKEND_BASE_URL")"
if [[ -z "$backend_url" ]]; then
  log_fail "BACKEND_BASE_URL is missing in extension Info.plist"
elif [[ "$backend_url" =~ ^https:// ]]; then
  log_ok "BACKEND_BASE_URL uses HTTPS"
else
  log_fail "BACKEND_BASE_URL must use HTTPS for production/TestFlight"
fi

app_icon_file="$(find "$ROOT_DIR/ios" -type f -path '*AppIcon*.appiconset/Contents.json' | head -n 1 || true)"
if [[ -n "$app_icon_file" ]]; then
  log_ok "Found app icon asset catalog: $app_icon_file"
else
  log_fail "No AppIcon asset catalog found (required for App Store/TestFlight)"
fi

privacy_manifest_file="$(find "$ROOT_DIR/ios" -type f -name 'PrivacyInfo.xcprivacy' | head -n 1 || true)"
if [[ -n "$privacy_manifest_file" ]]; then
  log_ok "Found privacy manifest: $privacy_manifest_file"
else
  log_warn "No PrivacyInfo.xcprivacy found. Add one if you include required-reason APIs or SDKs that require it."
fi

if perl -0777 -ne 'exit((/<ArchiveAction\b[^>]*\bbuildConfiguration = "Release"/s) ? 0 : 1)' "$SCHEME_FILE"; then
  log_ok "Scheme archive action uses Release configuration"
else
  log_fail "Shared scheme archive action is not set to Release"
fi

if (( failures > 0 )); then
  echo
  echo "TestFlight readiness check failed with $failures failure(s) and $warnings warning(s)."
  exit 1
fi

echo
echo "TestFlight readiness check passed with $warnings warning(s)."
