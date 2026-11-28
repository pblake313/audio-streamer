<script lang="ts">
    import "./KeyDetails.css";

    import { onDestroy } from "svelte";
    import SwipeDots from "../UI/SwipeDots.svelte";
    import Fretboard from "./Fretboard.svelte";
    import SectionNav from "./SectionNav.svelte";
    import KeyPicker from "./KeyPicker.svelte";
    import { keySummary } from "../../helpers/Theory/seo";
    import { theoryPath } from "../../helpers/Theory/urls";
    import { scalePositions } from "../../helpers/Theory/guitar";
    import { buildScale, hasScaleKind, scaleKinds, type ScaleKind } from "../../helpers/Theory/scales";

    // the page's sections, in order, for the sticky section nav
    const SECTIONS = [
        { id: "key", label: "Key" },
        { id: "scale", label: "Scale" },
        { id: "chords", label: "Chords" },
        { id: "progressions", label: "Progressions" },
        { id: "guitar", label: "Guitar" },
        { id: "scales", label: "Scales" },
    ];
    import { dragScroll } from "../../helpers/dragScroll";
    import type { ChordLooper } from "../../helpers/ChordBuilder/ChordLooper";
    // chord roles share their colors with the badges in the chord builder
    import { FUNCTION_HUES } from "../../helpers/ChordBuilder/harmonicFunction";
    import {
        camelotOf,
        CHORD_KINDS,
        diatonicChords,
        enharmonicOf,
        ENHARMONIC_POS,
        harmonicDominant,
        keyHue,
        keyName,
        leadingTone,
        pretty,
        progressionsFor,
        relatedKeys,
        scaleOf,
        signatureOf,
        stepsOf,
        type ChordFunction,
        type ChordKind,
        type KeyChord,
        type KeyRef,
        type ProgressionChord,
    } from "../../helpers/Theory/keys";

    export let key: KeyRef;
    export let looper: ChordLooper | null;
    export let onSelect: (key: KeyRef) => void;

    /*
        Related keys and the scale picker are real links to their pages (so
        search engines can follow them), but a plain click just switches in
        place; ctrl/cmd/shift/middle-click still opens the page in a new tab.
    */
    const plainClick = (event: MouseEvent) =>
        event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

    function follow(event: MouseEvent, next: KeyRef) {
        if (!plainClick(event)) return;
        event.preventDefault();
        onSelect(next);
    }

    function pickScale(event: MouseEvent, kind: ScaleKind) {
        if (!plainClick(event)) return;
        event.preventDefault();
        moreKind = kind;
    }

    let kind: ChordKind = "triad";

    // the progression cards swipe sideways on small screens (CSS); SwipeDots follows them
    let progTrack: HTMLUListElement;

    // what the guitar neck's dots show
    let fretLabels: "notes" | "degrees" = "notes";

    // which scale the "Scales" section shows (every key type has pentatonic and
    // blues, so switching between major and minor keeps those), and which
    // position (box) its neck highlights; null shows them all
    export let moreKind: ScaleKind = "pentatonic";
    export let morePosition: number | null = null;

    // the "On the guitar" neck's highlighted position (the key's own scale, 1-7); null shows all
    let guitarPosition: number | null = null;

    const FUNCTION_INFO: Record<ChordFunction, string> = {
        Tonic: "home, at rest",
        Predominant: "moving away",
        Dominant: "tension, wants home",
    };
    const FUNCTION_NAMES: ChordFunction[] = ["Tonic", "Predominant", "Dominant"];

    // what's sounding right now, so its tile lights up
    let playingId: string | null = null;
    let timers: ReturnType<typeof setTimeout>[] = [];

    function stopSequence() {
        timers.forEach(clearTimeout);
        timers = [];
        playingId = null;
    }

    onDestroy(stopSequence);

    function playChord(chord: KeyChord, id: string) {
        stopSequence();
        looper?.previewChord(chord.midi);
        playingId = id;
        timers.push(setTimeout(() => (playingId = null), 900));
    }

    // plays each step in turn, lighting up the matching id
    function playSequence(steps: { id: string; play: () => void }[], gapMs: number) {
        stopSequence();
        steps.forEach((step, i) => {
            timers.push(
                setTimeout(() => {
                    step.play();
                    playingId = step.id;
                }, i * gapMs),
            );
        });
        timers.push(setTimeout(() => (playingId = null), steps.length * gapMs));
    }

    // plays `notes` upward from middle C's octave and back to the tonic an octave
    // up, lighting `${prefix}${i}` for each (the octave is the last index)
    function playNotes(notes: { pc: number }[], prefix: string) {
        const midis: number[] = [];
        for (const note of notes) {
            let midi = 60 + note.pc;
            while (midis.length && midi <= midis[midis.length - 1]) midi += 12;
            midis.push(midi);
        }
        midis.push(midis[0] + 12);
        playSequence(
            midis.map((midi, i) => ({
                id: `${prefix}${i}`,
                play: () => looper?.previewNote(midi),
            })),
            260,
        );
    }

    const playScale = () => playNotes(scale, "note");
    const playMoreScale = () => playNotes(moreScale.notes, "more");

    // which chord of progression `p` is sounding, or -1 when it isn't playing
    function playingStep(id: string | null, p: number) {
        const prefix = `prog${p}:`;
        return id?.startsWith(prefix) ? Number(id.slice(prefix.length)) : -1;
    }

    // one bar of 4/4 at about 133 bpm; every progression is 4 bars
    const BAR_MS = 1800;

    function playProgression(index: number, bars: ProgressionChord[][]) {
        stopSequence();
        bars.forEach((bar, b) => {
            bar.forEach((chord, c) => {
                const at = b * BAR_MS + (c * BAR_MS) / bar.length;
                timers.push(
                    setTimeout(() => {
                        looper?.previewChord(chord.midi);
                        playingId = `prog${index}:${chord.index}`;
                    }, at),
                );
            });
        });
        timers.push(setTimeout(() => (playingId = null), bars.length * BAR_MS));
    }

    $: key, stopSequence(); // a new key stops whatever was playing
    $: hue = keyHue(key.pos);
    $: scale = scaleOf(key);
    // the "Scales" section: pentatonic, blues and modes built on this key
    $: moreKinds = scaleKinds(key.mode);
    // a scale this key type doesn't offer (Dorian after switching to a major
    // key, or from the URL) falls back to the pentatonic
    $: if (!hasScaleKind(key.mode, moreKind)) moreKind = "pentatonic";
    $: moreScale = buildScale(key, moreKind);
    $: morePositions = scalePositions(moreScale.boxPcs, moreScale.extraPcs);
    // a scale with fewer positions than the one before drops the selection
    $: if (morePosition !== null && morePosition >= morePositions.length) morePosition = null;
    // the key's own seven notes: seven 3-notes-per-string positions
    $: guitarPositions = scalePositions(scale.map((note) => note.pc));
    $: sig = signatureOf(key);
    $: related = relatedKeys(key);
    $: chords = diatonicChords(key, kind);
    $: dominant = key.mode === "minor" ? harmonicDominant(key, kind) : null;
    $: progressions = progressionsFor(key);
    $: enharmonic = enharmonicOf(key);
    $: steps = stepsOf(key);

    // piano roll of the chords: one row per semitone across every chord's notes
    $: scaleNames = new Map(scale.map((note) => [note.pc, pretty(note.name)]));
    $: stackMidis = chords.flatMap((chord) => chord.stack.map((tone) => tone.midi));
    // one spare key above and below so the notes don't touch the edges
    $: rollTop = Math.max(...stackMidis) + 1;
    $: rollRows = Array.from({ length: rollTop - Math.min(...stackMidis) + 2 }, (_, i) => {
        const midi = rollTop - i;
        const pc = midi % 12;
        return {
            midi,
            label: scaleNames.get(pc) ?? "",
            inScale: scaleNames.has(pc),
            tonic: pc === scale[0].pc,
            black: [1, 3, 6, 8, 10].includes(pc),
            octaveStart: pc === 0,
        };
    });
    // keys light up while their chord sounds
    $: soundingChord = playingId?.startsWith("chord") ? chords[Number(playingId.slice(5))] : null;
    $: soundingKeys = new Set(soundingChord?.stack.map((tone) => tone.midi) ?? []);
    $: relatedList = [
        { label: key.mode === "major" ? "Relative minor" : "Relative major", key: related.relative },
        { label: key.mode === "major" ? "Parallel minor" : "Parallel major", key: related.parallel },
        { label: "Dominant key (one step clockwise)", key: related.dominant },
        { label: "Subdominant key (one step counter-clockwise)", key: related.subdominant },
    ];
