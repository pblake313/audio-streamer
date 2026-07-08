import { derived, get, writable } from "svelte/store";
import type { Beat } from "../../lib/types/Beats";
import { selectedBeat, selectNewBeat } from "./selectedBeatStore";
import { authorizedFetch } from "../../helpers/Fetchers/authorizedFetch";


export const showAudioPlayer = writable<boolean>(false)

// all beats
export const beats = writable<Beat[]>([]);
export const beatPagesFetched = writable<number[]>([]);
export const allBeatPagesFetched = writable<boolean>(false);
export const fetchBeatsAttempted = writable<boolean>(false);
export const isFetchingBeats = writable<boolean>(false);
export const beatFetchError = writable<string | null>(null);
export const oneBeatFetchSuccessfull = writable<boolean>(false);

// filters
export const filteredBeats = derived(beats, ($beats) => {
    return $beats;
});

// Fetch beats from the backend

export async function fetchBeats(pageToFetch?: number) {
    if (get(isFetchingBeats)) return;
    if (get(allBeatPagesFetched)) return;

    const fetchedPages = get(beatPagesFetched);

    const nextPage =
        pageToFetch ??
        (fetchedPages.length > 0 ? Math.max(...fetchedPages) + 1 : 1);

    if (fetchedPages.includes(nextPage)) return;

    fetchBeatsAttempted.set(true);
    beatFetchError.set(null);
    isFetchingBeats.set(true);

// here i need to separate a more pages beats fetch from the first fetch with booleans.

    try {
        const result = await authorizedFetch(`/secure/beats/get-live-beats/${nextPage}`, {
            method: "GET",
        });

        oneBeatFetchSuccessfull.set(true);

        const newBeats: Beat[] = result.beats || [];

        newBeats.forEach((beat) => upsertBeat(beat));

        beatPagesFetched.update((pages) => {
            if (pages.includes(nextPage)) return pages;
            return [...pages, nextPage].sort((a, b) => a - b);
        });

        if (newBeats.length === 0 || result.hasMore === false) {
            allBeatPagesFetched.set(true);
        }

        const currentSelectedBeat = get(selectedBeat);

        if (!currentSelectedBeat && newBeats.length > 0) {
            selectNewBeat(newBeats[0]);
        }
    } catch (error: any) {
        beatFetchError.set(error.message || "An unknown error has occurred.");
    } finally {
        isFetchingBeats.set(false);
    }
}





export function updateBeatRatingInArray(
    beatId: string,
    newRating: Beat["rating"]
) {
    beats.update((currentBeats) =>
        currentBeats.map((beat) =>
            beat.id === beatId
                ? {
                      ...beat,
                      rating: newRating,
                  }
                : beat
        )
    );

    const currentSelectedBeat = get(selectedBeat);

    if (currentSelectedBeat?.id === beatId) {
        selectNewBeat({
            ...currentSelectedBeat,
            rating: newRating,
        });
    }
}

export function updateBeatCustomTagInArray(
    beatId: string,
    customTag: Beat["customTag"],
    customTagColor: Beat["customTagColor"]
) {
    beats.update((currentBeats) =>
        currentBeats.map((beat) =>
            beat.id === beatId
                ? {
                      ...beat,
                      customTag,
                      customTagColor,
                  }
                : beat
        )
    );

    const currentSelectedBeat = get(selectedBeat);

    if (currentSelectedBeat?.id === beatId) {
        selectNewBeat({
            ...currentSelectedBeat,
            customTag,
            customTagColor,
        });
    }
}

export function updateBeatNotepadInArray(
    beatId: string,
    notepad: Beat["notepad"]
) {
    beats.update((currentBeats) =>
        currentBeats.map((beat) =>
            beat.id === beatId
                ? {
                      ...beat,
                      notepad,
                  }
                : beat
        )
    );

    const currentSelectedBeat = get(selectedBeat);

    if (currentSelectedBeat?.id === beatId) {
        selectNewBeat({
            ...currentSelectedBeat,
            notepad,
        });
    }
}

