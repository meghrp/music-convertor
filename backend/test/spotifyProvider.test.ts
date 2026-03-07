import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetSpotifyTokenCacheForTest, searchSpotifyCandidates } from "../src/providers/spotify";
import type { CanonicalTrack, Env } from "../src/types";

const env: Env = {
  SPOTIFY_CLIENT_ID: "id",
  SPOTIFY_CLIENT_SECRET: "secret",
  APPLE_MUSIC_STOREFRONT: "us"
};

const sourceTrack: CanonicalTrack = {
  platform: "APPLE_MUSIC",
  trackId: "a1",
  title: "Bohemian Rhapsody",
  artist: "Queen",
  isrc: "GBUM71029604",
  durationMs: 354000,
  url: "https://music.apple.com/us/song/a1"
};

describe("spotify provider token cache", () => {
  beforeEach(() => {
    resetSpotifyTokenCacheForTest();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reuses cached spotify token across searches", async () => {
    const fetchMock = vi.fn(async (input: Parameters<typeof fetch>[0]) => {
      const url = String(input);
      if (url.includes("accounts.spotify.com")) {
        return new Response(JSON.stringify({ access_token: "abc", expires_in: 3600 }), { status: 200 });
      }
      return new Response(JSON.stringify({ tracks: { items: [] } }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock as typeof fetch);

    await searchSpotifyCandidates(env, sourceTrack);
    await searchSpotifyCandidates(env, sourceTrack);

    const tokenCalls = fetchMock.mock.calls.filter((call) => String(call[0]).includes("accounts.spotify.com")).length;
    expect(tokenCalls).toBe(1);
  });
});
