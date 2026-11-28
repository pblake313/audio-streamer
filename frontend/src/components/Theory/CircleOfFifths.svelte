<script lang="ts">
    import "./CircleOfFifths.css";

    import {
        keyAt,
        keyHue,
        keyName,
        segmentLabel,
        signatureLabel,
        signatureOf,
        type KeyRef,
        type Mode,
    } from "../../helpers/Theory/keys";
    import { theoryPath } from "../../helpers/Theory/urls";

    export let selected: KeyRef;
    export let onSelect: (key: KeyRef) => void;

    const C = 200;
    const RINGS: Record<Mode, [number, number]> = {
        major: [134, 196],
        minor: [84, 134],
    };
    function point(r: number, deg: number) {
        const a = ((deg - 90) * Math.PI) / 180;
        return [C + r * Math.cos(a), C + r * Math.sin(a)];
    }

    const MODES: Mode[] = ["major", "minor"];
    const SEGMENTS = MODES.flatMap((mode) =>
        Array.from({ length: 12 }, (_, pos) => {
            const [lx, ly] = point(mode === "major" ? 172 : 109, pos * 30);
            const [sx, sy] = point(147, pos * 30);
            return {
                pos,
                mode,
                path: wedge(pos, RINGS[mode]),
                label: segmentLabel(pos, mode),
                hue: keyHue(pos),
                lx, ly, sx, sy,
            };
        }),
    );

    function wedge(pos: number, [r0, r1]: [number, number]) {
        const a0 = pos * 30 - 15;
        const a1 = pos * 30 + 15;
        const [x0, y0] = point(r1, a0);
        const [x1, y1] = point(r1, a1);
        const [x2, y2] = point(r0, a1);
        const [x3, y3] = point(r0, a0);
        return `M${x0} ${y0} A${r1} ${r1} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 0 0 ${x3} ${y3}Z`;
    }

    // the six chords that belong to a key sit in the 3 segments around it, both rings
    function inKey(pos: number, key: KeyRef) {
        const d = (((pos - key.pos) % 12) + 12) % 12;
        return d === 0 || d === 1 || d === 11;
    }

    /*
        Each segment is a real link to its key's page (so search engines can
        follow the circle to every key, and ctrl/cmd/middle-click opens a new
        tab), but a plain click just switches keys in place.
    */
    function pick(event: MouseEvent, pos: number, mode: Mode) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        onSelect(keyAt(selected, pos, mode));
    }

    function handleKeydown(event: KeyboardEvent) {
        const moves: Record<string, () => KeyRef> = {
            ArrowRight: () => keyAt(selected, selected.pos + 1, selected.mode),
            ArrowLeft: () => keyAt(selected, selected.pos - 1, selected.mode),
            ArrowUp: () => keyAt(selected, selected.pos, "major"),
            ArrowDown: () => keyAt(selected, selected.pos, "minor"),
        };
        const move = moves[event.key];
        if (!move) return;
        event.preventDefault();
        onSelect(move());
    }

    $: sig = signatureOf(selected);
</script>

<!-- arrow keys on the circle itself move the selection; segments are click targets -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex a11y-no-noninteractive-element-interactions -->
<svg
    class="cof"
    viewBox="0 0 400 400"
    role="group"
    aria-label="Circle of fifths. Arrow keys move around the circle; up and down switch between major and minor."
    tabindex="0"
    on:keydown={handleKeydown}
>
    {#each SEGMENTS as seg (`${seg.mode}${seg.pos}`)}
        {@const isSelected = seg.pos === selected.pos && seg.mode === selected.mode}
        <!-- the circle itself takes the arrow keys, so segments stay out of the tab order -->
        <a
            href={theoryPath(keyAt(selected, seg.pos, seg.mode))}
            class="cof_segment cof_{seg.mode}"
            style="--h: {seg.hue}"
            class:cof_inKey={inKey(seg.pos, selected)}
            class:cof_selected={isSelected}
            tabindex="-1"
            aria-label={keyName(keyAt(selected, seg.pos, seg.mode))}
            aria-current={isSelected ? "page" : undefined}
            on:click={(event) => pick(event, seg.pos, seg.mode)}
        >
            <path d={seg.path} />
            <text x={seg.lx} y={seg.ly} class="cof_label" class:cof_labelSmall={seg.pos === 6}>
                {seg.label}
            </text>
            {#if seg.mode === "major"}
                <text x={seg.sx} y={seg.sy} class="cof_sig">{signatureLabel(seg.pos)}</text>
            {/if}
        </a>
    {/each}

    <circle class="cof_center" style="--h: {keyHue(selected.pos)}" cx={C} cy={C} r="80" />
    <text x={C} y={C - 6} class="cof_centerCount">
        {sig.count === 0 ? "0" : `${sig.count}${sig.type === "sharp" ? "♯" : "♭"}`}
    </text>
    <text x={C} y={C + 22} class="cof_centerLabel">
        {sig.count === 0 ? "no sharps or flats" : `${sig.type}${sig.count === 1 ? "" : "s"}`}
    </text>
</svg>
