<script lang="ts">
    import "./TrafficChart.css";

    /*
        Views, visitors and visits per day as lines on one shared count axis
        (they're all counts of the same thing, so one scale is honest). Each
        series keeps its own color whichever are shown; the page's tiles are the
        legend, and the tooltip names every value. Hover, tap, or focus the
        chart and use the arrow keys to read a day: a crosshair and a tooltip
        with all the shown values.
    */
    type Day = { day: string } & Record<string, number | string>;
    export let days: Day[];
    export let series: { id: string; label: string; color: string }[];

    const HEIGHT = 260;
    const PAD = { top: 14, right: 12, bottom: 28, left: 40 };

    let width = 640;
    let hovered: number | null = null;

    const valueOf = (d: Day, id: string) => Number(d[id]) || 0;

    // a round axis top: 1, 2 or 5 x 10^n, at least 4 so small counts still get steps
    function niceMax(max: number) {
        if (max <= 4) return 4;
        const power = 10 ** Math.floor(Math.log10(max));
        const step = [1, 2, 5, 10].find((m) => m * power >= max) ?? 10;
        return step * power;
    }

    $: max = niceMax(Math.max(0, ...days.flatMap((d) => series.map((s) => valueOf(d, s.id)))));
    $: ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
    $: plotW = Math.max(0, width - PAD.left - PAD.right);
    $: plotH = HEIGHT - PAD.top - PAD.bottom;
    $: x = (i: number) => PAD.left + (days.length > 1 ? (i / (days.length - 1)) * plotW : plotW / 2);
    $: y = (value: number) => PAD.top + plotH - (value / max) * plotH;

    /*
        A smooth line through every point (monotone cubic, Fritsch-Carlson):
        rounded corners, but it never swings past a point's value, so a quiet
        day never dips below zero and a peak is never drawn higher than it was.
    */
    function smoothPath(points: [number, number][]) {
        const n = points.length;
        if (n === 0) return "";
        if (n < 3) return points.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join("");

        // slope of each segment, then a tangent at each point
        const slopes = points.slice(1).map(([px, py], i) => (py - points[i][1]) / (px - points[i][0] || 1));
        const tangents = points.map((_, i) => {
            if (i === 0) return slopes[0];
            if (i === n - 1) return slopes[n - 2];
            const [a, b] = [slopes[i - 1], slopes[i]];
            return a * b <= 0 ? 0 : (2 * a * b) / (a + b); // flat at a peak or dip
        });

        let d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
        for (let i = 0; i < n - 1; i++) {
            const [x0, y0] = points[i];
            const [x1, y1] = points[i + 1];
            const third = (x1 - x0) / 3;
            d +=
                `C${(x0 + third).toFixed(1)} ${(y0 + tangents[i] * third).toFixed(1)} ` +
                `${(x1 - third).toFixed(1)} ${(y1 - tangents[i + 1] * third).toFixed(1)} ` +
                `${x1.toFixed(1)} ${y1.toFixed(1)}`;
        }
        return d;
    }

    $: lines = series.map((s) => ({
        ...s,
        path: smoothPath(days.map((d, i) => [x(i), y(valueOf(d, s.id))])),
    }));

    const formatDay = (day: string, long = false) =>
        new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            ...(long ? { weekday: "short", year: "numeric" } : {}),
            timeZone: "UTC",
        });

    // a few dates along the bottom, about one per 80px, always the first and last
    $: dateLabels = (() => {
        if (!days.length) return [];
        const count = Math.max(2, Math.min(days.length, Math.floor(plotW / 80)));
        const picks = new Set(Array.from({ length: count }, (_, k) => Math.round((k / (count - 1 || 1)) * (days.length - 1))));
        return [...picks].map((i) => ({ i, text: formatDay(days[i].day) }));
    })();

    function pointAt(clientX: number, target: Element) {
        const rect = target.getBoundingClientRect();
        const px = clientX - rect.left;
        if (days.length <= 1) return 0;
        return Math.min(days.length - 1, Math.max(0, Math.round(((px - PAD.left) / plotW) * (days.length - 1))));
    }

    function onKey(event: KeyboardEvent) {
        if (!days.length) return;
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            const step = event.key === "ArrowRight" ? 1 : -1;
            hovered = Math.min(days.length - 1, Math.max(0, (hovered ?? (step > 0 ? -1 : days.length)) + step));
        } else if (event.key === "Escape") {
            hovered = null;
        }
    }

    $: tipLeft = hovered === null ? 0 : x(hovered);
    $: tipOnLeft = tipLeft > width / 2; // flip the tooltip so it stays inside the chart
