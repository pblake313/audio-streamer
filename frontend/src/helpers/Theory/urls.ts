// Theory page addresses. Every key and every scale on it has its own real
// page, so each can be linked to and found in search:
//
//   /theory                  C major (the landing page)
//   /theory/d-minor          a key
//   /theory/d-minor/blues    a scale built on that key (the "Scales" section)
//
// Positions (?position=2) and sections (#guitar) stay as UI state on top.

import { keySlug, type KeyRef } from "./keys";
import { scaleSlug, type ScaleKind } from "./scales";

export const DEFAULT_KEY: KeyRef = { pos: 0, mode: "major", spelling: "flat" };

export const isDefaultKey = (key: KeyRef) => key.pos === DEFAULT_KEY.pos && key.mode === DEFAULT_KEY.mode;

export const sameKey = (a: KeyRef, b: KeyRef) => a.pos === b.pos && a.mode === b.mode && a.spelling === b.spelling;

/** The canonical path for a key, or a scale on it. C major on its own is just /theory. */
export function theoryPath(key: KeyRef, scale: ScaleKind | null = null) {
    if (!scale && isDefaultKey(key)) return "/theory";
    return `/theory/${keySlug(key)}${scale ? `/${scaleSlug(scale)}` : ""}`;
}
