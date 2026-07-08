<script lang="ts">
    import { onDestroy, onMount, tick } from "svelte";

    export let audio: HTMLAudioElement | undefined = undefined;
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

    // Keep waveform bars from disappearing.
    // This makes every visible waveform bar at least 1px high.
    export let minBarPx = 1;

    export let noAudioMessage = "No audio preview available.";
    export let audioErrorFallbackMessage =
        "Unable to load this audio preview.";

    // Smooth fade-out duration when changing tracks.
    export let waveformOutMs = 220;

    // If true, seeking starts playback when the audio is paused.
    export let autoPlayOnSeek = false;

    // Timeouts.
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

    // Cached recompute keys.
    let lastBarCount = 0;
    let lastCssW = 0;
    let lastRawLen = 0;

    // Morph animation.
    let morphActive = false;
    let morphStart = 0;
    let morphDur = 220;
    let morphFrom: number[] = [];
    let morphTo: number[] = [];

    // Out transition.
    let isWaveLeaving = false;
    let frozenProgress: number | null = null;

    $: displayedErrorMessage = decodeError;

    $: shouldDrawWaveform =
        displayPeaks.length > 0 &&
        !displayedErrorMessage &&
        (status === "Ready" || isWaveLeaving);

    function sleep(ms: number) {
        return new Promise<void>((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    function nextFrame() {
        return new Promise<void>((resolve) => {
            requestAnimationFrame(() => resolve());
        });
    }

    function withTimeout<T>(
        promise: Promise<T>,
        ms: number,
        label: string,
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(
                    new Error(
                        `${label} timed out after ${ms}ms`,
                    ),
                );
            }, ms);

            promise.then(
                (value) => {
                    clearTimeout(timeout);
                    resolve(value);
                },
                (error) => {
                    clearTimeout(timeout);
                    reject(error);
                },
            );
        });
    }

    function easeInOutCubic(value: number) {
        return value < 0.5
            ? 4 * value * value * value
            : 1 - Math.pow(-2 * value + 2, 3) / 2;
    }

    function lerp(
        start: number,
        end: number,
        progress: number,
    ) {
        return start + (end - start) * progress;
    }

    function ensureDisplayLength(length: number) {
        if (displayPeaks.length === length) return;

        const next = new Array(length).fill(0);

        for (
            let index = 0;
            index < Math.min(displayPeaks.length, length);
            index++
        ) {
            next[index] = displayPeaks[index];
        }

        displayPeaks = next;
    }

    function startMorph(to: number[], ms = 220) {
        const length = to.length;

        ensureDisplayLength(length);

        morphFrom = displayPeaks.slice();
        morphTo = to.slice();
        morphStart = performance.now();
        morphDur = Math.max(1, ms);
        morphActive = true;
    }

    function stepMorph(now: number) {
        if (!morphActive) return;

        const progress = Math.min(
            1,
            (now - morphStart) / morphDur,
        );

        const easedProgress = easeInOutCubic(progress);
        const length = morphTo.length;

        ensureDisplayLength(length);

        for (let index = 0; index < length; index++) {
            displayPeaks[index] = lerp(
                morphFrom[index] ?? 0,
                morphTo[index] ?? 0,
                easedProgress,
            );
        }

        if (progress >= 1) {
            morphActive = false;
            displayPeaks = morphTo.slice();
        }
    }

    function getAudio() {
        return audio;
    }

    function getCurrentTime() {
        const currentAudio = getAudio();

        return currentAudio?.currentTime ?? 0;
    }

    function getDuration() {
        const currentAudio = getAudio();

        const currentDuration =
            duration || currentAudio?.duration || 0;

        return Number.isFinite(currentDuration)
            ? currentDuration
            : 0;
    }

    function getProgress() {
        const currentDuration = getDuration();

        if (currentDuration <= 0) return 0;

        return getCurrentTime() / currentDuration;
    }

    function getDrawProgress() {
        const progress = frozenProgress ?? getProgress();

        return Math.max(
            0,
            Math.min(1, progress || 0),
        );
    }

    function calcCanvasWidth(): number {
        const minimumWidth = wrapEl?.clientWidth ?? 300;

        return Math.max(
            1,
            Math.floor(
                minimumWidth * Math.max(1, zoom),
            ),
        );
    }

    let resizeRaf = 0;

    function requestResize() {
        if (typeof window === "undefined") return;
        if (resizeRaf) return;

        resizeRaf = requestAnimationFrame(() => {
            resizeRaf = 0;
            resizeCanvas();
        });
    }

    function resizeCanvas() {
        if (!canvasEl || !wrapEl) return;

        const dpr = window.devicePixelRatio || 1;
        const cssWidth = calcCanvasWidth();
        const cssHeight = Math.max(
            1,
            Math.floor(height),
        );

        canvasEl.style.width = `${cssWidth}px`;
        canvasEl.style.height = `${cssHeight}px`;

        canvasEl.width = Math.max(
            1,
            Math.floor(cssWidth * dpr),
        );

        canvasEl.height = Math.max(
            1,
            Math.floor(cssHeight * dpr),
        );

        const context = canvasEl.getContext("2d");

        if (!context) return;

        context.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0,
        );

        if (rawData) {
            const currentCssWidth = parseFloat(
                canvasEl.style.width ||
                    `${canvasEl.clientWidth}`,
            );

            const currentBarCount = Math.max(
                1,
                Math.floor(
                    (currentCssWidth + barGap) /
                        (barWidth + barGap),
                ),
            );

            const needsRecompute =
                !peaks.length ||
                lastRawLen !== rawData.length ||
                lastBarCount !== currentBarCount ||
                Math.abs(
                    lastCssW - currentCssWidth,
                ) >= 1;

            if (needsRecompute) {
                lastCssW = currentCssWidth;
                lastBarCount = currentBarCount;
                lastRawLen = rawData.length;

                computePeaks();
            }
        }

        draw();
    }

    function computePeaks() {
        if (!rawData || !canvasEl) return;

        status = "Computing peaks";

        const cssWidth = parseFloat(
            canvasEl.style.width ||
                `${canvasEl.clientWidth}`,
        );

        const barCount = Math.max(
            1,
            Math.floor(
                (cssWidth + barGap) /
                    (barWidth + barGap),
            ),
        );

        const blockSize = Math.max(
            1,
            Math.floor(
                rawData.length / barCount,
            ),
        );

        const nextPeaks = new Array<number>(barCount);

        let maxPeak = 0;

        const samplesPerBar = 1024;

        for (
            let barIndex = 0;
            barIndex < barCount;
            barIndex++
        ) {
            let peak = 0;

            const start = barIndex * blockSize;
            const end = Math.min(
                rawData.length,
                start + blockSize,
            );

            const span = end - start;

            if (span > 0) {
                const step = Math.max(
                    1,
                    Math.floor(
                        span / samplesPerBar,
                    ),
                );

                for (
                    let sampleIndex = start;
                    sampleIndex < end;
                    sampleIndex += step
                ) {
                    const value = Math.abs(
                        rawData[sampleIndex],
                    );

                    if (value > peak) {
                        peak = value;
                    }
                }
            }

            nextPeaks[barIndex] = peak;

            if (peak > maxPeak) {
                maxPeak = peak;
            }
        }

        if (maxPeak > 0) {
            for (
                let index = 0;
                index < nextPeaks.length;
                index++
            ) {
                nextPeaks[index] =
                    nextPeaks[index] / maxPeak;
            }
        }

        peaks = nextPeaks;

        if (peaks.length) {
            if (!displayPeaks.length) {
                displayPeaks = new Array(
                    peaks.length,
                ).fill(0);
            }

            isWaveLeaving = false;
            frozenProgress = null;

            startMorph(peaks, 180);

            status = "Ready";
        } else {
            displayPeaks = [];
            status = "Idle";
        }
    }

    function drawBaseline(
        context: CanvasRenderingContext2D,
        cssWidth: number,
        cssHeight: number,
    ) {
        context.fillStyle = baseColor;

        context.fillRect(
            0,
            cssHeight - 1,
            cssWidth,
            1,
        );
    }

    function drawBars(
        context: CanvasRenderingContext2D,
        cssHeight: number,
        color: string,
        clipWidth: number | null,
    ) {
        if (clipWidth !== null) {
            context.save();
            context.beginPath();

            context.rect(
                0,
                0,
                clipWidth,
                cssHeight,
            );

            context.clip();
        }

        context.fillStyle = color;

        for (
            let index = 0;
            index < displayPeaks.length;
            index++
        ) {
            const value = displayPeaks[index] || 0;
            const x = index * (barWidth + barGap);

            const barHeight = Math.max(
                minBarPx,
                Math.round(value * cssHeight),
            );

            const y = cssHeight - barHeight;

            context.fillRect(
                x,
                y,
                barWidth,
                barHeight,
            );
        }

        if (clipWidth !== null) {
            context.restore();
        }
    }

    function draw() {
        if (!canvasEl) return;

        const context = canvasEl.getContext("2d");

        if (!context) return;

        const cssWidth = parseFloat(
            canvasEl.style.width ||
                `${canvasEl.clientWidth}`,
        );

        const cssHeight = Math.max(
            1,
            Math.floor(height),
        );

        context.clearRect(
            0,
            0,
            cssWidth,
            cssHeight,
        );

        if (!shouldDrawWaveform) return;

        drawBars(
            context,
            cssHeight,
            baseColor,
            null,
        );

        const playedWidth =
            cssWidth * getDrawProgress();

        if (playedWidth > 0) {
            drawBars(
                context,
                cssHeight,
                playedColor,
                playedWidth,
            );
        }

        drawBaseline(
            context,
            cssWidth,
            cssHeight,
        );

        context.fillStyle = "#fff";

        context.fillRect(
            playedWidth,
            0,
            1,
            cssHeight,
        );
    }

    function hardCancelJobs() {
        decodeAbort?.abort();
        decodeAbort = null;
        morphActive = false;
    }

    function clearWaveformData() {
        peaks = [];
        displayPeaks = [];
        rawData = null;
        duration = 0;

        lastBarCount = 0;
        lastCssW = 0;
        lastRawLen = 0;
    }

    async function transitionOutCurrentWaveform(
        token: number,
    ) {
        if (!displayPeaks.length) return;

        frozenProgress = getProgress();
        isWaveLeaving = true;
        morphActive = false;

        draw();

        await tick();
        await nextFrame();
        await sleep(waveformOutMs);

        if (token !== jobId) return;

        isWaveLeaving = false;
        frozenProgress = null;
    }

    async function loadAndDecode(
        url: string,
        signal: AbortSignal,
    ) {
        status = "Loading";

        const response = await withTimeout(
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

        if (!response.ok) {
            throw new Error(
                `Audio preview failed to load (${response.status}).`,
            );
        }

        const buffer = await withTimeout(
            response.arrayBuffer(),
            fetchTimeoutMs,
            "Waveform read",
        );

        status = "Decoding";

        const AudioContextClass = (
            window.AudioContext ||
            (window as any).webkitAudioContext
        ) as typeof AudioContext;

        const audioContext =
            new AudioContextClass();

        try {
            const audioBuffer = await withTimeout(
                audioContext.decodeAudioData(
                    buffer.slice(0),
                ),
                decodeTimeoutMs,
                "decodeAudioData",
            );

            duration = audioBuffer.duration;

            rawData =
                audioBuffer.getChannelData(0);
        } finally {
            await audioContext
                .close()
                .catch(() => {});
        }
    }

    function canSeekWaveform() {
        return (
            !!audio &&
            !!audioUrl &&
            !displayedErrorMessage &&
            !isWaveLeaving &&
            displayPeaks.length > 0 &&
            status === "Ready" &&
            getDuration() > 0
        );
    }

    function seekFromClientX(
        clientX: number,
    ) {
        if (!canSeekWaveform()) return;

        const currentAudio = getAudio();

        if (!currentAudio) return;

        const currentDuration = getDuration();

        if (!canvasEl || currentDuration <= 0) {
            return;
        }

        const rect =
            canvasEl.getBoundingClientRect();

        const x = Math.max(
            0,
            Math.min(
                rect.width,
                clientX - rect.left,
            ),
        );

        const percentage = x / rect.width;

        currentAudio.currentTime =
            percentage * currentDuration;

        if (
            autoPlayOnSeek &&
            currentAudio.paused
        ) {
            currentAudio
                .play()
                .catch(() => {});
        }
    }

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

    function onPointerDown(
        event: PointerEvent,
    ) {
        if (!enableSeek) return;
        if (!canSeekWaveform()) return;

        if (
            event.pointerType === "mouse" &&
            event.button !== 0
        ) {
            return;
        }

        dragging = true;
        pointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;
        decided = false;
        isScrollGesture = false;

        (
            event.currentTarget as HTMLElement
        ).setPointerCapture?.(
            event.pointerId,
        );
    }

    function onPointerMove(
        event: PointerEvent,
    ) {
        if (
            !dragging ||
            pointerId !== event.pointerId
        ) {
            return;
        }

        if (!canSeekWaveform()) return;

        const deltaX =
            event.clientX - startX;

        const deltaY =
            event.clientY - startY;

        if (!decided) {
            const absoluteX =
                Math.abs(deltaX);

            const absoluteY =
                Math.abs(deltaY);

            if (
                absoluteX <
                    scrollLockThresholdPx &&
                absoluteY <
                    scrollLockThresholdPx
            ) {
                return;
            }

            decided = true;

            isScrollGesture =
                absoluteY > absoluteX;

            if (
                isScrollGesture &&
                !seekWhileScrolling
            ) {
                (
                    event.currentTarget as HTMLElement
                ).releasePointerCapture?.(
                    event.pointerId,
                );

                return;
            }
        }

        if (
            isScrollGesture &&
            !seekWhileScrolling
        ) {
            return;
        }

        event.preventDefault();

        seekFromClientX(
            event.clientX,
        );
    }

    function onPointerUp(
        event: PointerEvent,
    ) {
        if (
            pointerId !== event.pointerId
        ) {
            return;
        }

        if (
            !decided &&
            enableSeek &&
            canSeekWaveform()
        ) {
            seekFromClientX(
                event.clientX,
            );
        }

        resetPointerState();
    }

    function onPointerCancel(
        event: PointerEvent,
    ) {
        if (
            pointerId !== event.pointerId
        ) {
            return;
        }

        resetPointerState();
    }

    function startLoop() {
        if (typeof window === "undefined") {
            return;
        }

        const loop = (now: number) => {
            raf = requestAnimationFrame(loop);

            stepMorph(now);
            draw();
        };

        raf = requestAnimationFrame(loop);
    }

    let lastUrl: string | null = null;

    async function handleMissingAudio(
        token: number,
    ) {
        hardCancelJobs();
        decodeError = null;

        if (displayPeaks.length) {
            await transitionOutCurrentWaveform(
                token,
            );
        }

        if (token !== jobId) return;

        status = "Idle";

        clearWaveformData();
        draw();
    }

    async function handleUrlChange(
        url: string,
        token: number,
    ) {
        hardCancelJobs();
        decodeError = null;

        if (displayPeaks.length) {
            await transitionOutCurrentWaveform(
                token,
            );
        }

        if (token !== jobId) return;

        status = "Loading";

        clearWaveformData();
        draw();

        const controller =
            new AbortController();

        decodeAbort = controller;

        try {
            await loadAndDecode(
                url,
                controller.signal,
            );
        } catch (error: any) {
            const aborted =
                controller.signal.aborted ||
                error?.name === "AbortError";

            if (aborted) return;
            if (token !== jobId) return;

            decodeError =
                error?.message ??
                audioErrorFallbackMessage;

            status = "Error";

            clearWaveformData();
            draw();

            return;
        }

        if (token !== jobId) return;

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

        resizeObserver =
            new ResizeObserver(() => {
                requestResize();
            });

        if (wrapEl) {
            resizeObserver.observe(
                wrapEl,
            );
        }

        requestResize();
        startLoop();
    });

    $: {
        if (!audioUrl) {
            if (lastUrl !== null) {
                lastUrl = null;
            }

            const token = ++jobId;

            handleMissingAudio(token).catch(
                () => {
                    status = "Idle";

                    clearWaveformData();
                    draw();
                },
            );
        } else if (audioUrl !== lastUrl) {
            lastUrl = audioUrl;

            const token = ++jobId;

            handleUrlChange(
                audioUrl,
                token,
            ).catch((error) => {
                const aborted =
                    decodeAbort?.signal
                        .aborted ||
                    error?.name ===
                        "AbortError";

                if (aborted) return;

                decodeError =
                    error?.message ??
                    audioErrorFallbackMessage;

                status = "Error";

                clearWaveformData();
                draw();
            });
        }
    }

    $: {
        height;
        barWidth;
        barGap;
        zoom;
        minBarPx;

        requestResize();
    }

    onDestroy(() => {
        cancelAnimationFrame(raf);
        cancelAnimationFrame(resizeRaf);

        resizeObserver?.disconnect();
        decodeAbort?.abort();
    });
