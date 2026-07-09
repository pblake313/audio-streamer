import { derived, get, writable } from "svelte/store";
import type { Beat } from "../../lib/types/Beats";
import { selectedBeat, selectNewBeat } from "./selectedBeatStore";
import { authorizedFetch } from "../../helpers/Fetchers/authorizedFetch";


export const showAudioPlayer = writable<boolean>(false);

// all beats
export const beats = writable<Beat[]>([]);
export const beatPagesFetched = writable<number[]>([]);
export const allBeatPagesFetched = writable<boolean>(false);
export const fetchBeatsAttempted = writable<boolean>(false);
export const isFetchingBeats = writable<boolean>(false);
export const beatFetchError = writable<string | null>(null);
export const oneBeatFetchSuccessfull = writable<boolean>(false);


let activeBeatFetchPromise: Promise<Beat[]> | null = null;


// Fetch beats from the backend
export async function fetchBeats(pageToFetch?: number): Promise<Beat[]> {
    if (get(allBeatPagesFetched)) return [];

    /*
     * If another normal-page request is already running, wait for and
     * reuse that request instead of firing the same pagination request twice.
     */
    if (activeBeatFetchPromise) {
        return activeBeatFetchPromise;
    }

    const fetchedPages = get(beatPagesFetched);

    const nextPage =
        pageToFetch ??
        (fetchedPages.length > 0 ? Math.max(...fetchedPages) + 1 : 1);

    if (fetchedPages.includes(nextPage)) return [];

    fetchBeatsAttempted.set(true);
    beatFetchError.set(null);
    isFetchingBeats.set(true);


    activeBeatFetchPromise = (async () => {
        try {
            const result = await authorizedFetch(
                `/secure/beats/get-live-beats/${nextPage}`,
                {
                    method: "GET",
                }
            );

            oneBeatFetchSuccessfull.set(true);

            const newBeats: Beat[] = Array.isArray(result.beats)
                ? result.beats
                : [];

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

            return newBeats;
        } catch (error: any) {
            beatFetchError.set(
                error.message || "An unknown error has occurred."
            );

            return [];
        } finally {
            isFetchingBeats.set(false);
            activeBeatFetchPromise = null;
        }
    })();


    return activeBeatFetchPromise;
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
        const idx = currentBeats.findIndex(
            (beat) => beat.id === newBeat.id
        );

        let next: Beat[];

        if (idx === -1) {
            // Insert
            next = [...currentBeats, newBeat];
        } else {
            // Update
            next = [...currentBeats];
            next[idx] = newBeat;
        }

        // Sort by createdAt DESC (newest first)
        next.sort(
            (a, b) =>
                getDateCreatedTime(b) - getDateCreatedTime(a)
        );

        return next;
    });
}


export function removeBeatFromArray(beatId: string) {
    beats.update((currentBeats) =>
        currentBeats.filter((beat) => beat.id !== beatId)
    );
}


export function getNextBeatPageToFetch(): number {
    const fetchedPages = get(beatPagesFetched);
    const sortedPages = [...fetchedPages].sort((a, b) => a - b);

    for (let page = 1; page <= sortedPages.length + 1; page += 1) {
        if (!sortedPages.includes(page)) {
            return page;
        }
    }

    return 1;
}


export function updateBeatInArray(updatedBeat: Beat) {
    beats.update((currentBeats) =>
        currentBeats.map((beat) =>
            beat.id === updatedBeat.id ? updatedBeat : beat
        )
    );
}


// =========================
// Filters
// =========================

// mood filters
export const moodFilter = writable<string[]>([]);

export function toggleMoodFilter(mood: string) {
    resetFilteredBeatPagination();

    moodFilter.update((currentMoods) => {
        if (currentMoods.includes(mood)) {
            return currentMoods.filter(
                (currentMood) => currentMood !== mood
            );
        }

        return [...currentMoods, mood];
    });
}

export function clearMoodFilter() {
    resetFilteredBeatPagination();
    moodFilter.set([]);
}


// custom tag filters
export const tagFilter = writable<string[]>([]);

export function toggleTagFilter(tag: string) {
    resetFilteredBeatPagination();

    tagFilter.update((currentTags) => {
        if (currentTags.includes(tag)) {
            return currentTags.filter(
                (currentTag) => currentTag !== tag
            );
        }

        return [...currentTags, tag];
    });
}

export function clearTagFilter() {
    resetFilteredBeatPagination();
    tagFilter.set([]);
}


// artist filters
export const artistFilter = writable<string[]>([]);

