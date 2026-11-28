<script lang="ts">
    import { onDestroy } from "svelte";
    import "./DateRangePicker.css";

    /*
        A date range picker: a button showing the range, which opens a calendar.
        (Same design as Amaviri's and pattsway's, ported from pattsway-new.)

          - quick picks across the top (last 7 / 30 / 90 days, this month, last month, this year),
            which apply straight away (`presets={false}` hides them)
          - two months side by side (one on phones), with arrows to page through months
          - click a start day, then an end day; the days between light up as you hover
          - days after `max` can't be picked
          - the footer says what's picked (and how many days), with Cancel / Apply
          - Escape or a click outside closes it without changing anything

        Dates are "YYYY-MM-DD" strings in and out (calendar days, no time zones involved).
    */
    export let from: string;
    export let to: string;
    /** Last day that can be picked, "YYYY-MM-DD" */
    export let max: string | null = null;
    /** Name for screen readers */
    export let label: string = "Date range";
    export let disabled: boolean = false;
    /** Show the quick picks */
    export let presets: boolean = true;
    export let onchange: (from: string, to: string) => void;

    // ---------- date helpers (UTC math on calendar days, so DST never shifts a day)

    const DAY_MS = 86_400_000;

    function parse(day: string) {
        const [y, m, d] = day.split("-").map(Number);
        return Date.UTC(y, m - 1, d);
    }

    function format(ms: number) {
        return new Date(ms).toISOString().slice(0, 10);
    }

    function monthStart(day: string) {
        return day.slice(0, 8) + "01";
    }

    function addMonths(month: string, n: number) {
        const [y, m] = month.split("-").map(Number);
        return format(Date.UTC(y, m - 1 + n, 1));
    }

    function pretty(day: string, withYear = true) {
        return new Date(parse(day)).toLocaleDateString(undefined, {
            timeZone: "UTC",
            month: "short",
            day: "numeric",
            ...(withYear ? { year: "numeric" } : {}),
        });
    }

    function rangeText(a: string, b: string) {
        if (a === b) return pretty(a);
        const sameYear = a.slice(0, 4) === b.slice(0, 4);
        return `${pretty(a, !sameYear)} – ${pretty(b)}`;
    }

    function daysIn(a: string, b: string) {
        return Math.round((parse(b) - parse(a)) / DAY_MS) + 1;
    }

    const WEEKDAYS = Array.from({ length: 7 }, (_, i) =>
        new Date(Date.UTC(2024, 0, 7 + i)).toLocaleDateString(undefined, { timeZone: "UTC", weekday: "narrow" }),
    );

    /** A month's days as weeks (Sunday first), with nulls for the blanks around it */
    function weeksOf(month: string): (string | null)[][] {
        const start = parse(month);
        const first = new Date(start).getUTCDay();
        const [y, m] = month.split("-").map(Number);
        const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
        const cells: (string | null)[] = [...Array(first).fill(null)];
        for (let i = 0; i < count; i++) cells.push(format(start + i * DAY_MS));
        while (cells.length % 7) cells.push(null);
        const weeks: (string | null)[][] = [];
        for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
        return weeks;
    }

    function monthTitle(month: string) {
        return new Date(parse(month)).toLocaleDateString(undefined, { timeZone: "UTC", month: "long", year: "numeric" });
    }

    // ---------- state

    let open = false;
    let root: HTMLDivElement | null = null;
    let trigger: HTMLButtonElement | null = null;

    /** The picked days while the panel is open (applied on Apply) */
    let draftStart = "";
    let draftEnd: string | null = null;
    let hovered: string | null = null;
    /** The right-hand month on show (the left one is the month before) */
    let viewMonth = monthStart(format(Date.now()));

    $: leftMonth = addMonths(viewMonth, -1);
    $: canGoForward = !max || addMonths(viewMonth, 1) <= monthStart(max);

    function openPanel() {
        if (disabled) return;
        draftStart = from;
        draftEnd = to;
        hovered = null;
        viewMonth = monthStart(to || max || format(Date.now()));
        open = true;
    }

    function close(focusTrigger = true) {
        open = false;
        if (focusTrigger) trigger?.focus();
    }

    function pick(day: string) {
        if (max && day > max) return;
        if (!draftStart || draftEnd) {
            // a new range starts here
            draftStart = day;
            draftEnd = null;
        } else if (day < draftStart) {
            draftStart = day;
        } else {
            draftEnd = day;
        }
    }

    function apply() {
        if (!draftStart) return;
        onchange(draftStart, draftEnd ?? draftStart);
        close();
    }

    // ---------- quick picks, counted back from the last day that can be picked (today)

    function lastDayOf(month: string) {
        return format(parse(addMonths(month, 1)) - DAY_MS);
    }

    $: quickPicks = (() => {
        const end = max ?? format(Date.now());
        const thisMonth = monthStart(end);
        const lastMonth = addMonths(thisMonth, -1);
        const back = (n: number) => format(parse(end) - (n - 1) * DAY_MS);
        return [
            { label: "Last 7 days", from: back(7), to: end },
            { label: "Last 30 days", from: back(30), to: end },
            { label: "Last 90 days", from: back(90), to: end },
            { label: "This month", from: thisMonth, to: end },
            { label: "Last month", from: lastMonth, to: lastDayOf(lastMonth) },
            { label: "This year", from: end.slice(0, 4) + "-01-01", to: end },
        ];
    })();

    function pickQuick(q: { from: string; to: string }) {
        draftStart = q.from;
        draftEnd = q.to;
        apply();
    }

    /** The range as it shows while picking: the hovered day stands in for the end */
    $: shownEnd = draftEnd ?? (hovered && draftStart && hovered >= draftStart ? hovered : draftStart);

    // recomputed whenever the draft / hover changes (the template calls it per day)
    $: cellState = (day: string) => ({
        start: day === draftStart,
        end: day === shownEnd,
        inRange: !!draftStart && !!shownEnd && day > draftStart && day < shownEnd,
        disabled: !!max && day > max,
        today: day === (max ?? format(Date.now())),
    });

    // ---------- closing on Escape / a click outside

    function onKeydown(e: KeyboardEvent) {
        if (open && e.key === "Escape") {
            e.preventDefault();
            close();
        }
    }

    function onPointerdown(e: PointerEvent) {
        if (open && root && !root.contains(e.target as Node)) close(false);
    }

    function listen(on: boolean) {
        if (typeof document === "undefined") return;
        const method = on ? "addEventListener" : "removeEventListener";
        document[method]("keydown", onKeydown as EventListener);
        document[method]("pointerdown", onPointerdown as EventListener);
    }

    $: listen(open);

    onDestroy(() => listen(false));
