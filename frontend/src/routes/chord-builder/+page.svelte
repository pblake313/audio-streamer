<script lang="ts">
    import "./ChordBuilderPage.css";

    import { onDestroy, onMount } from "svelte";
    import Footer from "../../components/standalone/Nav/Footer.svelte";
    import ChordTimeline from "../../components/ChordBuilder/ChordTimeline.svelte";
    import PlayIcon from "../../components/Icons/svg/PlayIcon.svelte";
    import PauseIcon from "../../components/Icons/svg/PauseIcon.svelte";
    import Dropdown from "../../components/ChordBuilder/Dropdown.svelte";
    import SoundPicker from "../../components/ChordBuilder/SoundPicker.svelte";
    import { audioStore } from "../../stores/AudioPlayerStore";
    import { user } from "../../stores/UserStore";
    import { pushNotification } from "../../stores/NotificationStore";
    import { downloadMidi } from "../../helpers/ChordBuilder/exportMidi";
    import {
        BEATS_PER_BAR,
        ROOTS,
        SCALES,
        scalePitchClasses,
        type Chord,
        type Root,
        type ScaleId,
    } from "../../helpers/ChordBuilder/chords";
    import { defaultLengthAt, type ChordSlot } from "../../helpers/ChordBuilder/timeline";
    import { ChordLooper } from "../../helpers/ChordBuilder/ChordLooper";
    import type { InstrumentId } from "../../helpers/ChordBuilder/instruments";
    import {
        randomChordsInKey,
        randomProgression,
    } from "../../helpers/ChordBuilder/randomProgression";
    import { numeralInKey, scaleDegree } from "../../helpers/ChordBuilder/suggestions";

    const MIN_BPM = 40;
    const MAX_BPM = 200;
    const BAR_OPTIONS = [2, 4, 8, 12] as const;

    let nextId = 1;
    const slot = (chord: Chord): ChordSlot => ({ ...chord, id: nextId++ });

    let bpm = 120;
    let bars: (typeof BAR_OPTIONS)[number] = 4;
    let metronome = false;
    let instrument: InstrumentId = "feltPiano";

    // options for the custom dropdowns
    const rootOptions = ROOTS.map((root) => ({ value: root, label: root }));
    const scaleOptions = (Object.keys(SCALES) as ScaleId[]).map((id) => ({ value: id, label: SCALES[id].label }));
    const setKeyRoot = (value: string) => (keyRoot = value as Root);
    const setScale = (value: string) => (scale = value as ScaleId);

    // start somewhere new each visit: random key + a progression that fits it
    const start = randomProgression(bars);

    let keyRoot: Root = start.keyRoot;
    let scale: ScaleId = start.scale;
    let showScale = false; // blue lanes + keyboard markers for the key
    let showNoteColors = true; // green/red notes for in/out of key
    $: scalePitches = scalePitchClasses(keyRoot, scale);
    $: keyPitches = showScale ? scalePitches : null;
    $: notePitches = showNoteColors ? scalePitches : null;

    let chords: ChordSlot[] = start.chords.map(slot);
    let selectedId: number | null = chords[0].id;

    let playing = false;
    let playhead = -1;
    let audioError = "";

    let looper: ChordLooper | null = null;

    onMount(() => {
        looper = new ChordLooper({
            onBeat: (position) => (playhead = position),
        });
    });

    onDestroy(() => looper?.destroy());

    $: totalBeats = bars * BEATS_PER_BAR;

    // keep the engine in sync with the controls; changes apply on the next chord
    $: if (looper) looper.bpm = clampBpm(bpm);
    $: if (looper) looper.chords = chords;
    $: if (looper) looper.totalBeats = totalBeats;
    $: if (looper) looper.metronome = metronome;
    $: if (looper) looper.instrument = instrument;

    $: selected = chords.find((c) => c.id === selectedId) ?? null;

    // the progression by scale degree (1-5-6-4) and Roman numeral (I-V-vi-IV),
    // in time order, for the line above the timeline
    $: progression = chords
        .filter((c) => c.start < totalBeats)
        .sort((a, b) => a.start - b.start)
        .map((c) => ({
            degree: scaleDegree(c.root, keyRoot, scale),
            numeral: numeralInKey({ root: c.root, quality: c.quality }, keyRoot, scale),
        }));


    function clampBpm(value: number) {
        if (!Number.isFinite(value)) return 120;
        return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(value)));
    }

    async function togglePlay() {
        if (!looper) return;

        if (playing) {
            looper.stop();
            playing = false;
            playhead = -1;
            return;
        }

        // don't play over a track from the streamer
        $audioStore?.pause();

        try {
            await looper.start();
            playing = true;
            audioError = "";
        } catch (error) {
            console.error("Chord loop failed to start:", error);
            audioError =
                "The browser didn't let audio start. Press play again, and check the tab isn't muted.";
        }
    }

    function createChord(start: number, notes?: number[]) {
        const template = selected ?? chords[chords.length - 1];
        const chord = slot({
            // a chord started from a single note is rooted on that note
            root: notes?.length ? ROOTS[notes[0] % 12] : template?.root ?? "C",
            quality: notes?.length ? "" : template?.quality ?? "m7",
            start,
            beats: defaultLengthAt(chords, start, totalBeats),
            notes: notes?.length ? notes : null,
        });

        chords = [...chords, chord];
        selectedId = chord.id;
        return chord;
    }

    /** New random chords in the current key, filling the current bars. */
    // ---------- MIDI export (logged-in users only) ----------

    let exportingMidi = false;

    async function handleDownloadMidi() {
        // the button is hidden when logged out; guard anyway in case the session just ended
        if (!$user) return;

        if (exportingMidi) return;
        exportingMidi = true;

        try {
            // the file is named after the chords, e.g. "B - Ebm7 - F# - E.mid"
            await downloadMidi({
                chords,
                totalBeats,
                bpm: clampBpm(bpm),
            });
        } catch (error: any) {
            pushNotification(error?.message || "Couldn't export the MIDI file.", "Error", false, 4000, "MIDI export");
        } finally {
            exportingMidi = false;
        }
    }

    // ---------- sticky top bar ----------

    // the controls stick just under the site's fixed nav, so measure the nav
    // (its height changes with screen size) and watch for the bar getting stuck
    let navHeight = 72;
    let barHeight = 72; // the sticky bar itself, so the chord rows can stick right under it
    let headerStuck = false;
    let stickySentinel: HTMLDivElement;
    let headerBar: HTMLElement;

    onMount(() => {
        const nav = document.querySelector<HTMLElement>(".nav_container");
        // exact (fractional) heights: rounding here would leave a sliver of gap
        const measure = () => (navHeight = nav?.getBoundingClientRect().height ?? 72);
        measure();

        const measureBar = () => (barHeight = headerBar?.getBoundingClientRect().height ?? 72);
        measureBar();

        const resize = new ResizeObserver(() => {
            measure();
            measureBar();
        });
        if (nav) resize.observe(nav);
        if (headerBar) resize.observe(headerBar);

        // the sentinel sits right above the bar: once it has scrolled up to
        // the nav, the bar is stuck (slim: labels fold away, divider shows).
        // Checked on scroll, at most once per frame.
        let frame = 0;
        const checkStuck = () => {
            frame = 0;
            if (stickySentinel) headerStuck = stickySentinel.getBoundingClientRect().top <= navHeight + 0.5;
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(checkStuck);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        checkStuck();

        return () => {
            resize.disconnect();
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            cancelAnimationFrame(frame);
        };
    });

    let shuffleCount = 0; // bumps the icon so it spins on every shuffle

    function shuffleChords() {
        shuffleCount++;
        chords = randomChordsInKey(keyRoot, scale, bars).map(slot);
        selectedId = null;
    }

    function removeChord(id: number) {
        chords = chords.filter((c) => c.id !== id);
        if (selectedId === id) selectedId = null;
    }

    function previewNote(midi: number) {
        // while the loop runs, the chords already make sound
        if (!playing) looper?.previewNote(midi);
    }

    // while the loop runs you'll hear the new chord when it comes around,
    // so only preview it when the loop is stopped
    function previewChord(notes: number[]) {
        if (!playing) looper?.previewChord(notes);
    }

    function removeSelected() {
        if (!selected) return;
        chords = chords.filter((c) => c.id !== selected!.id);
        selectedId = null;
    }

    // Space always plays/pauses, wherever focus is. It's caught in the capture
    // phase so nothing else sees it, and its keyup is swallowed too, because a
    // focused button "clicks" when Space is released.
    function handleSpaceDown(event: KeyboardEvent) {
        if (event.code !== "Space") return;
        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat) togglePlay(); // holding Space doesn't flip it on and off
    }

    function handleSpaceUp(event: KeyboardEvent) {
        if (event.code !== "Space") return;
        event.preventDefault();
        event.stopPropagation();
    }

    onMount(() => {
        window.addEventListener("keydown", handleSpaceDown, { capture: true });
        window.addEventListener("keyup", handleSpaceUp, { capture: true });
        return () => {
            window.removeEventListener("keydown", handleSpaceDown, { capture: true });
            window.removeEventListener("keyup", handleSpaceUp, { capture: true });
        };
    });

    function handleKeydown(event: KeyboardEvent) {
        const target = event.target as HTMLElement;
        const typing = ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName);
        if (typing) return;

        // S = shuffle (no modifier keys, so Ctrl/Cmd+S etc. still work)
        if (event.key.toLowerCase() === "s" && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            shuffleChords();
            return;
        }

        if ((event.key === "Delete" || event.key === "Backspace") && selected) {
            event.preventDefault();
            removeSelected();
        }
    }
