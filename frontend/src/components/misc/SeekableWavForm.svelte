<script lang="ts">
    import { onDestroy, onMount, tick } from "svelte";
    import { get } from "svelte/store";
    import {
        audioStore,
        audioPlayerState,
        resetTrackTimer,
        userTapped,
    } from "../../stores/AudioPlayerStore";

    export let audioUrl: string | null = null;

    export let height = 26;
    export let barWidth = 2;
    export let barGap = 1;
    export let zoom = 1;

    export let baseColor = "lime";
    export let playedColor = "hotpink";

    export let enableSeek = true;
    export let seekWhileScrolling = false;
    export let scrollLockThresholdPx = 10;

    export let mirrorScale = 0.55; // bottom is smaller than top
    export let gapPx = 4; // separation band thickness
    export let gapOpacity = 0.12; // how visible the band is
    export let minBarPx = 1;

    export let bottomFadeStart = 0.0;
    // if true, a tap/drag seek will start playback if currently paused/idle
    export let autoPlayOnSeek = false;

    // timeouts
    export let fetchTimeoutMs = 15000;
    export let decodeTimeoutMs = 9000;

    type VizStatus =
        | "Idle"
        | "Loading"
        | "Decoding"
        | "Computing peaks"
        | "Ready"
        | "Error";
    let status: VizStatus = "Idle";
    let decodeError: string | null = null;

    let wrapEl: HTMLDivElement;
    let canvasEl: HTMLCanvasElement;

    let rawData: Float32Array | null = null;
    let duration = 0;

    let peaks: number[] = [];
    let displayPeaks: number[] = [];

    let raf = 0;
    let resizeObserver: ResizeObserver | null = null;

    let jobId = 0;
    let decodeAbort: AbortController | null = null;

    // cached recompute keys
    let lastBarCount = 0;
    let lastCssW = 0;
    let lastRawLen = 0;

    // morph animation
    let morphActive = false;
    let morphStart = 0;
    let morphDur = 220;
    let morphFrom: number[] = [];
    let morphTo: number[] = [];

    function withTimeout<T>(
        p: Promise<T>,
        ms: number,
        label: string,
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const t = setTimeout(
                () => reject(new Error(`${label} timed out after ${ms}ms`)),
                ms,
            );
            p.then(
                (v) => {
                    clearTimeout(t);
                    resolve(v);
                },
                (e) => {
                    clearTimeout(t);
                    reject(e);
                },
            );
        });
    }

    function easeInOutCubic(x: number) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }
    function lerp(a: number, b: number, t: number) {
        return a + (b - a) * t;
    }

    function ensureDisplayLength(n: number) {
        if (displayPeaks.length === n) return;
        const next = new Array(n).fill(0);
        for (let i = 0; i < Math.min(displayPeaks.length, n); i++)
            next[i] = displayPeaks[i];
        displayPeaks = next;
    }

    function startMorph(to: number[], ms = 220) {
        const n = to.length;
        ensureDisplayLength(n);

        morphFrom = displayPeaks.slice();
        morphTo = to.slice();
        morphStart = performance.now();
        morphDur = Math.max(1, ms);
        morphActive = true;
    }

    function stepMorph(now: number) {
        if (!morphActive) return;

        const p = Math.min(1, (now - morphStart) / morphDur);
        const e = easeInOutCubic(p);

        const n = morphTo.length;
        ensureDisplayLength(n);

        for (let i = 0; i < n; i++) {
            displayPeaks[i] = lerp(morphFrom[i] ?? 0, morphTo[i] ?? 0, e);
        }

        if (p >= 1) {
            morphActive = false;
            displayPeaks = morphTo.slice();
        }
    }

    function getAudio() {
        return get(audioStore);
    }

    function getCurrentTime() {
        const a = getAudio();
        return a?.currentTime ?? 0;
    }

    function getDuration() {
        // prefer decoded duration; fallback to media element
        const a = getAudio();
        const d = duration || (a?.duration ?? 0);
        return isFinite(d) ? d : 0;
    }

    function getProgress() {
        const d = getDuration();
        if (d <= 0) return 0;
        return getCurrentTime() / d;
    }

    function calcCanvasWidth(): number {
        const minW = wrapEl?.clientWidth ?? 300;
        return Math.max(1, Math.floor(minW * Math.max(1, zoom)));
    }

    let resizeRaf = 0;
    function requestResize() {
        if (resizeRaf) return;
        resizeRaf = requestAnimationFrame(() => {
            resizeRaf = 0;
            resizeCanvas();
        });
    }

    function resizeCanvas() {
        if (!canvasEl || !wrapEl) return;

        const dpr = window.devicePixelRatio || 1;
        const cssW = calcCanvasWidth();

        canvasEl.style.width = `${cssW}px`;
        canvasEl.width = Math.max(1, Math.floor(cssW * dpr));
        canvasEl.height = Math.max(1, Math.floor(height * dpr));

        const g = canvasEl.getContext("2d");
        if (!g) return;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);

        // if we have raw data, we might need to recompute peaks for new width
        if (rawData) {
            const cssWNow = parseFloat(
                canvasEl.style.width || `${canvasEl.clientWidth}`,
            );
            const barCountNow = Math.max(
                1,
                Math.floor((cssWNow + barGap) / (barWidth + barGap)),
            );

            const needsRecompute =
                !peaks.length ||
                lastRawLen !== rawData.length ||
                lastBarCount !== barCountNow ||
                Math.abs(lastCssW - cssWNow) >= 1;

            if (needsRecompute) {
                lastCssW = cssWNow;
                lastBarCount = barCountNow;
                lastRawLen = rawData.length;

                computePeaks();
            }
        }

        draw();
    }

    function computePeaks() {
        if (!rawData || !canvasEl) return;

        status = "Computing peaks";

        const cssW = parseFloat(
            canvasEl.style.width || `${canvasEl.clientWidth}`,
        );
        const barCount = Math.max(
            1,
            Math.floor((cssW + barGap) / (barWidth + barGap)),
        );
        const blockSize = Math.max(1, Math.floor(rawData.length / barCount));

        const nextPeaks = new Array(barCount);
        let maxPeak = 0;

        // sample down a bit so it’s not expensive
        const SAMPLES_PER_BAR = 1024;

        for (let i = 0; i < barCount; i++) {
            let peak = 0;
            const start = i * blockSize;
            const end = Math.min(rawData.length, start + blockSize);
            const span = end - start;

            if (span > 0) {
                const step = Math.max(1, Math.floor(span / SAMPLES_PER_BAR));
                for (let j = start; j < end; j += step) {
                    const v = Math.abs(rawData[j]);
                    if (v > peak) peak = v;
                }
            }

            nextPeaks[i] = peak;
            if (peak > maxPeak) maxPeak = peak;
        }

        if (maxPeak > 0) {
            for (let i = 0; i < nextPeaks.length; i++)
                nextPeaks[i] = nextPeaks[i] / maxPeak;
        }

        peaks = nextPeaks;

        // morph to new peaks (smooth)
        if (peaks.length) {
            if (!displayPeaks.length)
                displayPeaks = new Array(peaks.length).fill(0);
            startMorph(peaks, 180);
            status = "Ready";
        } else {
            displayPeaks = [];
            status = "Idle";
        }
    }
    function drawBaseline(
        g: CanvasRenderingContext2D,
        cssW: number,
        cssH: number,
    ) {
        const midY = cssH / 2;

        // separation band
        g.save();
        g.globalAlpha = gapOpacity;
        g.fillStyle = "#000";
        g.fillRect(0, midY - gapPx / 2, cssW, gapPx);
        g.restore();

        // baseline line
        g.fillStyle = baseColor;
        g.fillRect(0, midY, cssW, 1);
    }

    function drawBars(
        g: CanvasRenderingContext2D,
        cssH: number,
        color: string,
        clipW: number | null,
    ) {
        const cssW = parseFloat(
            canvasEl.style.width || `${canvasEl.clientWidth}`,
        );
        const midY = cssH / 2;

        const topMax = midY - gapPx / 2; // bottom edge of top region
        const botMax = midY + gapPx / 2; // top edge of bottom region

        const topH = topMax; // space available above the gap
        const botH = cssH - botMax; // space available below the gap

        // clip to played region if needed
        if (clipW != null) {
            g.save();
            g.beginPath();
            g.rect(0, 0, clipW, cssH);
            g.clip();
        }

        // ---------- TOP (full opacity, untouched by bottom fade) ----------
        g.save();
        g.fillStyle = color;

        for (let i = 0; i < displayPeaks.length; i++) {
            const v = displayPeaks[i] || 0;
            const x = i * (barWidth + barGap);

            const hTop = Math.max(minBarPx, v * topH);
            const yTop = topMax - hTop;
            g.fillRect(x, yTop, barWidth, hTop);
        }
        g.restore();

        // ---------- BOTTOM (slightly less opaque + fades out to 0) ----------
        // You asked: "bottom generally slightly less opaque"
        // tweak this number as you like
        const bottomBaseAlpha = 0.45;

        // 1) draw bottom bars in a bottom-only clip
        g.save();
        g.beginPath();
        g.rect(0, botMax, cssW, cssH - botMax);
        g.clip();

        g.globalAlpha = bottomBaseAlpha;
        g.fillStyle = color;

        for (let i = 0; i < displayPeaks.length; i++) {
            const v = displayPeaks[i] || 0;
            const x = i * (barWidth + barGap);

            const hBot = Math.max(minBarPx, v * botH * mirrorScale);
            const yBot = botMax;
            g.fillRect(x, yBot, barWidth, hBot);
        }

        // 2) apply fade mask ONLY to bottom region (does not affect top)
        g.globalCompositeOperation = "destination-in";

        const grad = g.createLinearGradient(0, botMax, 0, cssH);

        // full at top of bottom region
        grad.addColorStop(0, "rgba(255,255,255,1)");

        // optional: keep a bit solid before fading (0..1)
        if (bottomFadeStart > 0) {
            grad.addColorStop(
                Math.min(0.99, bottomFadeStart),
                "rgba(255,255,255,1)",
            );
        }

        // fade to 0 at the bottom
        grad.addColorStop(1, "rgba(255,255,255,0)");

        g.fillStyle = grad;
        g.fillRect(0, botMax, cssW, cssH - botMax);

        g.restore();

        // restore played clip if we used it
        if (clipW != null) g.restore();
    }

    function draw() {
        if (!canvasEl) return;
        const g = canvasEl.getContext("2d");
        if (!g) return;

        const cssW = parseFloat(
            canvasEl.style.width || `${canvasEl.clientWidth}`,
        );
        const cssH = height;

        g.clearRect(0, 0, cssW, cssH);

        if (!displayPeaks.length) {
            drawBaseline(g, cssW, cssH);
            return;
        }

        // 1) base waveform (unplayed)
        drawBars(g, cssH, baseColor, null);

        // 2) played overlay clipped to progress width
        const playedW = cssW * getProgress();
        if (playedW > 0) {
            drawBars(g, cssH, playedColor, playedW);
        }

        // 3) separation band (gap) on top so it’s crisp
        const midY = cssH / 2;
        g.save();
        g.globalAlpha = gapOpacity;
        g.fillStyle = "#000";
        g.fillRect(0, midY - gapPx / 2, cssW, gapPx);
        g.restore();

        // 4) playhead line

        const topMax = midY - gapPx / 2;
        g.fillStyle = "#fff";
        g.fillRect(playedW, 0, 1, topMax);
    }

    function hardCancelJobs() {
        decodeAbort?.abort();
        decodeAbort = null;
        morphActive = false;
    }

    async function loadAndDecode(url: string, signal: AbortSignal) {
        status = "Loading";

        // IMPORTANT: if your signed URL is cacheable you can change this
        const resp = await withTimeout(
            fetch(url, {
                method: "GET",
                mode: "cors",
                credentials: "omit",
                cache: "no-store",
                signal,
            }),
            fetchTimeoutMs,
            "Waveform fetch",
        );

        if (!resp.ok) throw new Error(`Waveform fetch failed (${resp.status})`);

        const buf = await withTimeout(
            resp.arrayBuffer(),
            fetchTimeoutMs,
            "Waveform read",
        );

        status = "Decoding";

        const AC = (window.AudioContext ||
            (window as any).webkitAudioContext) as typeof AudioContext;
        const audioCtx = new AC();

        try {
            const audioBuffer = await withTimeout(
                audioCtx.decodeAudioData(buf.slice(0)),
                decodeTimeoutMs,
                "decodeAudioData",
            );
            duration = audioBuffer.duration;
            rawData = audioBuffer.getChannelData(0);
        } finally {
            await audioCtx.close().catch(() => {});
        }
    }

    function seekFromClientX(clientX: number) {
        const a = getAudio();
        if (!a) return;

        const d = getDuration();
        if (!canvasEl || d <= 0) return;

        const rect = canvasEl.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const pct = x / rect.width;

        userTapped.set(true);
        resetTrackTimer();

        a.currentTime = pct * d;

        if (autoPlayOnSeek) {
            const state = get(audioPlayerState);
            if (state !== "Playing") {
                // don’t call your internal play wrapper here (it does timer logic),
                // just call the element directly:
                a.play().catch(() => {});
            }
        }
    }

    // touch-safe seek (your logic)
    let dragging = false;
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let decided = false;
    let isScrollGesture = false;

    function resetPointerState() {
        dragging = false;
        pointerId = null;
        decided = false;
        isScrollGesture = false;
    }

    function onPointerDown(e: PointerEvent) {
        if (!enableSeek) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;

        dragging = true;
        pointerId = e.pointerId;
        startX = e.clientX;
        startY = e.clientY;
        decided = false;
        isScrollGesture = false;

        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
        if (!dragging || pointerId !== e.pointerId) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (!decided) {
            const adx = Math.abs(dx);
            const ady = Math.abs(dy);

            if (adx < scrollLockThresholdPx && ady < scrollLockThresholdPx)
                return;

            decided = true;
            isScrollGesture = ady > adx;

            if (isScrollGesture && !seekWhileScrolling) {
                (e.currentTarget as HTMLElement).releasePointerCapture?.(
                    e.pointerId,
                );
                return;
            }
        }

        if (isScrollGesture && !seekWhileScrolling) return;

        e.preventDefault?.();
        seekFromClientX(e.clientX);
    }

    function onPointerUp(e: PointerEvent) {
        if (pointerId !== e.pointerId) return;

        // tap-to-seek if they didn’t move enough to decide
        if (!decided && enableSeek) {
            seekFromClientX(e.clientX);
        }

        resetPointerState();
    }

    function onPointerCancel(e: PointerEvent) {
        if (pointerId !== e.pointerId) return;
        resetPointerState();
    }

    function startLoop() {
        const loop = (now: number) => {
            raf = requestAnimationFrame(loop);
            stepMorph(now);
            draw();
        };
        raf = requestAnimationFrame(loop);
    }

    // URL change behavior
    let lastUrl: string | null = null;

    async function handleUrlChange(url: string, token: number) {
        decodeError = null;
        hardCancelJobs();

        status = "Loading";
        peaks = [];
        displayPeaks = [];
        rawData = null;
        duration = 0;

        draw();

        decodeAbort = new AbortController();

        try {
            await loadAndDecode(url, decodeAbort.signal);
        } catch (err: any) {
            const aborted =
                decodeAbort?.signal.aborted || err?.name === "AbortError";
            if (aborted) return;

            decodeError = err?.message ?? "Waveform decode failed";
            status = "Error";
            return;
        }

        if (token !== jobId) return;

        // reset recompute keys for new data
        lastBarCount = 0;
        lastCssW = 0;
        lastRawLen = 0;

        requestResize();
        await tick();

        if (token !== jobId) return;

        computePeaks();
    }

    onMount(async () => {
        await tick();

        resizeObserver = new ResizeObserver(() => requestResize());
        if (wrapEl) resizeObserver.observe(wrapEl);

        requestResize();
        startLoop();
    });

    $: {
        if (!audioUrl) {
            if (lastUrl !== null) lastUrl = null;
            const token = ++jobId;

            hardCancelJobs();
            decodeError = null;
            status = "Idle";
            peaks = [];
            displayPeaks = [];
            rawData = null;
            duration = 0;

            draw();
        } else if (audioUrl !== lastUrl) {
            lastUrl = audioUrl;
            const token = ++jobId;
            handleUrlChange(audioUrl, token).catch((err) => {
                const aborted =
                    decodeAbort?.signal.aborted || err?.name === "AbortError";
                if (aborted) return;

                decodeError = err?.message ?? "Waveform error";
                status = "Error";
            });
        }
    }

    $: {
        height;
        barWidth;
        barGap;
        zoom;
        requestResize();
    }

    onDestroy(() => {
        cancelAnimationFrame(raf);
        cancelAnimationFrame(resizeRaf);
        resizeObserver?.disconnect();
        decodeAbort?.abort();
    });
</script>

<div class="wrap" bind:this={wrapEl}>
    <div class="inner">
        <canvas
            bind:this={canvasEl}
            style="height: {height}px;"
            on:pointerdown={onPointerDown}
            on:pointermove|nonpassive={onPointerMove}
            on:pointerup={onPointerUp}
            on:pointercancel={onPointerCancel}
            on:pointerleave={onPointerUp}
        />
    </div>
</div>

{#if decodeError}
    <p class="err">{decodeError}</p>
{/if}

<style>
    .wrap {
        width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        cursor: pointer;
    }

    .inner {
        width: fit-content;
    }
    canvas {
        display: block;
        touch-action: pan-y; /* allows vertical scroll; we preventDefault only on scrub */
    }
    .err {
        font-size: 10pt;
        opacity: 0.7;
        margin-top: 6px;
    }
</style>
