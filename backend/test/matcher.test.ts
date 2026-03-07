import { describe, expect, it } from "vitest";
import { matchCandidate } from "../src/matcher";
import type { CandidateTrack, CanonicalTrack } from "../src/types";

const baseSource: CanonicalTrack = {
  platform: "SPOTIFY",
  trackId: "source",
  title: "Bohemian Rhapsody",
  artist: "Queen",
  isrc: "GBUM71029604",
  durationMs: 354000,
  url: "https://open.spotify.com/track/source"
};

describe("matchCandidate", () => {
  it("uses isrc when available", () => {
    const candidates: CandidateTrack[] = [
      {
        trackId: "apple-1",
        title: "Bohemian Rhapsody",
        artist: "Queen",
        isrc: "GBUM71029604",
        durationMs: 354000,
        url: "https://music.apple.com/us/song/1"
      }
    ];

    const match = matchCandidate(baseSource, candidates);
    expect(match.matchedBy).toBe("ISRC");
    expect(match.target.trackId).toBe("apple-1");
  });

  it("falls back to fuzzy matching", () => {
    const candidates: CandidateTrack[] = [
      {
        trackId: "apple-2",
        title: "Bohemian Rhapsody - Remastered",
        artist: "Queen",
        durationMs: 355000,
        url: "https://music.apple.com/us/song/2"
      },
      {
        trackId: "apple-3",
        title: "Different Song",
        artist: "Someone Else",
        durationMs: 120000,
        url: "https://music.apple.com/us/song/3"
      }
    ];

    const match = matchCandidate({ ...baseSource, isrc: undefined }, candidates);
    expect(match.matchedBy).toBe("FUZZY");
    expect(match.target.trackId).toBe("apple-2");
  });
});
