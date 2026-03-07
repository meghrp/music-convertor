import { AppError } from "./errors";
import type { CandidateTrack, CanonicalTrack } from "./types";

export interface MatchResult {
  target: CandidateTrack;
  matchedBy: "ISRC" | "FUZZY";
  confidence: number;
}

export function matchCandidate(source: CanonicalTrack, candidates: CandidateTrack[]): MatchResult {
  if (candidates.length === 0) {
    throw new AppError("NO_MATCH", "No track match was found.", 404);
  }

  if (source.isrc) {
    const byIsrc = candidates.find((candidate) => candidate.isrc && candidate.isrc === source.isrc);
    if (byIsrc) {
      return {
        target: byIsrc,
        matchedBy: "ISRC",
        confidence: 0.99
      };
    }
  }

  const scored = candidates.map((candidate) => ({
    candidate,
    score: fuzzyScore(source, candidate)
  }));
  scored.sort((a, b) => b.score - a.score || (b.candidate.popularity ?? 0) - (a.candidate.popularity ?? 0));

  const best = scored[0];
  const second = scored[1];
  if (!best || best.score < 0.45) {
    throw new AppError("NO_MATCH", "No confident fuzzy match was found.", 404);
  }

  if (second && best.score - second.score < 0.03 && normalizedArtist(best.candidate.artist) !== normalizedArtist(second.candidate.artist)) {
    throw new AppError("AMBIGUOUS_MATCH", "Multiple likely matches found.", 409);
  }

  return {
    target: best.candidate,
    matchedBy: "FUZZY",
    confidence: Number(Math.min(best.score, 0.95).toFixed(2))
  };
}

function fuzzyScore(source: CanonicalTrack, candidate: CandidateTrack): number {
  const titleScore = overlap(normalize(source.title), normalize(candidate.title));
  const artistScore = overlap(normalize(source.artist), normalize(candidate.artist));
  const durationScore = durationCloseness(source.durationMs, candidate.durationMs);
  return titleScore * 0.5 + artistScore * 0.35 + durationScore * 0.15;
}

function normalize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function normalizedArtist(value: string): string {
  return normalize(value).join(" ");
}

function overlap(left: string[], right: string[]): number {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  let intersection = 0;
  for (const token of leftSet) {
    if (rightSet.has(token)) {
      intersection += 1;
    }
  }
  const union = new Set([...leftSet, ...rightSet]).size;
  return union > 0 ? intersection / union : 0;
}

function durationCloseness(sourceMs?: number, candidateMs?: number): number {
  if (!sourceMs || !candidateMs) {
    return 0.5;
  }
  const diffSeconds = Math.abs(sourceMs - candidateMs) / 1000;
  if (diffSeconds <= 2) return 1;
  if (diffSeconds <= 5) return 0.8;
  if (diffSeconds <= 10) return 0.6;
  if (diffSeconds <= 20) return 0.4;
  return 0.1;
}
