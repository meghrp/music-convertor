import { afterEach, describe, expect, it, vi } from "vitest";
import { searchAppleCandidates } from "../src/providers/appleMusic";
import type { CanonicalTrack } from "../src/types";

describe("apple music provider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to apple music web search when iTunes API misses a song", async () => {
    const source: CanonicalTrack = {
      platform: "SPOTIFY",
      trackId: "1ZUnkBd8RgXxaWkpci5jmh",
      title: "TELL ME WHAT I DID",
      artist: "Tiffany Day",
      durationMs: 154000,
      url: "https://open.spotify.com/track/1ZUnkBd8RgXxaWkpci5jmh"
    };

    const fetchMock = vi.fn(async (input: Parameters<typeof fetch>[0]) => {
      const url = String(input);
      if (url.includes("itunes.apple.com/search")) {
        return new Response(JSON.stringify({ resultCount: 0, results: [] }), { status: 200 });
      }
      if (url.includes("music.apple.com/us/search")) {
        return new Response(
          `<a href="https://music.apple.com/us/album/tell-me-what-i-did/1863816388?i=1863816389" aria-label="TELL ME WHAT I DID · Song · Tiffany Day"></a>`,
          { status: 200 }
        );
      }
      return new Response("{}", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock as typeof fetch);

    const candidates = await searchAppleCandidates(source, "us");

    expect(candidates.some((c) => c.trackId === "1863816389")).toBe(true);
    const match = candidates.find((c) => c.trackId === "1863816389");
    expect(match?.title).toBe("TELL ME WHAT I DID");
    expect(match?.artist).toBe("Tiffany Day");
    expect(match?.url).toContain("music.apple.com/us/album/tell-me-what-i-did/1863816388?i=1863816389");
  });
});
