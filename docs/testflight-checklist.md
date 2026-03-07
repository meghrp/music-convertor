# TestFlight Readiness Checklist

This checklist is tuned to this repository (`ios/` + iMessage extension) and can be used as a release gate before TestFlight uploads.

## 1) App Icons and Assets

- [ ] Add an asset catalog containing `AppIcon.appiconset` for the app target.
- [ ] Ensure all required iPhone/iPad icon sizes are present (including App Store 1024x1024).
- [ ] Verify extension visual assets (if any) are included and load on device.

Current repo status:
- `AppIcon.appiconset` now exists under `ios/App/Resources/Assets.xcassets`.

## 2) Privacy and Metadata

- [ ] Keep `CFBundleDisplayName` and `NSExtension` keys present in `ios/MessagesExtension/Resources/Info.plist`.
- [ ] Add `NS*UsageDescription` privacy strings only when APIs requiring them are used (camera, microphone, photos, etc.).
- [ ] Add `PrivacyInfo.xcprivacy` if required-reason APIs or third-party SDK requirements apply.
- [ ] Confirm App Store Connect privacy questionnaire matches app behavior.

Current repo status:
- No direct usage of privacy-string-triggering frameworks detected in current iOS sources.

## 3) Bundle Naming and Versioning

- [ ] Keep production bundle IDs stable in `ios/project.yml`:
  - App: `dev.megh.musicconverter`
  - Extension: `dev.megh.musicconverter.messages`
- [ ] Keep extension ID namespaced under app ID (`<app-bundle-id>.<suffix>`).
- [ ] Keep app and extension versions/build numbers aligned:
  - `CFBundleShortVersionString`
  - `CFBundleVersion`

## 4) Release Configuration

- [ ] Keep signing settings in `ios/project.yml` (not Xcode UI only).
- [ ] Ensure shared scheme archives in `Release` config.
- [ ] Set `BACKEND_BASE_URL` in extension Info.plist to the production Worker URL (HTTPS).
- [ ] Generate the project before release builds:
  - `cd ios && xcodegen generate`
- [ ] Produce a signed archive and validate upload from Xcode Organizer or CI.

## 5) Pre-Upload Validation Commands

From repo root:

```bash
scripts/ci/testflight-readiness.sh
```

From iOS directory:

```bash
xcodegen generate
xcodebuild -project MusicConverter.xcodeproj -scheme MusicConverterApp \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.3.1' \
  -configuration Debug CODE_SIGNING_ALLOWED=NO build
```

For device/archive validation (example):

```bash
xcodebuild -project ios/MusicConverter.xcodeproj -scheme MusicConverterApp \
  -destination 'id=<DEVICE_ID>' -configuration Debug -allowProvisioningUpdates build
```

## 6) GitHub Actions and Releases Integration

This repo now includes:

- `.github/workflows/testflight-readiness.yml`
  - Runs readiness checks on pull requests and manual dispatch.
- `.github/workflows/ios-release-build.yml`
  - Generates Xcode project and builds `Release` configuration for simulator (unsigned).
- `.github/workflows/release-checklist-asset.yml`
  - On GitHub Release publish, uploads this checklist as a release asset.

Recommended release flow:

1. Open PR and pass `TestFlight Readiness` workflow.
2. Merge and create/publish GitHub Release.
3. Confirm `testflight-checklist.md` is attached to the release.
4. Archive and upload build to TestFlight.
