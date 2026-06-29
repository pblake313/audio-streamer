<script lang="ts">
    import { authorizedFetch } from "../../helpers/Fetchers/authorizedFetch";
    import type { Beat } from "../../lib/types/Beats";
    import { updateBeatRatingInArray, upsertBeat } from "../../stores/AudioPlayer/BeatsStore";
    import { isUpdatingBeatFromModal } from "../../stores/BeatUpdatingStore";
    import { setPopupError } from "../../stores/PopupBeatStore";
    import Loader from "../loaders/Loader.svelte";
    import "./BeatRatingForm.css";

    export let beat: Beat;

    let beatRating: number = beat?.rating || 0;
    let hoverIndex: number | null = null;
    let isLoading: boolean = false

    async function handleStarClick(newStarRating: number) {
        if (isLoading) return

        try {
            isLoading = true

            const response = await authorizedFetch(
                `/secure/beats/update-rating/${beat.id}`,
                {
                    method: "POST",
                    body: JSON.stringify({ newRating: newStarRating }),
                },
            );

            updateBeatRatingInArray(beat.id, response.rating);



        } catch (error: any) {
            const errorMessage =
                error.message || "An unknown error has occurred.";

            setPopupError(errorMessage);
        } finally {
            isLoading = false
        }
    }
</script>

{#if isLoading}
    <div>
        <Loader height={"25px"}/>
    </div>
{:else}
    <div class="starRow" class:hideStarRow={$isUpdatingBeatFromModal}>
        {#each Array(5) as _, i}
            <button
                class="starButton"
                type="button"
                aria-label={`Rate ${i + 1}`}
                on:mouseenter={() => (hoverIndex = i)}
                on:mouseleave={() => (hoverIndex = null)}
                on:click={() => handleStarClick(i + 1)}
            >
                <svg
                    viewBox="1.3 2 21.4 20.2"
                    class="starIcon"
                    aria-hidden="true"
                >
                    <path
                        d="M12 2.5l2.9 6.6 7.1.6-5.3 4.9 1.6 7-6.3-3.7-6.3 3.7 1.6-7-5.3-4.9 7.1-.6z"
                        stroke="#525252"
                        stroke-width=".5"
                        fill={(
                            hoverIndex !== null
                                ? i <= hoverIndex
                                : i < beatRating
                        )
                            ? "white"
                            : "transparent"}
                        stroke-linejoin="round"
                    />
                </svg>
            </button>
        {/each}
    </div>

{/if}
    