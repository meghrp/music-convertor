# iOS App and iMessage Extension

This directory contains:

- Container iOS app target.
- iMessage extension target for link conversion.
- Shared parser utilities and tests.

## Prerequisites

- Xcode 15+
- XcodeGen (`brew install xcodegen`)

## Generate and Run

1. `cd ios`
2. `xcodegen generate`
3. Open `MusicConverter.xcodeproj` in Xcode.
4. Build the app and run the Messages extension scheme.

## Configuration

Set `BACKEND_BASE_URL` in `MessagesExtension/Resources/Info.plist` to your Worker URL.