</script>

<div class="drp" bind:this={root}>
    <button
        type="button"
        class="drp_trigger"
        class:drp_trigger_open={open}
        bind:this={trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="{label}: {from && to ? rangeText(from, to) : 'none'}"
        {disabled}
        on:click={() => (open ? close() : openPanel())}
    >
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="15" rx="2" />
            <path d="M3.5 9.5h17M8 3v4M16 3v4" />
        </svg>
        <span>{from && to ? rangeText(from, to) : "Pick dates"}</span>
        <svg class="drp_chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
    </button>

    {#if open}
        <div class="drp_panel" role="dialog" aria-label={label}>
            {#if presets}
                <!-- one click: applies and closes -->
                <div class="drp_quick" role="group" aria-label="Quick picks">
                    {#each quickPicks as q (q.label)}
                        <button
                            type="button"
                            class="drp_chip"
                            class:drp_chip_on={draftStart === q.from && (draftEnd ?? draftStart) === q.to}
                            aria-pressed={draftStart === q.from && (draftEnd ?? draftStart) === q.to}
                            title={rangeText(q.from, q.to)}
                            on:click={() => pickQuick(q)}
                        >
                            {q.label}
                        </button>
                    {/each}
                </div>
            {/if}

            <div class="drp_months">
                {#each [leftMonth, viewMonth] as month, i (month)}
                    <div class="drp_month" class:drp_month_left={i === 0}>
                        <div class="drp_month_head">
                            {#if i === 0}
                                <button type="button" class="drp_nav" aria-label="Previous month" on:click={() => (viewMonth = addMonths(viewMonth, -1))}>
                                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
                                </button>
                            {:else}
                                <!-- phones only show this month, so it gets the back arrow too -->
                                <button
                                    type="button"
                                    class="drp_nav drp_nav_phone"
                                    aria-label="Previous month"
                                    on:click={() => (viewMonth = addMonths(viewMonth, -1))}
                                >
                                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
                                </button>
                            {/if}
                            <p>{monthTitle(month)}</p>
                            {#if i === 1}
                                <button
                                    type="button"
                                    class="drp_nav"
                                    aria-label="Next month"
                                    disabled={!canGoForward}
                                    on:click={() => (viewMonth = addMonths(viewMonth, 1))}
                                >
                                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
                                </button>
                            {:else}
                                <span class="drp_nav_space"></span>
                            {/if}
                        </div>

                        <div class="drp_grid" role="grid" aria-label={monthTitle(month)}>
                            <div class="drp_week drp_weekdays" role="row">
                                {#each WEEKDAYS as w, j (j)}<span role="columnheader">{w}</span>{/each}
                            </div>
                            {#each weeksOf(month) as week, w (w)}
                                <div class="drp_week" role="row">
                                    {#each week as day, j (j)}
                                        {#if day}
                                            {@const st = cellState(day)}
                                            <span
                                                class="drp_cell"
                                                class:drp_in={st.inRange}
                                                class:drp_from={st.start && shownEnd !== draftStart}
                                                class:drp_until={st.end && shownEnd !== draftStart}
                                                role="gridcell"
                                            >
                                                <button
                                                    type="button"
                                                    class="drp_day"
                                                    class:drp_day_edge={st.start || st.end}
                                                    class:drp_day_today={st.today}
                                                    disabled={st.disabled}
                                                    aria-pressed={st.start || st.end || st.inRange}
                                                    aria-label={pretty(day)}
                                                    on:click={() => pick(day)}
                                                    on:pointerenter={() => (hovered = day)}
                                                    on:focus={() => (hovered = day)}
                                                >
                                                    {Number(day.slice(8))}
                                                </button>
                                            </span>
                                        {:else}
                                            <span class="drp_cell" role="gridcell"></span>
                                        {/if}
                                    {/each}
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>

            <div class="drp_foot">
                <p class="drp_summary" aria-live="polite">
                    {#if draftStart && !draftEnd}
                        {pretty(draftStart)} – <span class="drp_hint">pick an end date</span>
                    {:else if draftStart && draftEnd}
                        <strong>{rangeText(draftStart, draftEnd)}</strong>
                        <span class="drp_hint">· {daysIn(draftStart, draftEnd)} day{daysIn(draftStart, draftEnd) === 1 ? "" : "s"}</span>
                    {/if}
                </p>
                <div class="drp_actions">
                    <button type="button" class="drp_btn" on:click={() => close()}>Cancel</button>
                    <button type="button" class="drp_btn drp_btn_primary" disabled={!draftStart} on:click={apply}>Apply</button>
                </div>
            </div>
        </div>
    {/if}
</div>
