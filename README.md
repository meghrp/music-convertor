# Music Converter

iOS + Cloudflare Workers app for converting Apple Music track links to Spotify and Spotify track links to Apple Music.

## Repository Layout

- `ios/` iOS container app and iMessage extension.
- `backend/` Cloudflare Worker conversion API.
- `docs/` implementation and architecture notes.

## Getting Started

1. `cd backend && npm install`
2. Configure Worker secrets with `wrangler secret put ...` (see `backend/README.md`).
3. Run backend locally with `npm run dev`.
4. `cd ios && xcodegen generate`.
5. Open `ios/MusicConverter.xcodeproj` and run the app + Messages extension.
6. Set `BACKEND_BASE_URL` in `ios/MessagesExtension/Resources/Info.plist` to your Worker URL.

Detailed setup is documented in `docs/architecture.md` and `backend/README.md`.

## Release Readiness

- Run `scripts/ci/testflight-readiness.sh` before cutting a TestFlight build.
- Follow `docs/testflight-checklist.md` for packaging, privacy, and release steps.
