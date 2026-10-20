export type Beat = {
    beatTitle: string,
    tagOne: string | null,
    tagTwo: string | null,
    mood: string | null,
    // bpm / key / mode are optional for references, required for beats
    bpm: number | null,
    key: "C" | "G" | "D" | "A" | "E" | "B" | "F♯" | "C♯" | "F" | "B♭" | "E♭" | "A♭" | null;
    mode: "Major" | "Minor" | "Harmonic Minor" | "Melodic Minor" | "Dorian" | "Phrygian" | "Lydian" | "Mixolydian" | "Locrian" | null;
    trackType: TrackType
    customTag: string | null,
    customTagColor: string | null,
    futureDestinations: FutureDestination[],
    createdAt: Date | string,
    updatedAt: Date | string,
    artworkUrl: string,
    // a track has an MP3, a WAV, or both (older tracks only have an MP3)
    mp3Url: string | null,
    wavUrl?: string | null,
    // optional stems zip (private; not signed or downloadable yet)
    stemsUrl?: string | null,
    stemsFileName?: string | null,
    stemsBytes?: number | null,
    id: string,
    rating: 0 | 1 | 2 | 3 | 4 | 5,
    notepad: string | null,
    // track length in seconds, saved when the MP3 is uploaded (older tracks may not have it)
    durationSeconds?: number | null

}
export type TrackType = 'Beat' | 'Reference'

export type FutureDestination =
    | "Soundcloud"
    | "Youtube"
    | "Pattsway"
     