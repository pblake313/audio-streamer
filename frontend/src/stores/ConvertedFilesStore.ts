import { get, writable } from "svelte/store";
import type { ConvertedFileDoc } from "../lib/types/ConvertedFiles";
import { authorizedFetch } from "../helpers/Fetchers/authorizedFetch";

export const isFetchingFiles = writable<boolean>(false);
export const isFetchingMoreFiles = writable<boolean>(false);
export const convertedFileFetchError = writable<string | null>(null)


export const oneSuccessfulFileBatchFetched =
    writable<boolean>(false);

export const allFileBatchesFetched =
    writable<boolean>(false);

export const convertedFiles =
    writable<ConvertedFileDoc[]>([]);

let nextPageToFetch = 1;

export async function fetchFileDocsByPage(): Promise<ConvertedFileDoc[]> {
    if (get(allFileBatchesFetched)) {
        return [];
    }
    
    convertedFileFetchError.set(null)

    const pageToFetch = nextPageToFetch;

    try {
        if (pageToFetch === 1) {
            isFetchingFiles.set(true);
        } else {
            isFetchingMoreFiles.set(true);
        }

        const response = await authorizedFetch(
            `/secure/converter/get-files/${pageToFetch}`
        );

        const fetchedFiles: ConvertedFileDoc[] = Array.isArray(
            response.files
        )
            ? response.files
            : [];

        fetchedFiles.forEach((file) => {
            upsertConvertedFile(file);
        });

        oneSuccessfulFileBatchFetched.set(true);

        if (
            fetchedFiles.length === 0 ||
            response.hasMore === false
        ) {
            allFileBatchesFetched.set(true);
        } else {
            nextPageToFetch += 1;
        }

        return fetchedFiles;
    } catch (err: any) {

        convertedFileFetchError.set(err.message || 'An unknown error has occurred.')
        // console.error(err);

        return [];
    } finally {
        isFetchingFiles.set(false);
        isFetchingMoreFiles.set(false);
    }
}

function getCreatedAtTime(value: unknown): number {
    if (value instanceof Date) {
        return value.getTime();
    }

    if (typeof value === "string" || typeof value === "number") {
        return new Date(value).getTime();
    }

    if (typeof value === "object" && value !== null) {
        if ("seconds" in value && typeof value.seconds === "number") {
            return value.seconds * 1000;
        }

        if ("_seconds" in value && typeof value._seconds === "number") {
            return value._seconds * 1000;
        }
    }

    return 0;
}

export function upsertConvertedFile(
    file: ConvertedFileDoc
) {
    convertedFiles.update((currentFiles) => {
        const existingIndex = currentFiles.findIndex(
            (currentFile) =>
                currentFile.id === file.id
        );

        let updatedFiles: ConvertedFileDoc[];

        if (existingIndex === -1) {
            updatedFiles = [...currentFiles, file];
        } else {
            updatedFiles = [...currentFiles];

            updatedFiles[existingIndex] = file;
        }

        return updatedFiles.sort(
            (a, b) =>
                getCreatedAtTime(b.createdAt) -
                getCreatedAtTime(a.createdAt)
        );
    });
}