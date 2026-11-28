// Search-engine text for the theory pages, written from the real theory data
// so every key and scale page says exactly what's on it: its notes, chords and
// related keys. Also the full list of pages, for the sitemap.

import { SITE_URL } from "../siteUrl";
import {
    diatonicChords,
    ENHARMONIC_POS,
    keyName,
    pretty,
    relatedKeys,
    scaleOf,
    signatureOf,
    type KeyRef,
    type Mode,
} from "./keys";
import { buildScale, scaleKinds, type ScaleKind } from "./scales";
import { theoryPath } from "./urls";

const list = (items: string[]) => items.join(", ");
const titleCase = (text: string) => text.replace(/(^|\s)([a-z])/g, (_, space, ch) => space + ch.toUpperCase());

/**
 * Every key with its own page: 12 major and 12 minor, plus the second
 * spelling of the key at the bottom of the circle (F♯ major / D♯ minor).
 */
export function allKeys(): KeyRef[] {
    const modes: Mode[] = ["major", "minor"];
    return modes.flatMap((mode) => [
        ...Array.from({ length: 12 }, (_, pos) => ({ pos, mode, spelling: "flat" as const })),
        { pos: ENHARMONIC_POS, mode, spelling: "sharp" as const },
    ]);
}

/** The sentence-form summary of a key that also shows on the page. */
export function keySummary(key: KeyRef) {
    const notes = scaleOf(key).map((note) => pretty(note.name));
    const chords = diatonicChords(key, "triad").map((chord) => chord.name);
    const related = relatedKeys(key);
    const sig = signatureOf(key);
    const signature = sig.count === 0 ? "no sharps or flats" : `${sig.count} ${sig.type}${sig.count === 1 ? "" : "s"}`;
    return {
        notes,
        chords,
        signature,
        sentence:
            `The ${keyName(key)} scale is ${list(notes)}, with ${signature}. ` +
            `Its chords are ${list(chords)}. ` +
            `Its relative ${related.relative.mode} is ${keyName(related.relative)}.`,
    };
}

export function theorySeo(key: KeyRef, scale: ScaleKind | null) {
    const path = theoryPath(key, scale);
    const name = keyName(key);
    const { notes, chords, signature } = keySummary(key);

    let title: string;
    let description: string;
    let pageName: string;

    if (scale) {
        const built = buildScale(key, scale);
        const scaleName = built.title(pretty(scaleOf(key)[0].name));
        const scaleNotes = built.notes.map((note) => pretty(note.name));
        const positions = built.boxPcs.length;
        pageName = `${titleCase(scaleName)} Scale`;
        title = `${pageName}: Notes & Guitar Positions`;
        description =
            `The ${scaleName} scale is ${list(scaleNotes)}. ` +
            `See all ${positions} positions on the guitar neck, hear it played, and learn when to use it.`;
    } else {
        pageName = `${titleCase(name)} Scale`;
        title = `${pageName}: Notes, Chords, Progressions & Guitar`;
        description =
            `The ${name} scale is ${list(notes)} (${signature}). ` +
            `Its chords are ${list(chords)}. See progressions, related keys, and the scale, ` +
            `pentatonic and blues on the guitar neck, with every note playable.`;
    }

    // breadcrumbs: Music Theory > D minor > Blues
    const crumbs = [{ name: "Music Theory", path: "/theory" }];
    if (scale || path !== "/theory") crumbs.push({ name: titleCase(name), path: theoryPath(key) });
    if (scale) crumbs.push({ name: titleCase(buildScale(key, scale).title(pretty(scaleOf(key)[0].name))), path });

    const jsonLd = [
        {
            "@context": "https://schema.org",
            "@type": "LearningResource",
            name: pageName,
            headline: title,
            description,
            url: `${SITE_URL}${path}`,
            inLanguage: "en",
            learningResourceType: "Interactive resource",
            educationalLevel: "Beginner to intermediate",
            teaches: scale ? `${pageName} on guitar` : `The key of ${name}: scale, chords and progressions`,
            about: { "@type": "Thing", name: `${name} (music key)` },
            isAccessibleForFree: true,
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: crumbs.map((crumb, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: crumb.name,
                item: `${SITE_URL}${crumb.path}`,
            })),
        },
    ];

    return { path, title, description, jsonLd };
}

/** Every theory page: each key, and each scale on it. For the sitemap. */
export function allTheoryPaths() {
    return allKeys().flatMap((key) => [
        theoryPath(key),
        ...scaleKinds(key.mode).map((kind) => theoryPath(key, kind.id)),
    ]);
}
