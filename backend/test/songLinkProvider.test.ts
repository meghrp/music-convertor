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
});
