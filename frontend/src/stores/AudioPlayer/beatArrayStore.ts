import { get, writable } from "svelte/store";
import type { Beat } from "../../lib/types/Beats";
import { pushNotification } from "../NotificationStore";
import { selectedBeat, selectNewBeat } from "./selectedBeatStore";
import { protectedFetch } from "../../helpers/ProtectedFetches/protectedFetch";
import type { FetchBeatsResponse } from "../../helpers/ProtectedFetches/protectedFetchResponseTypes";
import { authorizedFetch } from "../../helpers/Fetchers/authorizedFetch";

const backendLink = import.meta.env.VITE_BACKEND_URL;

const beatPagesFetched = writable<Number[]>([])
const allBeatPagesFetched = writable<boolean>(false)
const fetchBeatsAttempted = writable<boolean>(false)
const isFetchingBeats = writable<boolean>(false)

const beatFetchError = writable<string | null>(null)

const beats = writable<Beat[]>([]);

// Fetch beats from the backend


async function fetchBeats(pageToFetch: number = 1) {
    beatFetchError.set(null)

    const allPagesFetched = get(allBeatPagesFetched);
    if (allPagesFetched) {
        // console.log("All beat pages have already been fetched.");
        return;
    }

    const fetchedPages = get(beatPagesFetched);
    if (fetchedPages.includes(pageToFetch)) {
        // console.log(`Page ${pageToFetch} has already been fetched.`);
        return;
    }

    isFetchingBeats.set(true)

    try {

        const result = await authorizedFetch<FetchBeatsResponse>(`/secure/beats/get-live-beats/${pageToFetch}`, {
            method: 'GET'
        })

        if (!result.fullBatch){
            allBeatPagesFetched.set(true)
        }

        const newBeats: Beat[] = result.beats

        newBeats.forEach((beat) => upsertBeat(beat));

        beatPagesFetched.update((pages) => {
            if (!pages.includes(pageToFetch)) {
                return [...pages, pageToFetch];
            }
            return pages; // Return the array unchanged if the number already exists
        });

        const currentSelectedBeat = get(selectedBeat)

        if (!currentSelectedBeat && newBeats.length > 0) {
            const firstBeat = newBeats[0];
            selectNewBeat(firstBeat)
          }

        return result;
        
    } catch (error: any) {
        beatFetchError.set(error.message || 'An unknown error has occurred.')
        throw new Error('An error occurred while fetching beats.');
    } finally {
        fetchBeatsAttempted.set(true)
        isFetchingBeats.set(false)

    }
}

function getUploadTime(beat: Beat): number {
    const anyDate: any = (beat as any).uploadDate;

    if (!anyDate) return 0;

    // If it's already a JS Date
    if (anyDate instanceof Date) {
        return anyDate.getTime();
    }

    // Firestore Timestamp-style: { _seconds, _nanoseconds }
    if (typeof anyDate === 'object' && '_seconds' in anyDate) {
        const seconds = anyDate._seconds as number;
        const nanos = (anyDate._nanoseconds ?? anyDate.nanoseconds ?? 0) as number;
        return seconds * 1000 + Math.floor(nanos / 1e6);
    }

    // If it's a string or something else that Date can parse
    const parsed = new Date(anyDate).getTime();
    return isNaN(parsed) ? 0 : parsed;
}

function upsertBeat(newBeat: Beat) {
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

        // Sort by uploadDate DESC (newest first)
        next.sort((a, b) => getUploadTime(b) - getUploadTime(a));

        return next;
    });
}


function removeBeatFromArray(beatId: string) {
    beats.update((currentBeats) =>
        currentBeats.filter((beat) => beat.id !== beatId)
    );
}


function getNextBeatPageToFetch(): number {
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

function updateBeatInArray(updatedBeat: Beat) {
    beats.update((currentBeats) =>
      currentBeats.map((beat) =>
        beat.id === updatedBeat.id ? updatedBeat : beat
      )
    );
  }
  

export {
    fetchBeats,
    beatPagesFetched,
    allBeatPagesFetched,
    fetchBeatsAttempted,
    getNextBeatPageToFetch,
    beats,
    upsertBeat,
    updateBeatInArray,
    isFetchingBeats,
    beatFetchError, 
    removeBeatFromArray
}