export function toggleArtistFilter(artist: string) {
    resetFilteredBeatPagination();

    artistFilter.update((currentArtists) => {
        if (currentArtists.includes(artist)) {
            return currentArtists.filter(
                (currentArtist) => currentArtist !== artist
            );
        }

        return [...currentArtists, artist];
    });
}

export function clearArtistFilter() {
    resetFilteredBeatPagination();
    artistFilter.set([]);
}


// beat type filter
export const beatTypeFilter = writable<string[]>([]);

export function toggleBeatTypeFilter(beatType: string) {
    resetFilteredBeatPagination();

    beatTypeFilter.update((currentBeatTypes) => {
        if (currentBeatTypes.includes(beatType)) {
            return currentBeatTypes.filter(
                (currentBeatType) => currentBeatType !== beatType
            );
        }

        return [...currentBeatTypes, beatType];
    });
}

export function clearBeatTypeFilter() {
    resetFilteredBeatPagination();
    beatTypeFilter.set([]);
}


// all filters
export function clearAllFilters() {
    resetFilteredBeatPagination();

    beatTypeFilter.set([]);
    artistFilter.set([]);
    tagFilter.set([]);
    moodFilter.set([]);
}


export const hasActiveBeatFilters = derived(
    [moodFilter, tagFilter, artistFilter, beatTypeFilter],
    ([
        $moodFilter,
        $tagFilter,
        $artistFilter,
        $beatTypeFilter,
    ]) =>
        $moodFilter.length > 0 ||
        $tagFilter.length > 0 ||
        $artistFilter.length > 0 ||
        $beatTypeFilter.length > 0
);


export const filteredBeats = derived(
    [
        beats,
        moodFilter,
        tagFilter,
        artistFilter,
        beatTypeFilter,
    ],
    ([
        $beats,
        $moodFilter,
        $tagFilter,
        $artistFilter,
        $beatTypeFilter,
    ]) => {
        const hasActiveFilters =
            $moodFilter.length > 0 ||
            $tagFilter.length > 0 ||
            $artistFilter.length > 0 ||
            $beatTypeFilter.length > 0;

        // No filters selected: show every fetched beat.
        if (!hasActiveFilters) {
            return $beats;
        }

        return $beats.filter((beat) => {
            /*
             * Each active filter group must match.
             *
             * This mirrors the backend query, which ANDs mood, custom tag,
             * artist and track type groups together. Inside the artist group,
             * tagOne OR tagTwo may match.
             */
            const matchesMood =
                $moodFilter.length === 0 ||
                (beat.mood !== null &&
                    $moodFilter.includes(beat.mood));

            const matchesCustomTag =
                $tagFilter.length === 0 ||
                (beat.customTag !== null &&
                    $tagFilter.includes(beat.customTag));

            const beatArtists = [beat.tagOne, beat.tagTwo].filter(
                (artist): artist is string => artist !== null
            );

            const matchesArtist =
                $artistFilter.length === 0 ||
                beatArtists.some((artist) =>
                    $artistFilter.includes(artist)
                );

            const matchesBeatType =
                $beatTypeFilter.length === 0 ||
                $beatTypeFilter.includes(beat.trackType);

            return (
                matchesMood &&
                matchesCustomTag &&
                matchesArtist &&
                matchesBeatType
            );
        });
    }
);


// =========================
// Filtered beat pagination
// =========================
export const isFetchingFilteredBeats = writable<boolean>(false);
export const fetchFilteredBeatsError = writable<string | null>(null);

export const filteredBeatPagesFetched = writable<number[]>([]);
export const allFilteredBeatPagesFetched = writable<boolean>(false);


let activeFilteredBeatRequestKey: string | null = null;
let activeFilteredFetchPromise: Promise<Beat[]> | null = null;
let activeFilteredFetchPromiseKey: string | null = null;

let filteredBeatsErrorTimeout: ReturnType<typeof setTimeout> | null = null;


type CurrentBeatFilters = {
    artistFilter: string[];
    beatTypeFilter: string[];
    tagFilter: string[];
    moodFilter: string[];
};


function getCurrentBeatFilters(): CurrentBeatFilters {
    return {
        artistFilter: get(artistFilter),
        beatTypeFilter: get(beatTypeFilter),
        tagFilter: get(tagFilter),
        moodFilter: get(moodFilter),
    };
}


function beatFiltersAreActive(filters: CurrentBeatFilters): boolean {
    return (
        filters.artistFilter.length > 0 ||
        filters.beatTypeFilter.length > 0 ||
        filters.tagFilter.length > 0 ||
        filters.moodFilter.length > 0
    );
}


