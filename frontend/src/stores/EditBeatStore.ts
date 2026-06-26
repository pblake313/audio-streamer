import { writable } from "svelte/store";
import { authorizedFetch } from "../helpers/Fetchers/authorizedFetch";
import type { Beat } from "../lib/types/Beats";
import { pushNotification } from "./NotificationStore";
import { removeBeatFromArray } from "./AudioPlayer/BeatsStore";
import { goto } from "$app/navigation";

export const isFetchingBeatToEdit = writable<boolean>(false)
export const beatToEdit = writable<Beat | null>(null)

export async function fetchSingleBeat(beatId: string) {
    try {
        isFetchingBeatToEdit.set(true)

        const response = await authorizedFetch(`/secure/beats/get-beat/${beatId}`, {
            method: 'GET'
        })

        if (response.beat) {
            beatToEdit.set(response.beat)
        } else {
            console.log('successful fetch... but no beat.')
        }

    } catch (err: any){
        console.log(err)
    } finally {
        isFetchingBeatToEdit.set(false)
    }
    
}

export async function deleteBeat(beatId: string) {
    try {

        await authorizedFetch(`/secure/beats/delete-beat/${beatId}`, {
            method: "GET"
        })

        removeBeatFromArray(beatId)
        pushNotification('Beat was removed successfully.', 'Success', false, 1500, 'Beat Removed')
        goto('/portal/manage-beats')

    } catch (err: any) {
        pushNotification(err.message || 'An unknown error has occurred.', 'Error', false, 5000, 'Delete Beat Error')

    } finally {

    }
}