</script>

<svelte:head>
    <title>Chord Builder</title>
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<div class="chordBuilder_container" style="--nav-h: {navHeight}px; --bar-h: {barHeight}px">
    <!-- zero-height marker just above the bar: once it scrolls out of view, the bar is "stuck" -->
    <div class="chordBuilder_stickySentinel" bind:this={stickySentinel} aria-hidden="true"></div>
    <header class="chordBuilder_header" class:chordBuilder_headerStuck={headerStuck} bind:this={headerBar}>
    <!-- transport -->
    <section class="chordBuilder_transport">
        <!-- white play button on the left, same size as the other controls -->
        <button
            type="button"
            class="chordBuilder_play"
            class:chordBuilder_playing={playing}
            on:click={togglePlay}
            aria-label={playing ? "Pause loop" : "Play loop"}
        >
            {#if playing}
                <PauseIcon height="17px" color="#222222" />
            {:else}
                <span class="chordBuilder_playIcon"><PlayIcon height="17px" color="#222222" /></span>
            {/if}
        </button>

        <!-- the progression by number, right next to play: "1 – 5 – 6 – 4 progression" -->
        {#if progression.length}
            <div
                class="chordBuilder_progressionName"
                title={`${progression.map((p) => p.degree).join(" – ")} progression in ${keyRoot} ${SCALES[scale].label}: ${progression.map((p) => p.numeral).join(" – ")}`}
            >
                <h4>
                    {progression.map((p) => p.degree).join(" – ")}
                    <span>progression</span>
                </h4>
                <p>
                    <span class="chordBuilder_numerals">{progression.map((p) => p.numeral).join(" – ")}</span>
                </p>
            </div>
        {/if}

        <!-- the gray controls, centered between play and shuffle -->
        <div class="chordBuilder_middle">
            <div class="chordBuilder_control">
                <span class="chordBuilder_controlLabel">BPM</span>
                <!-- − 120 + : click to nudge (Shift = 5), or type a value -->
                <div class="chordBuilder_bpm">
                    <button
                        type="button"
                        class="chordBuilder_bpmStep"
                        aria-label="Slower"
                        disabled={bpm <= MIN_BPM}
                        on:click={(e) => (bpm = clampBpm(bpm - (e.shiftKey ? 5 : 1)))}
                    >−</button>
                    <input
                        id="cb_bpm"
                        aria-label="Tempo (BPM)"
                        title="Tempo (BPM)"
                        class="chordBuilder_bpmInput"
                        type="number"
                        inputmode="numeric"
                        min={MIN_BPM}
                        max={MAX_BPM}
                        bind:value={bpm}
                        on:blur={() => (bpm = clampBpm(bpm))}
                        on:keydown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                    />
                    <button
                        type="button"
                        class="chordBuilder_bpmStep"
                        aria-label="Faster"
                        disabled={bpm >= MAX_BPM}
                        on:click={(e) => (bpm = clampBpm(bpm + (e.shiftKey ? 5 : 1)))}
                    >+</button>
                </div>
            </div>

            <div class="chordBuilder_control">
                <span class="chordBuilder_controlLabel">Bars</span>
                <div class="chordBuilder_segmented" role="group" aria-label="Loop length in bars" title="Loop length (bars)">
                    {#each BAR_OPTIONS as option}
                        <button
                            type="button"
                            class:chordBuilder_segmentOn={bars === option}
                            aria-pressed={bars === option}
                            aria-label={`${option} bars`}
                            on:click={() => (bars = option)}
                        >
                            {option}
                        </button>
                    {/each}
                </div>
            </div>

            <div class="chordBuilder_control">
                <span class="chordBuilder_controlLabel">Key</span>
                <div class="chordBuilder_keyRow">
                    <Dropdown
                        ariaLabel="Key root"
                        value={keyRoot}
                        options={rootOptions}
                        onChange={setKeyRoot}
                    />
                    <Dropdown
                        ariaLabel="Scale"
                        value={scale}
                        options={scaleOptions}
                        onChange={setScale}
                    />
                    <button
                        type="button"
                        class="chordBuilder_iconToggle chordBuilder_scaleToggle"
                        class:chordBuilder_iconToggleOn={showScale}
                        aria-pressed={showScale}
                        aria-label="Highlight key lanes"
                        title={showScale ? "Lane highlighting on" : "Lane highlighting off"}
                        on:click={() => (showScale = !showScale)}
                    >
                        <!-- piano-roll lanes, two lit -->
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <rect x="3" y="4" width="18" height="3.2" rx="1" fill="currentColor" />
                            <rect x="3" y="10.4" width="18" height="3.2" rx="1" fill="currentColor" opacity="0.35" />
                            <rect x="3" y="16.8" width="18" height="3.2" rx="1" fill="currentColor" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        class="chordBuilder_iconToggle chordBuilder_noteToggle"
                        class:chordBuilder_iconToggleOn={showNoteColors}
                        aria-pressed={showNoteColors}
                        aria-label="Color notes by key"
                        title={showNoteColors ? "Key highlighting on" : "Key highlighting off"}
                        on:click={() => (showNoteColors = !showNoteColors)}
                    >
                        <!-- staggered MIDI notes -->
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <rect x="3" y="5" width="9" height="4" rx="1.3" fill="currentColor" />
                            <rect x="9" y="10.5" width="12" height="4" rx="1.3" fill="currentColor" opacity="0.55" />
                            <rect x="5" y="16" width="10" height="4" rx="1.3" fill="currentColor" />
                        </svg>
                    </button>
                </div>
            </div>

            <div class="chordBuilder_control">
                <span class="chordBuilder_controlLabel">Sound</span>
                <SoundPicker value={instrument} onChange={(id) => (instrument = id)} />
            </div>

            <button
                type="button"
                class="chordBuilder_iconToggle"
                class:chordBuilder_iconToggleOn={metronome}
                aria-pressed={metronome}
                aria-label="Metronome"
                title={metronome ? "Metronome on" : "Metronome off"}
                on:click={() => (metronome = !metronome)}
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                >
                    <path d="M9.2 3h5.6l3.7 18H5.5L9.2 3z" />
                    <path d="M7.6 15.5h8.8" />
                    <path d="M12 15.5L17 6" />
                </svg>
            </button>
        </div>

        <!-- MIDI download (blue): only shown to logged-in users. The file is
             built by the backend behind the login middleware. -->
        {#if $user}
            <button
                type="button"
                class="chordBuilder_download"
                aria-label="Download MIDI"
                title="Download this progression as a MIDI file"
                disabled={exportingMidi}
                on:click={handleDownloadMidi}
            >
                {#if exportingMidi}
                    <span class="chordBuilder_spinner" aria-hidden="true"></span>
                {:else}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 4v11" />
                        <path d="M7.5 10.5L12 15l4.5-4.5" />
                        <path d="M5 19h14" />
                    </svg>
                {/if}
            </button>
        {/if}

        <!-- shuffle: purple icon button on the far right -->
        <button
            type="button"
            class="chordBuilder_shuffle"
            aria-label="Shuffle chords"
            title="Shuffle chords: new chords in this key (S)"
            on:click={shuffleChords}
        >
            {#key shuffleCount}
                <svg
                    class="chordBuilder_shuffleIcon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                >
                    <path d="M3 7h3.5c2.4 0 3.6 1.2 5 3.5l1 1.5c1.4 2.3 2.6 3.5 5 3.5H21" />
                    <path d="M3 17h3.5c1.6 0 2.7-.6 3.6-1.7" />
                    <path d="M14.4 8.7c.9-1.1 2-1.7 3.6-1.7H21" />
                    <path d="M18.5 4.5L21 7l-2.5 2.5" />
                    <path d="M18.5 14L21 16.5 18.5 19" />
                </svg>
            {/key}
        </button>
    </section>
    </header>

    {#if audioError}
        <p class="chordBuilder_audioError" role="alert">{audioError}</p>
    {/if}

    <!-- timeline -->
    <section class="chordBuilder_progression">
        <div class="chordBuilder_timelineCard">
            <ChordTimeline
                bind:chords
                bind:selectedId
                {totalBeats}
                playhead={playing ? playhead : -1}
                onCreate={createChord}
                onPreview={previewNote}
                onRemove={removeChord}
                {keyPitches}
                {notePitches}
                tensionKey={scalePitches}
                {keyRoot}
                {scale}
                onPreviewChord={previewChord}
                keyRootPc={ROOTS.indexOf(keyRoot)}
            />
        </div>
    </section>
</div>

<Footer />
