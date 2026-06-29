<script lang="ts">
    import { authorizedFetch } from "../../helpers/Fetchers/authorizedFetch";
    import type { Beat } from "../../lib/types/Beats";
    import { updateBeatCustomTagInArray } from "../../stores/AudioPlayer/BeatsStore";
    import { setPopupError } from "../../stores/PopupBeatStore";
    import TrashIcon from "../Icons/svg/TrashIcon.svelte";
    import Loader from "../loaders/Loader.svelte";

    import "./MarkTrash.css";

    export let beat: Beat;

    let isLoading: boolean = false;

    async function handleMarkAsTrash() {
        if (isLoading) return;

        try {
            isLoading = true;

            const response = await authorizedFetch(`/secure/beats/mark-trash/${beat.id}`);

            console.log(response);

            updateBeatCustomTagInArray(
                beat.id,
                response.customTag,
                response.customTagColor
            );
        } catch (err: any) {
            const errorMessage =
                err.message || "An unknown error has occurred.";

            setPopupError(errorMessage);
        } finally {
            isLoading = false;
        }
    }
</script>

<!-- the active state is if beat.customTag === 'Trash' and if beat.customTagColor === 'ff1a1a' -->

<button
    class="mt_button"
    class:mt_nonActive={beat.customTag !== "Trash" || beat.customTagColor !== "ff1a1a"}
    on:click={handleMarkAsTrash}
>
    {#if !isLoading}
        <div style="padding-top: 2px;">
            <TrashIcon height={"20px"} />
        </div>
    {:else}
        <div>
            <Loader height={"25px"} />
        </div>
    {/if}
</button>