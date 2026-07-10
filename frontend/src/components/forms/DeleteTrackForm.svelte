<script lang="ts">
    import { goto } from "$app/navigation";
    import { authorizedFetch } from "../../helpers/Fetchers/authorizedFetch";
    import type { Beat } from "../../lib/types/Beats";
    import { removeBeatFromArray } from "../../stores/AudioPlayer/BeatsStore";
    import { editBeatFormError, setEditBeatFormError } from "../../stores/EditBeatStore";
    import { pushNotification } from "../../stores/NotificationStore";
    import BoxButton from "../buttons/BoxButton.svelte";

    export let beat: Beat

    let isLoading: boolean = false

    async function deleteTrack(beatId: string | null) {
        try {
            if (!beatId || isLoading) return
            editBeatFormError.set(null)

            isLoading = true

            const response = await authorizedFetch(`/secure/beats/delete-beat/${beatId}`)

            console.log(response)
            removeBeatFromArray(beatId)
            pushNotification(`This track was deleted successfully.`, 'Success', false, 2500, `${beat.beatTitle} ` )
            goto('/portal/manage-beats')
        } catch (err: any) {
            console.log(err)
            const errorMessage = err.message || 'An unknown error has occurred.'
            setEditBeatFormError(errorMessage)

        } finally {
            isLoading = false
        }
    }

</script>


<BoxButton
    on:click={() => {
        deleteTrack(beat.id);
    }}
    buttonIcon={isLoading ? 'loading' : "trash"}
    buttonText={isLoading ? 'Deleting...' : "Delete Track"}
    buttonStyle={"opacityIncrease"}
    noPad={true}
    iconColor={"#f7f7f7"}
/>