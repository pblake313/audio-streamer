import { get, writable } from "svelte/store";
import type { ConvertedFileDoc } from "../lib/types/ConvertedFiles";
import { authorizedFetch } from "../helpers/Fetchers/authorizedFetch";

export const isFetchingFiles = writable<boolean>(false);
export const isFetchingMoreFiles = writable<boolean>(false);

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
    } catch (err) {
        console.error(err);
        return [];
    } finally {
        isFetchingFiles.set(false);
        isFetchingMoreFiles.set(false);
    }
}

export function upsertConvertedFile(
    file: ConvertedFileDoc
) {
    convertedFiles.update((currentFiles) => {
        const existingIndex = currentFiles.findIndex(
            (currentFile) =>
                currentFile.id === file.id
        );

        if (existingIndex === -1) {
            return [...currentFiles, file];
        }

        const updatedFiles = [...currentFiles];

        updatedFiles[existingIndex] = file;

        return updatedFiles;
    });
}