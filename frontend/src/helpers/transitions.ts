import { quintOut } from "svelte/easing";

const prefersReducedMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// entrance: rises, un-blurs and settles from a slightly smaller scale
export function rise(
    node: HTMLElement,
    { delay = 0, duration = 900, y = 28, scale = 0.96, blur = 10, easing = quintOut } = {}
) {
    if (prefersReducedMotion()) return { duration: 0 };

    return {
        delay,
        duration,
        easing,
        css: (t: number, u: number) => `
            opacity: ${t};
            transform: translateY(${u * y}px) scale(${scale + (1 - scale) * t});
            filter: blur(${u * blur}px);
        `,
    };
}

/*
 * Scroll reveal: fades/rises an element in the first time it scrolls into
 * view. Styles live in routes/styles.css (.reveal / .reveal_visible).
 * Without JS (SSR) or with reduced motion the element simply stays visible.
 */
export function reveal(
    node: HTMLElement,
    { delay = 0, y = 24 }: { delay?: number; y?: number } = {}
) {
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
        return {};
    }

    node.style.setProperty("--reveal-delay", `${delay}ms`);
    node.style.setProperty("--reveal-y", `${y}px`);
    node.classList.add("reveal");

    const observer = new IntersectionObserver(
        ([entry]) => {
            if (!entry.isIntersecting) return;
            node.classList.add("reveal_visible");
            observer.disconnect();
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    observer.observe(node);

    return {
        destroy() {
            observer.disconnect();
        },
    };
}

/*
 * Content swap (e.g. highlighted track changing): the old content drifts
 * up and fades while the new content rises in just after. Put both in a
 * .swapStack container so they overlap instead of stacking.
 */
export function swapIn(
    node: HTMLElement,
    { delay = 140, duration = 560, y = 10, easing = quintOut } = {}
) {
    if (prefersReducedMotion()) return { duration: 0 };

    return {
        delay,
        duration,
        easing,
        css: (t: number, u: number) => `
            opacity: ${t};
            transform: translateY(${u * y}px);
        `,
    };
}

export function swapOut(
    node: HTMLElement,
    { duration = 240, y = -6 } = {}
) {
    if (prefersReducedMotion()) return { duration: 0 };

    return {
        duration,
        css: (t: number, u: number) => `
            opacity: ${t};
            transform: translateY(${u * y}px);
        `,
    };
}
