<script lang="ts">
    import { authorizedFetch } from "../../helpers/Fetchers/authorizedFetch";
    import type { Beat } from "../../lib/types/Beats";
    import { updateBeatRatingInArray } from "../../stores/AudioPlayer/BeatsStore";
    import { isUpdatingBeatFromModal } from "../../stores/BeatUpdatingStore";
    import { setPopupError } from "../../stores/PopupBeatStore";
    import Loader from "../loaders/Loader.svelte";
    import "./BeatRatingForm.css";

    export let beat: Beat;

    let hoverIndex: number | null = null;
    let isLoading: boolean = false;

    $: beatRating = beat?.rating ?? 0;

    function isBeatRating(value: unknown): value is Beat["rating"] {
        return typeof value === "number" && [0, 1, 2, 3, 4, 5].includes(value);
    }

    function getStarRating(index: number): Beat["rating"] {
        return (index + 1) as Beat["rating"];
    }

    async function handleStarClick(newStarRating: Beat["rating"]) {
        if (isLoading) return;

        try {
            isLoading = true;

            const response = await authorizedFetch(
                `/secure/beats/update-rating/${beat.id}`,
                {
                    method: "POST",
                    body: JSON.stringify({ newRating: newStarRating }),
                }
            );

            if (!isBeatRating(response.rating)) {
                throw new Error("Rating updated, but no valid rating was returned.");
            }

            updateBeatRatingInArray(beat.id, response.rating);

            beat = {
                ...beat,
                rating: response.rating,
            };

            hoverIndex = null;
        } catch (error: any) {
            const errorMessage =
                error.message || "An unknown error has occurred.";

            setPopupError(errorMessage);
        } finally {
            isLoading = false;
        }
    }
</script>

{#if isLoading}
    <div>
        <Loader height={"25px"} />
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
                on:click={() => handleStarClick(getStarRating(i))}
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