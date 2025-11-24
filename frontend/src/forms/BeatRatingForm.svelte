<script lang="ts">
    import { pushNotification } from "../stores/NotificationStore";
    import './BeatRatingForm.css'
    import type { Beat } from "../lib/types/Beats";
    import { authorizedFetch } from "../helpers/Fetchers/authorizedFetch";
    import { upsertBeat } from "../stores/AudioPlayer/beatArrayStore";
    import { isUpdatingBeatFromModal } from "../stores/BeatUpdatingStore";
  
    // Beat to rate
    export let beat: Beat 

    // 🔥 Callback prop – parent can hook into this
    export let onRatingUpdated: (() => void) | undefined;

    let beatRating: number = beat?.rating || 0;
    let hoverIndex: number | null = null;


    async function handleStarClick(newStarRating: number) {
        if (!beat || !beat.id) return;

        try {
            isUpdatingBeatFromModal.set(true)

            const formData = {
                newRating: newStarRating
            };

            const response = await authorizedFetch(`/secure/beats/update-rating/${beat.id}`, {
                method: "POST",
                body: JSON.stringify(formData),
            });

            if (response.beat) {

                if (onRatingUpdated) {
                    onRatingUpdated();
                }

                upsertBeat(response.beat)

            } else {
                pushNotification("Beat rating updated successfully but no new beat was returned.", "Error", false, 1500, "Update Beat Error");
            }
        } catch (error: any) {
            pushNotification( error?.message || "An unknown error has occured.", "Error", false, 5000, "Update Beat Rating Error");
        } finally {
            isUpdatingBeatFromModal.set(false)
        }
    }
</script>




{#if !$isUpdatingBeatFromModal}
    <div class="starRow" class:hideStarRow={$isUpdatingBeatFromModal} >
        {#each Array(5) as _, i}
            <button
                class="starButton"
                type="button"
                aria-label={`Rate ${i + 1}`}
                on:mouseenter={() => hoverIndex = i}
                on:mouseleave={() => hoverIndex = null}
                on:click={() => handleStarClick(i + 1)}
            >
                <svg viewBox="0 0 24 24" class="starIcon">
                    <path
                        d="M12 2.5l2.9 6.6 7.1.6-5.3 4.9 1.6 7-6.3-3.7-6.3 3.7 1.6-7-5.3-4.9 7.1-.6z"
                        stroke="#525252"
                        stroke-width=".5"
                        fill={(hoverIndex !== null ? i <= hoverIndex : i < beatRating) ? 'white' : 'transparent'}
                        stroke-linejoin="round"
                    />
                </svg>
            </button>
        {/each}
    </div>
{/if}
