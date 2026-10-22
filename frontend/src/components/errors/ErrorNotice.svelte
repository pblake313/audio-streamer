<script lang="ts">
    import "./ErrorNotice.css";

    /*
        A readable error card. Pulls any link out of the message (long URLs
        don't wrap and ran off the page), and explains Firestore's
        "needs an index" error with a button that opens the link to create it.
    */
    export let message: string;
    export let title = "Something went wrong";
    export let onRetry: (() => void) | null = null;

    $: link = message.match(/https?:\/\/\S+/)?.[0] ?? null;

    $: needsIndex = /requires an index/i.test(message);

    // the message minus the link and Firestore's "9 FAILED_PRECONDITION:" prefix
    $: text = message
        .replace(link ?? "", "")
        .replace(/^\d+\s+[A-Z_]+:\s*/, "")
        .replace(/you can create it here:?\s*$/i, "")
        .trim();
</script>

<div class="en_card" role="alert">
    <span class="en_icon" aria-hidden="true">!</span>

    <div class="en_body">
        {#if needsIndex}
            <p class="en_title">This view needs a database index</p>
            <p class="en_text">
                Firestore needs an index for this filter and sort. Create it, give
                it a minute or two to build, then try again.
            </p>
        {:else}
            <p class="en_title">{title}</p>
            {#if text}
                <p class="en_text">{text}</p>
            {/if}
        {/if}

        {#if link || onRetry}
            <div class="en_actions">
                {#if link}
                    <a
                        class="en_button en_button_primary"
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {needsIndex ? "Create index" : "Open link"} ↗
                    </a>
                {/if}

                {#if onRetry}
                    <button type="button" class="en_button" on:click={onRetry}>
                        Retry
                    </button>
                {/if}
            </div>
        {/if}
    </div>
</div>
