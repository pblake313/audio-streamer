/*
 * use:dragScroll lets a mouse drag a sideways-scrolling row (overflow-x +
 * scroll-snap), the way touch and trackpads already can. Touch keeps native
 * scrolling. It only does anything while the row actually overflows, and a
 * drag swallows the click that follows, so buttons inside don't fire.
 */
const DRAG_THRESHOLD = 5;

export function dragScroll(node: HTMLElement) {
    let pointerId: number | null = null;
    let startX = 0;
    let startScroll = 0;
    let dragging = false;

    const overflowing = () => node.scrollWidth > node.clientWidth + 1;

    // a grab cursor only while there's something to drag
    const updateCursor = () => node.classList.toggle("dragScroll", overflowing());
    const resizeObserver = new ResizeObserver(updateCursor);
    resizeObserver.observe(node);
    updateCursor();

    function onDown(event: PointerEvent) {
        if (event.pointerType !== "mouse" || event.button !== 0 || !overflowing()) return;
        pointerId = event.pointerId;
        startX = event.clientX;
        startScroll = node.scrollLeft;
        dragging = false;
        // capture waits until a drag starts, so plain clicks still reach buttons
    }

    function onMove(event: PointerEvent) {
        if (event.pointerId !== pointerId) return;
        if ((event.buttons & 1) !== 1) return onEnd(event); // released outside

        const dx = event.clientX - startX;
        if (!dragging && Math.abs(dx) < DRAG_THRESHOLD) return;

        if (!dragging) {
            dragging = true;
            node.setPointerCapture(event.pointerId);
            // snapping would fight the drag; it comes back on release and settles
            node.style.scrollSnapType = "none";
            node.classList.add("dragScrolling");
        }

        event.preventDefault();
        node.scrollLeft = startScroll - dx;
    }

    function onEnd(event: PointerEvent) {
        if (event.pointerId !== pointerId) return;
        pointerId = null;
        if (!dragging) return;

        if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
        node.classList.remove("dragScrolling");

        // restore snapping from where the drag left off, so it settles smoothly
        const left = node.scrollLeft;
        node.style.scrollSnapType = "";
        node.scrollLeft = left;

        // the click that ends a drag shouldn't press whatever is under the mouse
        const blockClick = (e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
        };
        node.addEventListener("click", blockClick, { capture: true, once: true });
        setTimeout(() => node.removeEventListener("click", blockClick, { capture: true }), 0);
        dragging = false;
    }

    // a stray image/text drag would steal the gesture
    const onDragStart = (event: DragEvent) => event.preventDefault();

    node.addEventListener("pointerdown", onDown);
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerup", onEnd);
    node.addEventListener("pointercancel", onEnd);
    node.addEventListener("dragstart", onDragStart);

    return {
        destroy() {
            resizeObserver.disconnect();
            node.removeEventListener("pointerdown", onDown);
            node.removeEventListener("pointermove", onMove);
            node.removeEventListener("pointerup", onEnd);
            node.removeEventListener("pointercancel", onEnd);
            node.removeEventListener("dragstart", onDragStart);
        },
    };
}
