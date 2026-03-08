import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSpotifyTrack, resetSpotifyTokenCacheForTest, searchSpotifyCandidates } from "../src/providers/spotify";
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

  it("uses storefront as spotify market for track lookup", async () => {
    const fetchMock = vi.fn(async (input: Parameters<typeof fetch>[0]) => {
      const url = String(input);
      if (url.includes("accounts.spotify.com")) {
        return new Response(JSON.stringify({ access_token: "abc", expires_in: 3600 }), { status: 200 });
      }
      return new Response(
        JSON.stringify({
          id: "1",
          name: "Song",
          artists: [{ name: "Artist" }],
          duration_ms: 120000,
          external_urls: { spotify: "https://open.spotify.com/track/1" }
        }),
        { status: 200 }
      );
    });
    vi.stubGlobal("fetch", fetchMock as typeof fetch);

    await getSpotifyTrack(env, "1");

    const trackCall = fetchMock.mock.calls.find((call) => String(call[0]).includes("/v1/tracks/1"));
    expect(trackCall).toBeDefined();
    expect(String(trackCall?.[0])).toContain("market=US");
  });

  it("falls back to spotify open graph metadata when spotify api track lookup fails", async () => {
    const fetchMock = vi.fn(async (input: Parameters<typeof fetch>[0]) => {
      const url = String(input);
      if (url.includes("accounts.spotify.com")) {
        return new Response(JSON.stringify({ access_token: "abc", expires_in: 3600 }), { status: 200 });
      }
      if (url.includes("/v1/tracks/1ZUnkBd8RgXxaWkpci5jmh")) {
        return new Response("not found", { status: 404 });
      }
      if (url.includes("open.spotify.com/track/1ZUnkBd8RgXxaWkpci5jmh")) {
        return new Response(
          `<html><head>
          <meta property="og:title" content="TELL ME WHAT I DID" />
          <meta property="og:description" content="Tiffany Day · TELL ME WHAT I DID · Song · 2026" />
          <meta name="music:duration" content="154" />
          </head></html>`,
          { status: 200 }
        );
      }
      return new Response("{}", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock as typeof fetch);

    const track = await getSpotifyTrack(env, "1ZUnkBd8RgXxaWkpci5jmh");

    expect(track.title).toBe("TELL ME WHAT I DID");
    expect(track.artist).toBe("Tiffany Day");
    expect(track.durationMs).toBe(154000);
    expect(track.url).toBe("https://open.spotify.com/track/1ZUnkBd8RgXxaWkpci5jmh");
  });
});
