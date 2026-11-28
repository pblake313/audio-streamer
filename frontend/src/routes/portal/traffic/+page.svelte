<script lang="ts">
    import "./TrafficPage.css";

    import { onMount } from "svelte";
    import TrafficChart from "../../../components/Traffic/TrafficChart.svelte";
    import ErrorNotice from "../../../components/errors/ErrorNotice.svelte";
    import Loader from "../../../components/loaders/Loader.svelte";
    import { authorizedFetch } from "../../../helpers/Fetchers/authorizedFetch";
    import DateRangePicker from "../../../components/UI/DateRangePicker.svelte";

    /*
        Site traffic (GET /secure/stats/traffic). Lives under /portal, so only a
        logged-in user gets here. Your own visits while logged in aren't counted.
    */
    type Counted = { name: string; count: number };
    type Traffic = {
        days: { day: string; views: number; visitors: number; visits: number }[];
        totals: { views: number; visitors: number; visits: number };
        pages: Counted[];
        referrers: Counted[];
        devices: Counted[];
    };
    type Measure = "views" | "visitors" | "visits";

    /*
        One color per measure, the same wherever it shows (tile, line, tooltip),
        even when the others are hidden. Validated as a set, all pairs, against
        the site's #222 surface: blue, orange, aqua.
    */
    const MEASURES: { id: Measure; label: string; hint: string; color: string }[] = [
        { id: "views", label: "Views", hint: "Pages opened", color: "#338ced" },
        { id: "visitors", label: "Visitors", hint: "Unique people per day, added up", color: "#e76624" },
        { id: "visits", label: "Visits", hint: "Sessions: one per browser tab visit", color: "#00a888" },
    ];

    // days are UTC on the server, so the range is too
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const MAX_DAYS = 366; // the server caps a range at a year
    const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
    const today = isoDay(Date.now());

    // the range on show: the last 30 days to start with
    let from = isoDay(Date.now() - 29 * ONE_DAY);
    let to = today;
    let shown: Record<Measure, boolean> = { views: true, visitors: true, visits: true };
    let data: Traffic | null = null;
    let loading = true;
    let error: string | null = null;

    // the picker (quick picks or any two days); a range over a year keeps its
    // end day and is trimmed to the year before it
    function onRangeChange(start: string, end: string) {
        const longest = Date.parse(`${end}T00:00:00Z`) - (MAX_DAYS - 1) * ONE_DAY;
        from = Date.parse(`${start}T00:00:00Z`) < longest ? isoDay(longest) : start;
        to = end;
        load();
    }

    async function load() {
        loading = true;
        error = null;
        try {
            data = await authorizedFetch<Traffic>(`/secure/stats/traffic?from=${from}&to=${to}`);
        } catch (err: any) {
            error = err?.message ?? "Couldn't load the traffic.";
        } finally {
            loading = false;
        }
    }

    onMount(load);

    // a measure can be hidden from the chart, but never the last one
    function toggle(id: Measure) {
        const visible = MEASURES.filter((m) => shown[m.id]).length;
        if (shown[id] && visible === 1) return;
        shown = { ...shown, [id]: !shown[id] };
    }

    $: chartSeries = MEASURES.filter((m) => shown[m.id]);
    $: rangeLabel = data ? `${formatDate(data.days[0]?.day)} – ${formatDate(data.days[data.days.length - 1]?.day)}` : "";
    const formatDate = (day: string | undefined) =>
        day
            ? new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
              })
            : "";
    $: deviceTotal = data?.devices.reduce((n, d) => n + d.count, 0) ?? 0;

    const share = (count: number, total: number) => (total ? Math.round((count / total) * 100) : 0);
    // the biggest row fills the track, the rest scale to it
    const widthOf = (count: number, list: Counted[]) => `${list[0]?.count ? (count / list[0].count) * 100 : 0}%`;
</script>

<svelte:head>
    <title>Traffic</title>
</svelte:head>

