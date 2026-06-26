export type Beat = {
    beatTitle: string,
    tagOne: string | null,
    tagTwo: string | null,
    mood: string | null,
    bpm: number,
    key: "C" | "G" | "D" | "A" | "E" | "B" | "F♯" | "C♯" | "F" | "B♭" | "E♭" | "A♭";
    mode: "Major" | "Minor" | "Harmonic Minor" | "Melodic Minor" | "Dorian" | "Phrygian" | "Lydian" | "Mixolydian" | "Locrian";
    trackType: TrackType
    customTag: string | null,
    customTagColor: string | null,
    futureDestinations: string[],
    createdAt: Date | string,
    updatedAt: Date | string,
    artworkUrl: string,
    mp3Url: string,
    id: string,
    rating: 0 | 1 | 2 | 3 | 4 | 5,
    notepad: string | null

}
export type TrackType = 'Beat' | 'Reference'