function createFilteredBeatRequestKey(
    filters: CurrentBeatFilters
): string {
    return JSON.stringify({
        artistFilter: [...filters.artistFilter].sort(),
        beatTypeFilter: [...filters.beatTypeFilter].sort(),
        tagFilter: [...filters.tagFilter].sort(),
        moodFilter: [...filters.moodFilter].sort(),
    });
}


function setFilteredBeatsError(message: string) {
    if (filteredBeatsErrorTimeout) {
        clearTimeout(filteredBeatsErrorTimeout);
    }

    fetchFilteredBeatsError.set(message);

    filteredBeatsErrorTimeout = setTimeout(() => {
        fetchFilteredBeatsError.set(null);
        filteredBeatsErrorTimeout = null;
    }, 6000);
}


export function getNextFilteredBeatPageToFetch(): number {
    const pagesFetched = get(filteredBeatPagesFetched);

    let nextPage = 1;

    while (pagesFetched.includes(nextPage)) {
        nextPage += 1;
    }

    return nextPage;
}


export function resetFilteredBeatPagination() {
    filteredBeatPagesFetched.set([]);
    allFilteredBeatPagesFetched.set(false);

    activeFilteredBeatRequestKey = null;
}


export async function fetchBeatsWithFilters(
    pageToFetch?: number
): Promise<Beat[]> {
    const currentFilters = getCurrentBeatFilters();

    if (!beatFiltersAreActive(currentFilters)) {
        resetFilteredBeatPagination();
        return [];
    }

    const requestKey = createFilteredBeatRequestKey(currentFilters);

    /*
     * Reuse an identical in-flight request. If the filters changed while
     * another filtered request was running, wait for it and then start the
     * request for the new filter combination.
     */
    if (activeFilteredFetchPromise) {
        const currentPromise = activeFilteredFetchPromise;
        const currentPromiseKey = activeFilteredFetchPromiseKey;
        const result = await currentPromise;

        if (currentPromiseKey !== requestKey) {
            return fetchBeatsWithFilters(pageToFetch);
        }

        return result;
    }

    if (requestKey !== activeFilteredBeatRequestKey) {
        filteredBeatPagesFetched.set([]);
        allFilteredBeatPagesFetched.set(false);

        activeFilteredBeatRequestKey = requestKey;
    }

    if (get(allFilteredBeatPagesFetched)) return [];

    const page = pageToFetch ?? getNextFilteredBeatPageToFetch();
    const pagesFetched = get(filteredBeatPagesFetched);

    if (pagesFetched.includes(page)) return [];

    isFetchingFilteredBeats.set(true);
    fetchFilteredBeatsError.set(null);

    if (filteredBeatsErrorTimeout) {
        clearTimeout(filteredBeatsErrorTimeout);
        filteredBeatsErrorTimeout = null;
    }


    activeFilteredFetchPromiseKey = requestKey;

    activeFilteredFetchPromise = (async () => {
        try {
            const response = await authorizedFetch(
                `/secure/beats/get-filtered-beats/${page}`,
                {
                    method: "POST",
                    body: JSON.stringify(currentFilters),
                }
            );

            if (!Array.isArray(response.beats)) {
                throw new Error("Invalid filtered beats response.");
            }

            const newBeats: Beat[] = response.beats;

            newBeats.forEach((beat) => {
                upsertBeat(beat);
            });

            /*
             * Only update this pagination state if the user is still using
             * the same filter combination that started this request.
             */
            const latestRequestKey = createFilteredBeatRequestKey(
                getCurrentBeatFilters()
            );

            if (latestRequestKey === requestKey) {
                filteredBeatPagesFetched.update((currentPages) => {
                    if (currentPages.includes(page)) {
                        return currentPages;
                    }

                    return [...currentPages, page].sort(
                        (a, b) => a - b
                    );
                });

                if (
                    newBeats.length === 0 ||
                    response.hasMore === false
                ) {
                    allFilteredBeatPagesFetched.set(true);
                }

                const currentSelectedBeat = get(selectedBeat);
                const currentFilteredBeats = get(filteredBeats);

                if (
                    !currentSelectedBeat &&
                    currentFilteredBeats.length > 0
                ) {
                    selectNewBeat(currentFilteredBeats[0]);
                }
            }

            return newBeats;
        } catch (err: any) {
            const latestRequestKey = createFilteredBeatRequestKey(
                getCurrentBeatFilters()
            );

            if (latestRequestKey === requestKey) {
                setFilteredBeatsError(
                    err.message || "Failed to fetch filtered beats."
                );
            }

            return [];
        } finally {
            isFetchingFilteredBeats.set(false);
            activeFilteredFetchPromise = null;
            activeFilteredFetchPromiseKey = null;
        }
    })();


    return activeFilteredFetchPromise;
}
