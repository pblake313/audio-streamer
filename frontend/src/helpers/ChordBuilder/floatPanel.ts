/*
 * use:floatPanel: pins an open drop-down panel to the window (position: fixed),
 * placed from its button, instead of hanging it off the button with
 * position: absolute. The chord builder's controls and timeline sit in boxes
 * that swipe sideways on smaller screens, and a scrolling box clips anything
 * hanging out of it; a fixed panel isn't clipped. It follows the button if the
 * page or the box scrolls, and stays on screen.
 *
 *   anchor      what it opens from: an element, or anything with a
 *               getBoundingClientRect() (e.g. the span of a chord in the timeline)
 *   align       "left": starts at the anchor's left edge; "right": ends at its right edge
 *   up          open above the anchor instead of below
 *   matchWidth  at least as wide as the anchor
 *   fit         open below or above, whichever has room, and cap the height to
 *               the space there (the panel scrolls inside if it's taller)
 */
type Anchor = { getBoundingClientRect(): DOMRect };
type Options = { anchor: Anchor; align?: "left" | "right"; up?: boolean; matchWidth?: boolean; fit?: boolean };

const GAP = 6;
const MARGIN = 8;

export function floatPanel(node: HTMLElement, options: Options) {
    let opts = options;

    function place() {
        const rect = opts.anchor.getBoundingClientRect();
        const style = node.style;
        style.position = "fixed";
        style.right = "auto";
        style.bottom = "auto";
        if (opts.matchWidth) style.minWidth = `${rect.width}px`;

        // the visible area, without the page scrollbar (innerWidth includes it)
        const viewW = document.documentElement.clientWidth;
        const viewH = document.documentElement.clientHeight;

        let up = !!opts.up;
        if (opts.fit) {
            style.maxHeight = "none";
            const natural = node.scrollHeight;
            const below = viewH - rect.bottom - GAP - MARGIN;
            const above = rect.top - GAP - MARGIN;
            up = natural > below && above > below;
            style.maxHeight = `${Math.max(120, up ? above : below)}px`;
            style.overflowY = "auto";
        }

        const width = node.offsetWidth;
        const height = node.offsetHeight;
        const left = opts.align === "right" ? rect.right - width : rect.left;
        const top = up ? rect.top - GAP - height : rect.bottom + GAP;

        style.left = `${Math.max(MARGIN, Math.min(left, viewW - width - MARGIN))}px`;
        style.top = `${Math.max(MARGIN, top)}px`;
    }

    place();
    window.addEventListener("scroll", place, { capture: true, passive: true });
    window.addEventListener("resize", place);

    return {
        update(next: Options) {
            opts = next;
            place();
        },
        destroy() {
            window.removeEventListener("scroll", place, { capture: true });
            window.removeEventListener("resize", place);
        },
    };
}
