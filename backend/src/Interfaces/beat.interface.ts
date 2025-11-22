
export interface Beat {
    artworkUrl: string;
    beatTitle: string;
    bpm: number;
    id?: string;
    key: "C" | "G" | "D" | "A" | "E" | "B" | "F♯" | "C♯" | "F" | "B♭" | "E♭" | "A♭";
    mode: "Major" | "Minor" | "Harmonic Minor" | "Melodic Minor" | "Dorian" | "Phrygian" | "Lydian" | "Mixolydian" | "Locrian";
    mood: string | null;
    mp3previewUrl: string;
    tagOne: string | null;
    tagTwo: string | null;
    uploadDate: Date
    notepad: string | null
    rating: 0 | 1 | 2 | 3 | 4 | 5
    customTagColor?: string | null
    customTag?: string | null
    futureDestinations?: string[]
}