</script>

<div class="tc" bind:clientWidth={width}>
    <!-- the chart reads arrow keys and pointer moves to step through days -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex a11y-no-noninteractive-element-interactions -->
    <svg
        class="tc_svg"
        {width}
        height={HEIGHT}
        viewBox="0 0 {width} {HEIGHT}"
        role="img"
        tabindex="0"
        aria-label="{series.map((s) => s.label).join(', ')} per day, {formatDay(days[0]?.day ?? '')} to {formatDay(
            days[days.length - 1]?.day ?? '',
        )}. Use the left and right arrow keys to read each day."
        on:pointermove={(event) => (hovered = pointAt(event.clientX, event.currentTarget))}
        on:pointerdown={(event) => (hovered = pointAt(event.clientX, event.currentTarget))}
        on:pointerleave={(event) => event.pointerType === "mouse" && (hovered = null)}
        on:keydown={onKey}
        on:blur={() => (hovered = null)}
    >
        {#each ticks as tick}
            <line class="tc_grid" class:tc_base={tick === 0} x1={PAD.left} x2={PAD.left + plotW} y1={y(tick)} y2={y(tick)} />
            <text class="tc_axis" x={PAD.left - 8} y={y(tick)} text-anchor="end" dominant-baseline="middle"
                >{tick.toLocaleString()}</text
            >
        {/each}

        {#each dateLabels as label}
            <text
                class="tc_axis"
                x={x(label.i)}
                y={HEIGHT - 8}
                text-anchor={days.length > 1 && label.i === 0 ? "start" : days.length > 1 && label.i === days.length - 1 ? "end" : "middle"}
                >{label.text}</text
            >
        {/each}

        {#if hovered !== null}
            <line class="tc_cross" x1={x(hovered)} x2={x(hovered)} y1={PAD.top} y2={PAD.top + plotH} />
        {/if}

        {#each lines as line (line.id)}
            <path class="tc_line" d={line.path} style:stroke={line.color} />
            <!-- a lone day has no line to draw, so it gets a dot -->
            {#if days.length === 1}
                <circle class="tc_dot" cx={x(0)} cy={y(valueOf(days[0], line.id))} r="4" style:fill={line.color} />
            {/if}
        {/each}


        {#if hovered !== null && days[hovered]}
            {#each lines as line (line.id)}
                <circle class="tc_dot tc_dotOn" cx={x(hovered)} cy={y(valueOf(days[hovered], line.id))} r="4.5" style:fill={line.color} />
            {/each}
        {/if}
    </svg>

    {#if hovered !== null && days[hovered]}
        <div class="tc_tip" class:tc_tipLeft={tipOnLeft} style:left="{tipLeft}px" style:top="{PAD.top}px" aria-hidden="true">
            <span class="tc_tipDay">{formatDay(days[hovered].day, true)}</span>
            {#each series as s}
                <span class="tc_tipRow">
                    <span class="tc_swatch" style:background={s.color}></span>
                    <span class="tc_tipName">{s.label}</span>
                    <span class="tc_tipValue">{valueOf(days[hovered], s.id).toLocaleString()}</span>
                </span>
            {/each}
        </div>
    {/if}

    <!-- what the tooltip shows, for screen readers -->
    <p class="tc_live" aria-live="polite">
        {#if hovered !== null && days[hovered]}
            {formatDay(days[hovered].day, true)}: {series
                .map((s) => `${valueOf(days[hovered ?? 0], s.id).toLocaleString()} ${s.label.toLowerCase()}`)
                .join(", ")}
        {/if}
    </p>
</div>