export function updateBeatFutureDestinationsInArray(
    beatId: string,
    futureDestinations: Beat["futureDestinations"]
) {
    beats.update((currentBeats) =>
        currentBeats.map((beat) =>
            beat.id === beatId
                ? {
                      ...beat,
                      futureDestinations,
                  }
                : beat
        )
    );

    const currentSelectedBeat = get(selectedBeat);

    if (currentSelectedBeat?.id === beatId) {
        selectNewBeat({
            ...currentSelectedBeat,
            futureDestinations,
        });
    }
}


function getDateCreatedTime(beat: Beat): number {
    const dateCreated = beat.createdAt as any;

    if (!dateCreated) return 0;

    // Firestore Timestamp
    if (typeof dateCreated.toMillis === "function") {
        return dateCreated.toMillis();
    }

    // Serialized Firestore Timestamp
    if (typeof dateCreated._seconds === "number") {
        return dateCreated._seconds * 1000;
    }

    // JS Date
    if (dateCreated instanceof Date) {
        return dateCreated.getTime();
    }

    // number timestamp
    if (typeof dateCreated === "number") {
        return dateCreated;
    }

    // ISO string
    if (typeof dateCreated === "string") {
        return new Date(dateCreated).getTime();
    }

    return 0;
}

export function upsertBeat(newBeat: Beat) {
    beats.update((currentBeats) => {
        const idx = currentBeats.findIndex((beat) => beat.id === newBeat.id);
        let next: Beat[];

        if (idx === -1) {
            // Insert
            next = [...currentBeats, newBeat];
        } else {
            // Update
            next = [...currentBeats];
            next[idx] = newBeat;
        }

        // Sort by dateCreated DESC (newest first)
        next.sort((a, b) => getDateCreatedTime(b) - getDateCreatedTime(a));

        return next;
    });
}



export function removeBeatFromArray(beatId: string) {
    beats.update((currentBeats) =>
        currentBeats.filter((beat) => beat.id !== beatId)
    );
}

export function getNextBeatPageToFetch(): number {
    const fetchedPages = get(beatPagesFetched) as number[];

    // Sort the fetched pages in ascending order
    const sortedPages = [...fetchedPages].sort((a, b) => a - b);

    // Find the first missing page in the sequence
    for (let i = 1; i <= sortedPages.length + 1; i++) {
        if (!sortedPages.includes(i)) {
            return i;
        }
    }

    // Default to 1 if no pages have been fetched
    return 1;
}

export function updateBeatInArray(updatedBeat: Beat) {
    beats.update((currentBeats) =>
        currentBeats.map((beat) =>
            beat.id === updatedBeat.id ? updatedBeat : beat
        )
    );
}

export function runMoodFilter(){

}


// mood filters
export const moodFilter = writable<string[]>([])

export function toggleMoodFilter(mood: string) {
    moodFilter.update((currentMoods) => {
        if (currentMoods.includes(mood)) {
            return currentMoods.filter((currentMood) => currentMood !== mood);
        }

        return [...currentMoods, mood];
    });
}
export function clearMoodFilter() {
    moodFilter.set([])
}

// custom tag filters
export const tagFilter = writable<string[]>([]);

export function toggleTagFilter(tag: string) {
    tagFilter.update((currentTags) => {
        if (currentTags.includes(tag)) {
            return currentTags.filter((currentTag) => currentTag !== tag);
        }

        return [...currentTags, tag];
    });
}

export function clearTagFilter() {
    tagFilter.set([]);
}

// artist filters
export const artistFilter = writable<string[]>([]);

export function toggleArtistFilter(artist: string) {
    artistFilter.update((currentArtists) => {
        if (currentArtists.includes(artist)) {
            return currentArtists.filter((currentArtist) => currentArtist !== artist);
        }

        return [...currentArtists, artist];
    });
}

export function clearArtistFilter() {
    artistFilter.set([]);
}