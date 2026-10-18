<script lang="ts">
    import { fade } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import CloseButton from "../buttons/CloseButton.svelte";
    import "./Modal.css";
    import { createEventDispatcher, onMount } from "svelte";

    export let modalTitle = "Enter modalTitle";
    export let modalWidth = "600px";

    const dispatch = createEventDispatcher();

    let sheetEl: HTMLDivElement;

    onMount(() => {
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = "";
        };
    });

    const isSheet = () => window.matchMedia("(max-width: 600px)").matches;

    // desktop: scale up into place. mobile: slide up as a bottom sheet.
    function modalIn(node: HTMLElement) {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return { duration: 0 };
        }

        const sheet = isSheet();

        return {
            duration: sheet ? 380 : 320,
            easing: quintOut,
            css: (t: number, u: number) =>
                sheet
                    ? `transform: translateY(${u * 100}%);`
                    : `opacity: ${t}; transform: translateY(${u * 14}px) scale(${0.95 + 0.05 * t});`,
        };
    }

    function handleClose() {
        dispatch("closeModal");
    }

    // ---------------------------------------------
    // swipe down to close (mobile bottom sheet)
    // dragging starts on the handle / header only,
    // so scrolling the content still works normally
    // ---------------------------------------------
    const CLOSE_DISTANCE = 110; // px dragged down
    const CLOSE_VELOCITY = 0.6; // px per ms (a quick flick)

    let dragPointerId: number | null = null;
    let dragStartY = 0;
    let dragStartTime = 0;
    let dragOffset = 0;
    let isDragging = false;

    function onDragStart(event: PointerEvent) {
        if (!isSheet() || event.button > 0) return;

        // let the close button work normally
        if ((event.target as HTMLElement).closest("button")) return;

        dragPointerId = event.pointerId;
        dragStartY = event.clientY;
        dragStartTime = performance.now();
        dragOffset = 0;
        isDragging = true;

        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }

    function onDragMove(event: PointerEvent) {
        if (!isDragging || event.pointerId !== dragPointerId) return;

        // only follow downward drags; a little resistance upward
        const dy = event.clientY - dragStartY;
        dragOffset = dy > 0 ? dy : dy / 6;
    }

    function onDragEnd(event: PointerEvent) {
        if (!isDragging || event.pointerId !== dragPointerId) return;

        const elapsed = Math.max(1, performance.now() - dragStartTime);
        const velocity = dragOffset / elapsed;

        isDragging = false;
        dragPointerId = null;

        if (dragOffset > CLOSE_DISTANCE || (dragOffset > 30 && velocity > CLOSE_VELOCITY)) {
            // finish the slide down, then close
            dragOffset = sheetEl?.offsetHeight ?? window.innerHeight;
            setTimeout(handleClose, 200);
        } else {
            dragOffset = 0;
        }
    }
</script>

<div
    class="modalWrap"
    in:fade={{ duration: 200 }}
    out:fade={{ delay: 200, duration: 200 }}
>
    <button
        class="modalBackdrop"
        type="button"
        aria-label="Close modal"
        tabindex="-1"
        on:click={handleClose}
    ></button>

    <div
        bind:this={sheetEl}
        class="innerModal"
        class:innerModal_dragging={isDragging}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabindex="-1"
        in:modalIn
        style="width: {modalWidth}; {dragOffset ? `transform: translateY(${dragOffset}px);` : ''}"
    >
        <!-- drag zone: handle + header -->
        <div
            class="modalDragZone"
            on:pointerdown={onDragStart}
            on:pointermove={onDragMove}
            on:pointerup={onDragEnd}
            on:pointercancel={onDragEnd}
        >
            <div class="modalHandle" aria-hidden="true"></div>

            <div class="modalHeader">
                <h5 id="modal-title">{modalTitle}</h5>

                <CloseButton on:click={handleClose} color="f7f7f7" />
            </div>
        </div>

        <div class="wrapTheSlot">
            <slot />
        </div>
    </div>
</div>
