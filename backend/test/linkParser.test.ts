import { describe, expect, it } from "vitest";
import { parseSourceLink } from "../src/linkParser";

describe("parseSourceLink", () => {
  it("parses a spotify track link", () => {
    const parsed = parseSourceLink("https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC");
    expect(parsed.platform).toBe("SPOTIFY");
    expect(parsed.trackId).toBe("4uLU6hMCjMI75M1A2tKUQC");
  });

  it("parses an apple music song link with query id", () => {
    const parsed = parseSourceLink("https://music.apple.com/us/album/bohemian-rhapsody/1440807861?i=1440807871");
    expect(parsed.platform).toBe("APPLE_MUSIC");
    expect(parsed.storefront).toBe("us");
    expect(parsed.trackId).toBe("1440807871");
  });

  it("rejects spotify album links", () => {
    expect(() => parseSourceLink("https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy")).toThrowError(
      "Only Spotify track links are supported."
    );
  });
});
