import type { Beat } from "../lib/types/Beats";
import { authorizedFetch } from "./Fetchers/authorizedFetch";

// "all" is every saved file in one zip
export type BeatFileKind = "artwork" | "mp3" | "wav" | "stems" | "all";

const extensions: Record<BeatFileKind, string> = {
    // artwork is stored as WebP
    artwork: "webp",
    mp3: "mp3",
    wav: "wav",
    stems: "zip",
    all: "zip",
};

// "My Beat: v2" -> "My Beat v2", same cleanup the backend does
function safeFileName(name: string): string {
    return name
        .replace(/[\\/:*?"<>|\r\n]+/g, " ")
        .replace(/\s+/g, " ")
        .trim() || "track";
}

export function beatFileName(beat: Beat, kind: BeatFileKind): string {
    // stems keep the name they were uploaded with
    if (kind === "stems" && beat.stemsFileName) {
        return safeFileName(beat.stemsFileName);
    }

    return `${safeFileName(beat.beatTitle)}.${extensions[kind]}`;
}

/*
 * Downloads one of a track's saved files (or all of them, zipped) through
 * the secure backend route (GET /secure/beats/download-<kind>/:beatId).
 */
export async function downloadBeatFile(beat: Beat, kind: BeatFileKind) {
    const blob = await authorizedFetch<Blob>(
        `/secure/beats/download-${kind}/${beat.id}`,
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = beatFileName(beat, kind);

    document.body.appendChild(link);
    link.click();
    link.remove();

    // revoking right away can cancel the save in some browsers
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