<div class="traffic_container">
    <header class="traffic_topper">
        <div>
            <p class="traffic_eyebrow">Insights</p>
            <h2>Traffic</h2>
            <p class="traffic_subtitle">
                Who's visiting the public site. Counted anonymously; your own visits while logged in aren't included.
            </p>
        </div>

        <!-- the range: quick picks, or click any two days (same picker as pattsway) -->
        <div class="traffic_range">
            <DateRangePicker {from} {to} max={today} label="Date range" disabled={loading} onchange={onRangeChange} />
        </div>
    </header>

    {#if loading && !data}
        <Loader />
    {:else if error}
        <ErrorNotice message={error} title="Couldn't load the traffic" onRetry={load} />
    {:else if data}
        <div class="traffic_body" class:traffic_bodyLoading={loading}>
            <!-- the headline numbers, and the chart's legend: each tile shows or hides its line -->
            <div class="traffic_tiles" role="group" aria-label="Lines shown in the chart">
                {#each MEASURES as m}
                    <button
                        type="button"
                        class="traffic_tile"
                        class:traffic_tileOff={!shown[m.id]}
                        style="--series: {m.color}"
                        aria-pressed={shown[m.id]}
                        title={shown[m.id] ? `Hide ${m.label.toLowerCase()} in the chart` : `Show ${m.label.toLowerCase()} in the chart`}
                        on:click={() => toggle(m.id)}
                    >
                        <span class="traffic_tileLabel"><span class="traffic_swatch"></span>{m.label}</span>
                        <span class="traffic_tileValue">{data.totals[m.id].toLocaleString()}</span>
                        <span class="traffic_tileHint">{m.hint}</span>
                    </button>
                {/each}
            </div>

            <section class="traffic_card">
                <div class="traffic_cardHead">
                    <h5 class="traffic_cardTitle">Per day</h5>
                    <span class="traffic_cardHint traffic_cardHintInline">{rangeLabel}</span>
                </div>
                <TrafficChart days={data.days} series={chartSeries} />
            </section>

            <div class="traffic_lists">
                <section class="traffic_card">
                    <h5 class="traffic_cardTitle">Top pages</h5>
                    <p class="traffic_cardHint">By views</p>
                    {#if data.pages.length}
                        <ol class="traffic_rows">
                            {#each data.pages as row}
                                <li class="traffic_row">
                                    <span class="traffic_rowBar" style:width={widthOf(row.count, data.pages)}></span>
                                    <span class="traffic_rowName" title={row.name}>{row.name}</span>
                                    <span class="traffic_rowCount">{row.count.toLocaleString()}</span>
                                </li>
                            {/each}
                        </ol>
                    {:else}
                        <p class="traffic_empty">No views yet.</p>
                    {/if}
                </section>

                <section class="traffic_card">
                    <h5 class="traffic_cardTitle">Where visits came from</h5>
                    <p class="traffic_cardHint">"Direct" is a typed URL, a bookmark or an app that hides it</p>
                    {#if data.referrers.length}
                        <ol class="traffic_rows">
                            {#each data.referrers as row}
                                <li class="traffic_row">
                                    <span class="traffic_rowBar" style:width={widthOf(row.count, data.referrers)}></span>
                                    <span class="traffic_rowName">{row.name}</span>
                                    <span class="traffic_rowCount">{row.count.toLocaleString()}</span>
                                </li>
                            {/each}
                        </ol>
                    {:else}
                        <p class="traffic_empty">No visits yet.</p>
                    {/if}

                    <h5 class="traffic_cardTitle traffic_cardTitleSpaced">Devices</h5>
                    <p class="traffic_cardHint">Share of visits</p>
                    {#if deviceTotal}
                        <ol class="traffic_rows">
                            {#each data.devices as row}
                                <li class="traffic_row">
                                    <span class="traffic_rowBar" style:width="{share(row.count, deviceTotal)}%"></span>
                                    <span class="traffic_rowName traffic_rowNameCap">{row.name}</span>
                                    <span class="traffic_rowCount">{share(row.count, deviceTotal)}%</span>
                                </li>
                            {/each}
                        </ol>
                    {:else}
                        <p class="traffic_empty">No visits yet.</p>
                    {/if}
                </section>
            </div>
        </div>
    {/if}
</div>