</script>

<section class="kd" style="--h: {hue}">
    <SectionNav sections={SECTIONS}>
        <KeyPicker slot="end" {key} {onSelect} />
    </SectionNav>

    <div class="kd_top" id="key">
        <div class="kd_circle"><slot name="circle" /></div>

        <div class="kd_overview">
            <header class="kd_header">
                <div>
                    <div class="kd_titleRow">
                        <!-- the page's main heading: each key is its own page -->
                        <h1 class="kd_title">{keyName(key)}</h1>
                        <span class="kd_camelot" title="Camelot code, for harmonic mixing">{camelotOf(key)}</span>
                    </div>
                    <p class="kd_sig">
                        {#if sig.count === 0}
                            No sharps or flats
                        {:else}
                            {sig.count} {sig.type}{sig.count === 1 ? "" : "s"}:
                            {#each sig.accidentals as accidental}
                                <span class="kd_accidental">{pretty(accidental)}</span>
                            {/each}
                        {/if}
                    </p>
                    {#if enharmonic}
                        <p class="kd_muted">Same sound as {enharmonic}</p>
                    {/if}
                </div>

                {#if key.pos === ENHARMONIC_POS}
                    <div class="kd_toggle" role="group" aria-label="Spelling">
                        <button
                            type="button"
                            class:kd_toggleOn={key.spelling === "sharp"}
                            aria-pressed={key.spelling === "sharp"}
                            on:click={() => onSelect({ ...key, spelling: "sharp" })}>Sharps</button
                        >
                        <button
                            type="button"
                            class:kd_toggleOn={key.spelling === "flat"}
                            aria-pressed={key.spelling === "flat"}
                            on:click={() => onSelect({ ...key, spelling: "flat" })}>Flats</button
                        >
                    </div>
                {/if}
            </header>

            <!-- the key in a sentence: what people search for ("notes in D minor") -->
            <p class="kd_summary">{keySummary(key).sentence}</p>

            <div class="kd_block">
                <h3 class="kd_eyebrow">Related keys</h3>
                <div class="kd_related">
                    {#each relatedList as item}
                        <!-- real links to each key's page; a plain click switches in place -->
                        <a
                            href={theoryPath(item.key)}
                            class="kd_relatedBtn"
                            style="--rh: {keyHue(item.key.pos)}"
                            on:click={(event) => follow(event, item.key)}
                        >
                            <span class="kd_relatedLabel">{item.label}</span>
                            <span class="kd_relatedKey"
                                >{keyName(item.key)} <span class="kd_relatedCamelot">{camelotOf(item.key)}</span></span
                            >
                        </a>
                    {/each}
                </div>
                <p class="kd_muted">
                    All four mix smoothly in a DJ set: Camelot codes one number apart, or the same number with the
                    other letter.
                </p>
            </div>
        </div>
    </div>

    <div class="kd_block" id="scale">
        <div class="kd_headingRow">
            <h3 class="kd_heading">Scale{key.mode === "minor" ? " (natural minor)" : ""}</h3>
            <button type="button" class="kd_play" on:click={playScale}>▶ Play scale</button>
        </div>

        <ol class="kd_scale" use:dragScroll>
            {#each scale as note, i}
                <li class="kd_note" class:kd_noteTonic={i === 0} class:kd_lit={playingId === `note${i}`}>
                    <span class="kd_noteDegree"><span class="kd_glyph">{note.degree}</span></span>
                    <span class="kd_noteName">{pretty(note.name)}</span>
                    <span class="kd_noteRole">{note.role}</span>
                    <span class="kd_noteInterval">{note.interval}</span>
                </li>
                <li
                    class="kd_step"
                    class:kd_stepHalf={steps[i].semis === 1}
                    aria-label={steps[i].semis === 1 ? "half step" : "whole step"}
                >
                    <span class="kd_glyph">{steps[i].label}</span>
                </li>
            {/each}
            <li class="kd_note kd_noteTonic kd_noteOctave" class:kd_lit={playingId === "note7"}>
                <span class="kd_noteDegree"><span class="kd_glyph">8</span></span>
                <span class="kd_noteName">{pretty(scale[0].name)}</span>
                <span class="kd_noteRole">Tonic</span>
                <span class="kd_noteInterval">Octave</span>
            </li>
        </ol>

        <p class="kd_formula">
            <span class="kd_formulaSteps">{steps.map((step) => step.label).join(" – ")}</span>
            <span class="kd_muted"
                ><strong class="kd_w">W</strong> whole step (2 semitones) ·
                <strong class="kd_h">H</strong> half step (1 semitone)</span
            >
        </p>
    </div>

    <div class="kd_block kd_chordsBlock" id="chords">
        <h3 class="kd_heading">Chords in this key</h3>

        <div class="kd_kinds" role="group" aria-label="Chord type">
            {#each CHORD_KINDS as option}
                <button
                    type="button"
                    class="kd_kind"
                    class:kd_kindOn={kind === option.id}
                    aria-pressed={kind === option.id}
                    on:click={() => (kind = option.id)}>{option.label}</button
                >
            {/each}
        </div>

        <div class="kd_chordScroll" use:dragScroll>
            <div class="kd_chordGrid">
                <div class="kd_chords">
                    {#each chords as chord, i}
                        <button
                            type="button"
                            style:grid-column={i + 2}
                            class="kd_chord"
                            style="--fh: {FUNCTION_HUES[chord.func]}"
                            class:kd_lit={playingId === `chord${i}`}
                            on:click={() => playChord(chord, `chord${i}`)}
                        >
                            <span class="kd_chordTop">
                                <span class="kd_roman">{chord.roman}</span>
                                <span class="kd_chordPlay" aria-hidden="true">▶</span>
                            </span>
                            <span class="kd_chordName">{chord.name}</span>
                            <span class="kd_tones">
                                {#each chord.tones as tone}<span class="kd_tone">{tone}</span>{/each}
                            </span>
                            <span class="kd_func">{chord.func}</span>
                        </button>
                    {/each}
                </div>

                <!-- each chord's notes stacked from its root, like the chord builder's piano roll -->
                <div
                    class="kd_roll"
                    style="grid-template-rows: repeat({rollRows.length}, {rollRows.length > 26 ? 20 : 24}px)"
                >
                    {#each rollRows as row, r}
                        <div
                            class="kd_rollLane"
                            class:kd_rollLaneIn={row.inScale}
                            class:kd_rollLaneTonic={row.tonic}
                            class:kd_rollLaneBlack={row.black}
                            class:kd_rollLaneC={row.octaveStart}
                            style:grid-row={r + 1}
                        ></div>
                        <button
                            type="button"
                            tabindex="-1"
                            class="kd_rollKey"
                            class:kd_rollKeyBlack={row.black}
                            class:kd_rollKeyIn={row.inScale}
                            class:kd_rollKeyOut={!row.inScale}
                            class:kd_rollKeyTonic={row.tonic}
                            class:kd_rollKeyOn={soundingKeys.has(row.midi)}
                            style:grid-row={r + 1}
                            aria-label={`Play ${row.label || "note"}`}
                            on:pointerdown={() => looper?.previewNote(row.midi)}
                        >
                            {row.label}
                        </button>
                    {/each}
                    {#each chords as chord, i}
                        <button
                            type="button"
                            tabindex="-1"
                            aria-label={`Play ${chord.name}`}
                            class="kd_rollColumn"
                            class:kd_rollColumnLit={playingId === `chord${i}`}
                            style:grid-column={i + 2}
                            on:click={() => playChord(chord, `chord${i}`)}
                        ></button>
                        {#each chord.stack as tone, t}
                            <span
                                class="kd_rollNote"
                                class:kd_rollRoot={t === 0}
                                style="grid-column: {i + 2}; grid-row: {rollTop - tone.midi + 1}; --fh: {FUNCTION_HUES[chord.func]}"
                                >{tone.name}</span
                            >
                        {/each}
                    {/each}
                </div>
            </div>
        </div>

        <ul class="kd_legend">
            {#each FUNCTION_NAMES as name}
                <li style="--fh: {FUNCTION_HUES[name]}">
                    <span class="kd_legendDot"></span>
                    <strong>{name}</strong>
                    {FUNCTION_INFO[name]}
                </li>
            {/each}
        </ul>

        {#if dominant}
            <div class="kd_borrowed">
                <button
                    type="button"
                    class="kd_chord kd_chordBorrowed"
                    style="--fh: {FUNCTION_HUES.Dominant}"
                    class:kd_lit={playingId === "dominant"}
                    on:click={() => dominant && playChord(dominant, "dominant")}
                >
                    <span class="kd_chordTop">
                        <span class="kd_roman">{dominant.roman}</span>
                        <span class="kd_chordPlay" aria-hidden="true">▶</span>
                    </span>
                    <span class="kd_chordName">{dominant.name}</span>
                    <span class="kd_tones">
                        {#each dominant.tones as tone}<span class="kd_tone">{tone}</span>{/each}
                    </span>
                    <span class="kd_func">Borrowed</span>
                </button>
                <p class="kd_muted">
                    Minor songs usually raise the 7th to {leadingTone(key)} (from harmonic minor). That turns the
                    minor v into a major V, which pulls much harder back to {pretty(scale[0].name)}m.
                </p>
            </div>
        {/if}
    </div>

    <div class="kd_block kd_progBlock" id="progressions">
        <h3 class="kd_heading">Progressions to try</h3>
        <ul class="kd_progressions" bind:this={progTrack} use:dragScroll>
            {#each progressions as prog, p}
                {@const step = playingStep(playingId, p)}
                <li class="kd_progCard" class:kd_progCardOn={step >= 0}>
                    <div class="kd_progHead">
                        <div class="kd_progTitle">
                            <h4 class="kd_progName">{prog.name}</h4>
                            <span class="kd_progTag">{prog.kindLabel}</span>
                        </div>
                        <button
                            type="button"
                            class="kd_progPlay"
                            aria-label={step >= 0 ? `Stop ${prog.name}` : `Play ${prog.name}`}
                            on:click={() => (step >= 0 ? stopSequence() : playProgression(p, prog.bars))}
                        >
                            {#if step >= 0}
                                <span class="kd_progStop"></span>
                            {:else}
                                ▶
                            {/if}
                        </button>
                    </div>

                    <p class="kd_progAbout">{prog.about}</p>

                    <!-- four bars, like a mini timeline; a playhead sweeps across while it plays -->
                    <div class="kd_progBars" class:kd_progBarsOn={step >= 0}>
                        {#each prog.bars as bar, b}
                            <div class="kd_progBar">
                                <span class="kd_progBarNum">{b + 1}</span>
                                <div class="kd_progBarChords">
                                    {#each bar as chord (chord.index)}
                                        <div
                                            class="kd_progChord"
                                            style="--fh: {FUNCTION_HUES[chord.func]}"
                                            class:kd_progChordHalf={chord.half}
                                            class:kd_progChordOn={step === chord.index}
                                            class:kd_progChordDone={step > chord.index}
                                        >
                                            <span class="kd_progRoman">{chord.roman}</span>
                                            <span class="kd_progChordName">{chord.name}</span>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                        {#if step >= 0}
                            <span class="kd_progPlayhead" style="animation-duration: {BAR_MS * 4}ms"></span>
                        {/if}
                    </div>
                </li>
            {/each}
        </ul>
        <SwipeDots
            track={progTrack}
            labels={progressions.map((prog) => `Show ${prog.name}`)}
            ariaLabel="Progression cards"
        />
    </div>

    <div class="kd_block kd_guitarBlock" id="guitar">
        <div class="kd_headingRow kd_headingRowWrap">
            <h3 class="kd_heading">On the guitar</h3>

            <!-- positions and the notes / degrees toggle, as on the Scales neck -->
            <div class="kd_headControls">
                <div class="kd_positions" role="group" aria-label="Scale position">
                    <span class="kd_positionsLabel">Position</span>
                    <button
                        type="button"
                        class="kd_kind"
                        class:kd_kindOn={guitarPosition === null}
                        aria-pressed={guitarPosition === null}
                        on:click={() => (guitarPosition = null)}>All</button
                    >
                    {#each guitarPositions as _, i}
                        <button
                            type="button"
                            class="kd_kind kd_positionBtn"
                            class:kd_kindOn={guitarPosition === i}
                            aria-pressed={guitarPosition === i}
                            aria-label={`Position ${i + 1}`}
                            on:click={() => (guitarPosition = guitarPosition === i ? null : i)}>{i + 1}</button
                        >
                    {/each}
                </div>

                <div class="kd_toggle" role="group" aria-label="Show on the neck">
                    <button
                        type="button"
                        class:kd_toggleOn={fretLabels === "notes"}
                        aria-pressed={fretLabels === "notes"}
                        on:click={() => (fretLabels = "notes")}>Notes</button
                    >
                    <button
                        type="button"
                        class:kd_toggleOn={fretLabels === "degrees"}
                        aria-pressed={fretLabels === "degrees"}
                        on:click={() => (fretLabels = "degrees")}>Degrees</button
                    >
                </div>
            </div>
        </div>

        <Fretboard
            {scale}
            {looper}
            labels={fretLabels}
            highlight={guitarPosition === null ? null : guitarPositions[guitarPosition]}
        />

        <p class="kd_muted kd_fretNote">
            {#if guitarPosition === null}
                Every {pretty(scale[0].name)} is filled in. Standard tuning, high e on top like tab; tap a note to hear it.
            {:else}
                Position {guitarPosition + 1} starts on {pretty(scale[guitarPosition].name)} on the low E string, with
                three notes on every string. The seven positions link up end to end, and the shapes repeat every 12
                frets.
            {/if}
        </p>
    </div>

    <div class="kd_block kd_guitarBlock" id="scales">
        <div class="kd_headingRow kd_headingRowWrap">
            <h3 class="kd_heading">{moreScale.title(pretty(scale[0].name))}</h3>

            <!-- scale picker and play sit together on the right -->
            <div class="kd_headControls">
                <div class="kd_kinds kd_kindsInline" role="group" aria-label="Scale">
                    {#each moreKinds as option}
                        <a
                            href={theoryPath(key, option.id)}
                            class="kd_kind"
                            class:kd_kindOn={moreScale.id === option.id}
                            aria-current={moreScale.id === option.id ? "page" : undefined}
                            on:click={(event) => pickScale(event, option.id)}>{option.label}</a
                        >
                    {/each}
                </div>
                <button type="button" class="kd_play" on:click={playMoreScale}>▶ Play scale</button>
            </div>
        </div>

        <ol class="kd_scale" use:dragScroll>
            {#each moreScale.notes as note, i}
                <li
                    class="kd_note"
                    class:kd_noteTonic={i === 0}
                    class:kd_noteAltered={note.altered}
                    class:kd_lit={playingId === `more${i}`}
                >
                    <span class="kd_noteDegree"><span class="kd_glyph">{note.label}</span></span>
                    <span class="kd_noteName">{pretty(note.name)}</span>
                    <span class="kd_noteRole">{note.role}</span>
                    <span class="kd_noteInterval">{note.interval}</span>
                </li>
            {/each}
            <li
                class="kd_note kd_noteTonic kd_noteOctave"
                class:kd_lit={playingId === `more${moreScale.notes.length}`}
            >
                <span class="kd_noteDegree"><span class="kd_glyph">8</span></span>
                <span class="kd_noteName">{pretty(scale[0].name)}</span>
                <span class="kd_noteRole">Tonic</span>
                <span class="kd_noteInterval">Octave</span>
            </li>
        </ol>

        <p class="kd_muted kd_fretNote">{moreScale.about}</p>

        <div class="kd_headingRow kd_headingRowWrap kd_pentaNeckHead">
            <h4 class="kd_eyebrow">On the guitar</h4>

            <!-- positions and the notes / degrees toggle sit together on the right -->
            <div class="kd_headControls">
                <div class="kd_positions" role="group" aria-label="Scale position">
                    <span class="kd_positionsLabel">Position</span>
                    <button
                        type="button"
                        class="kd_kind"
                        class:kd_kindOn={morePosition === null}
                        aria-pressed={morePosition === null}
                        on:click={() => (morePosition = null)}>All</button
                    >
                    {#each morePositions as _, i}
                        <button
                            type="button"
                            class="kd_kind kd_positionBtn"
                            class:kd_kindOn={morePosition === i}
                            aria-pressed={morePosition === i}
                            aria-label={`Position ${i + 1}`}
                            on:click={() => (morePosition = morePosition === i ? null : i)}>{i + 1}</button
                        >
                    {/each}
                </div>

                <div class="kd_toggle" role="group" aria-label="Show on the neck">
                    <button
                        type="button"
                        class:kd_toggleOn={fretLabels === "notes"}
                        aria-pressed={fretLabels === "notes"}
                        on:click={() => (fretLabels = "notes")}>Notes</button
                    >
                    <button
                        type="button"
                        class:kd_toggleOn={fretLabels === "degrees"}
                        aria-pressed={fretLabels === "degrees"}
                        on:click={() => (fretLabels = "degrees")}>Degrees</button
                    >
                </div>
            </div>
        </div>

        <Fretboard
            scale={moreScale.notes}
            {looper}
            labels={fretLabels}
            highlight={morePosition === null ? null : morePositions[morePosition]}
        />

        {#if morePosition !== null}
            {@const boxNotes = moreScale.notes.filter((note) => moreScale.boxPcs.includes(note.pc))}
            <p class="kd_muted kd_fretNote">
                Position {morePosition + 1} starts on {pretty(boxNotes[morePosition].name)} on the low E string, with
                {boxNotes.length <= 5 ? "two" : "three"} notes on every string{moreScale.extraPcs.length
                    ? ", plus the blue notes inside the box"
                    : ""}. The {morePositions.length} positions link up end to end, and the shapes repeat every 12
                frets.
            </p>
        {/if}
    </div>
</section>
