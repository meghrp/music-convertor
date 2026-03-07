import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveViaSongLink } from "../src/providers/songLink";

describe("songLink provider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns target url for requested platform", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            linksByPlatform: {
              spotify: { url: "https://open.spotify.com/track/abc" },
              appleMusic: { url: "https://music.apple.com/us/album/x?i=y" }
            }
          }),
          { status: 200 }
        );
      }) as typeof fetch
    );

    const target = await resolveViaSongLink("https://open.spotify.com/track/abc", "APPLE_MUSIC");
    expect(target).toContain("music.apple.com");
  });

  it("normalizes geo apple music urls", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            linksByPlatform: {
              appleMusic: {
                url: "https://geo.music.apple.com/ca/album/_/1710685602?i=1710685974&mt=1&app=music&ls=1&at=1000lHKX&ct=api_http&itscg=30200&itsct=odsl_m"
              }
            }
          }),
          { status: 200 }
        );
      }) as typeof fetch
    );

    const target = await resolveViaSongLink("https://open.spotify.com/track/abc", "APPLE_MUSIC");
    expect(target).toBe("https://music.apple.com/ca/album/_/1710685602?i=1710685974");
  });
});