</script>

<div
    class="wrap"
    bind:this={wrapEl}
    style="
        --wave-height: {Math.max(1, Math.floor(height))}px;
        --wave-out-ms: {waveformOutMs}ms;
    "
>
    <div
        class="inner"
        class:waveLeaving={isWaveLeaving}
    >
        <canvas
            bind:this={canvasEl}
            aria-label="Audio waveform"
            style="height: {Math.max(1, Math.floor(height))}px;"
            on:pointerdown={onPointerDown}
            on:pointermove|nonpassive={onPointerMove}
            on:pointerup={onPointerUp}
            on:pointercancel={onPointerCancel}
            on:pointerleave={onPointerUp}
        />
    </div>

    <div class="swf_message">
        {#if !audioUrl && !isWaveLeaving}
            <p class="waveMessage">
                {noAudioMessage}
            </p>
        {:else if displayedErrorMessage && !isWaveLeaving}
            <p
                class="waveMessage waveMessage_error"
            >
                {displayedErrorMessage ||
                    audioErrorFallbackMessage}
            </p>
        {:else if !isWaveLeaving &&
            (status === "Loading" ||
                status === "Decoding" ||
                status === "Computing peaks")}
            <p class="waveMessage">
                {status}...
            </p>
        {/if}
    </div>
</div>

<style>
    .wrap {
        width: 100%;
        min-height: var(--wave-height);

        overflow-x: hidden;
        overflow-y: hidden;

        cursor: pointer;
        position: relative;
    }

    .inner {
        width: fit-content;

        opacity: 1;

        transform: translateY(0) scaleY(1);
        transform-origin: center bottom;

        transition:
            opacity var(--wave-out-ms) ease,
            transform var(--wave-out-ms)
                cubic-bezier(0.22, 1, 0.36, 1),
            filter var(--wave-out-ms) ease;

        will-change:
            opacity,
            transform,
            filter;
    }

    .inner.waveLeaving {
        opacity: 0;

        transform:
            translateY(2px)
            scaleY(0.72);

        filter: blur(0.4px);

        pointer-events: none;
    }

    .swf_message {
        position: absolute;
        top: 0;
        left: 0;

        pointer-events: none;
    }

    canvas {
        display: block;
        touch-action: pan-y;
    }

    .waveMessage {
        margin: 0;

        font-size: 10pt;
        line-height: 1.2;

        opacity: 0.7;
        white-space: nowrap;
    }

    .waveMessage_error {
        opacity: 0.85;
    }
</style>