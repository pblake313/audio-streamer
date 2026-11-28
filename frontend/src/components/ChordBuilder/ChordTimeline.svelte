<script lang="ts">
    import "./ChordTimeline.css";

    import {
        BEATS_PER_BAR,
        chordLabel,
        chordSpokenName,
        detectChord,
        effectiveNotes,
        isBlackKey,
        MAX_NOTE,
        noteName,
        ROOTS,
        type Root,
        type ScaleId,
    } from "../../helpers/ChordBuilder/chords";
    import { tensionColor, transitionTension } from "../../helpers/ChordBuilder/tension";
    import { FUNCTION_HUES, harmonicFunction } from "../../helpers/ChordBuilder/harmonicFunction";
    import type { SimpleChord } from "../../helpers/ChordBuilder/suggestions";
    import { chordAnatomy } from "../../helpers/ChordBuilder/chordAnatomy";
    import { onDestroy } from "svelte";
    import { dragScroll } from "../../helpers/dragScroll";
    import { floatPanel } from "../../helpers/ChordBuilder/floatPanel";
    import ChordSuggestions from "./ChordSuggestions.svelte";
    import ChordPicker from "./ChordPicker.svelte";
    import {
        boundsFor,
        clamp,
        occupiedBeats,
        type ChordSlot,
    } from "../../helpers/ChordBuilder/timeline";

    export let chords: ChordSlot[];
    export let totalBeats: number;
    export let playhead = -1;
    export let selectedId: number | null = null;
    export let onCreate: (start: number, notes?: number[]) => ChordSlot;
    export let onRemove: (id: number) => void = () => {};
    export let onPreview: (midi: number) => void = () => {};
    // pitch classes in the chosen key (null = no scale), and the key's root
    export let keyPitches: Set<number> | null = null;
    export let keyRootPc = 0;
    // pitch classes used to color notes green/red (null = plain grey notes)
    export let notePitches: Set<number> | null = null;
    // the chosen key, for the tension row (always on, unlike the highlight toggles)
    export let tensionKey: Set<number> | null = null;
    // key + scale, and a way to hear a whole chord, for the chord ideas panel
    export let keyRoot: Root = "C";
    export let scale: ScaleId = "major";
    export let onPreviewChord: (notes: number[]) => void = () => {};

    const inKey = (midi: number, pitches: Set<number> | null) => !!pitches?.has(midi % 12);
    const isKeyRoot = (midi: number, pitches: Set<number> | null, rootPc: number) =>
        !!pitches && midi % 12 === rootPc;

    // the roll shows C2 up to F#4 (Ableton naming: just over the default chords,
    // so not much empty space on top) and grows by whole octaves either way for
    // notes outside that: down to C0, up to MAX_NOTE (C6)
    const NOTE_MIN = 24;
    const NOTE_MAX = MAX_NOTE;
    const SHOW_LOW = 48;
    const SHOW_HIGH = 78;
    const ROW_H = 16;

    let lane: HTMLDivElement;
    let roll: HTMLDivElement;

    type DragMode = "start" | "end" | "move";
    let drag: {
        id: number;
        mode: DragMode;
        grabOffset: number;
        startX: number;
        moved: boolean; // false until it travels past the threshold: then it's a click
    } | null = null;

    // ---------- chord picker + suggestions ----------

    // clicking (not dragging) a chord opens a small picker under it; its
    // "Suggestions" button opens the big ideas modal on top. The chord as it was
    // is remembered so "Back to ..." can undo whatever was tried.
    let ideasFor: { id: number; original: Pick<ChordSlot, "root" | "quality" | "notes" | "slashBass"> } | null = null;
    let showSuggestions = false;
    let pickerPanel: HTMLDivElement;

    function openIdeas(chord: ChordSlot) {
        showSuggestions = false;
        ideasFor =
            ideasFor?.id === chord.id
                ? null
                : { id: chord.id, original: { root: chord.root, quality: chord.quality, notes: chord.notes ?? null, slashBass: chord.slashBass ?? null } };
    }

    /*
        The small chord picker opens under (or above) the chord, fixed to the
        window so the timeline's sideways scroll can't clip it, and capped to
        the room on screen (helpers/ChordBuilder/floatPanel.ts). Its anchor is
        the chord's span on the chord row.
    */
    const pickerAnchor = {
        getBoundingClientRect() {
            const r = lane.getBoundingClientRect();
            if (!ideasChord) return r;
            const from = ideasChord.start / totalBeats;
            const to = Math.min(ideasChord.start + ideasChord.beats, totalBeats) / totalBeats;
            return new DOMRect(r.left + r.width * from, r.top, r.width * (to - from), r.height);
        },
    };

    function closeIdeas() {
        ideasFor = null;
        showSuggestions = false;
    }

    // a click anywhere else closes the picker (but not while the modal is up)
    function handleWindowPointerDown(event: PointerEvent) {
        if (!ideasFor || showSuggestions) return;
        const target = event.target as HTMLElement;
        if (pickerPanel?.contains(target) || target.closest?.(".cbt_block")) return;
        closeIdeas();
    }

    function applyIdea(idea: SimpleChord) {
        const chord = chords.find((c) => c.id === ideasFor?.id);
        if (!chord) return;
        chord.root = idea.root;
        chord.quality = idea.quality;
        chord.notes = null; // fresh voicing for the new chord
        chord.slashBass = null;
        chords = chords;
        onPreviewChord(effectiveNotes(idea));
    }

    function revertIdea() {
        const chord = chords.find((c) => c.id === ideasFor?.id);
        if (!chord || !ideasFor) return;
        Object.assign(chord, ideasFor.original);
        chords = chords;
        onPreviewChord(rawNotes(chord));
    }

    // neighbors in loop order (wrapping around), for the suggestions' context
    // the panel hides itself if its chord was removed or pushed past the loop end
    $: ideasChord = ideasFor
        ? chords.find((c) => c.id === ideasFor!.id && c.start < totalBeats) ?? null
        : null;
    $: ideasNeighbors = (() => {
        if (!ideasChord) return { prev: null, next: null };
        const ordered = [...visible].sort((a, b) => a.start - b.start);
        const i = ordered.findIndex((c) => c.id === ideasChord!.id);
        if (ordered.length < 2 || i < 0) return { prev: null, next: null };
        const simple = (c: ChordSlot): SimpleChord => ({ root: c.root, quality: c.quality });
        return {
            prev: simple(ordered[(i - 1 + ordered.length) % ordered.length]),
            next: simple(ordered[(i + 1) % ordered.length]),
        };
    })();
    // the picker opens toward whichever side has more room
    // has anything been tried since the picker opened?
    $: canRevert =
        !!ideasFor && !!ideasChord &&
        (ideasChord.root !== ideasFor.original.root ||
            ideasChord.quality !== ideasFor.original.quality ||
            (ideasChord.notes ?? null) !== ideasFor.original.notes);
    $: ideasAnchorRight = ideasChord ? ideasChord.start + ideasChord.beats / 2 > totalBeats / 2 : false;

    // a single note picked in the piano roll (index into that chord's notes)
    let selectedNote: { chordId: number; index: number } | null = null;
    let noteDrag = false;

    $: bars = totalBeats / BEATS_PER_BAR;
    // narrower beat columns for long loops, so 12 bars (48 beats) still fits on screen
    $: cellMin = totalBeats > 32 ? 20 : 34;
    $: visible = chords.filter((c) => c.start < totalBeats);
    $: taken = occupiedBeats(chords, totalBeats);

    // selecting another chord drops the note selection
    $: if (selectedNote && selectedNote.chordId !== selectedId) selectedNote = null;

    // ---------- piano roll ----------

    // unsorted, so indices stay stable while a note is dragged past another
    const rawNotes = (chord: ChordSlot) => chord.notes ?? effectiveNotes(chord);

    type RollNote = {
        key: string;
        midi: number;
        index: number;
        start: number;
        beats: number;
        chordId: number;
        lowest: boolean; // the chord's bass note
    };

    $: rollNotes = visible.flatMap((chord): RollNote[] => {
        const beats = Math.min(chord.beats, totalBeats - chord.start);
        const notes = rawNotes(chord);
        const low = Math.min(...notes);
        return notes.map((midi, index) => ({
            lowest: notes.length > 1 && midi === low,
            key: `${chord.id}-${index}`,
            midi,
            index,
            start: chord.start,
            beats,
            chordId: chord.id,
        }));
    });

    // ---------- tension ----------

    // one marker where each chord starts, scoring the move into it from the
    // chord before (the first chord is reached from the last, as the loop wraps)
    // hand-edited chords take their root from the name the namer gives them
    const rootPcOf = (chord: ChordSlot) => {
        if (!chord.notes) return ROOTS.indexOf(chord.root);
        const named = chordLabel(chord).match(/^[A-G](#|b)?/)?.[0];
        const pc = ROOTS.indexOf(named as (typeof ROOTS)[number]);
        return pc >= 0 ? pc : ROOTS.indexOf(chord.root);
    };

    // tonic / predominant / dominant badge for each chord in the current key
    const functionOf = (chord: ChordSlot, rootPc: number, scalePcs: Set<number> | null) =>
        harmonicFunction(
            effectiveNotes(chord).map((midi) => midi % 12),
            rootPcOf(chord),
            rootPc,
            scalePcs,
        );


    $: transitions = (() => {
        const ordered = [...visible].sort((a, b) => a.start - b.start);
        if (ordered.length < 2) return [];

        return ordered.map((to, i) => {
            const from = ordered[(i - 1 + ordered.length) % ordered.length];
            const tension = transitionTension(
                { notes: rawNotes(from), rootPc: rootPcOf(from) },
                { notes: rawNotes(to), rootPc: rootPcOf(to) },
                tensionKey,
            );
            return {
                key: `${from.id}-${to.id}`,
                at: to.start,
                tension,
                title: `${chordLabel(from)} → ${chordLabel(to)}: ${tension.label}` +
                    (tension.reasons.length ? ` (${tension.reasons.join(", ")})` : ""),
            };
        });
    })();

    $: usedMidi = rollNotes.map((n) => n.midi);
    /*
        The roll's range: C2-C5, plus whole octaves either way when needed:
          - for notes already outside it (an import, transposing, an octave jump)
          - when you put a note in the top or bottom EDGE_ROWS rows (click, drag
            or arrow keys), so there's room to keep going that way
        A grown octave stays while a note is still in it or next to it, then
        goes away. Never past C0 / C6, and never mid-drag: it waits for the
        release so the rows don't move under the pointer.
    */
    const EDGE_ROWS = 2;
    let reachHigh = SHOW_HIGH; // where your edits have asked the roll to reach
    let reachLow = SHOW_LOW;
    let rollHigh = SHOW_HIGH;
    let rollLow = SHOW_LOW;

    $: usedTop = usedMidi.length ? Math.max(...usedMidi) : SHOW_HIGH;
    $: usedBottom = usedMidi.length ? Math.min(...usedMidi) : SHOW_LOW;
    // a grown octave is kept while a note sits in it or just inside the old edge
    $: keptHigh = reachHigh > SHOW_HIGH && usedTop >= reachHigh - 12 - EDGE_ROWS ? reachHigh : SHOW_HIGH;
    $: keptLow = reachLow < SHOW_LOW && usedBottom <= reachLow + 12 + EDGE_ROWS - 1 ? reachLow : SHOW_LOW;
    // the top grows in octaves from SHOW_HIGH (F#4, F#5, then the C6 ceiling) to fit
    // the highest note; the bottom to the C under the lowest note
    $: neededHigh = SHOW_HIGH + Math.max(0, Math.ceil((usedTop - SHOW_HIGH) / 12)) * 12;
    $: neededLow = usedBottom - (usedBottom % 12);
    $: if (!noteDrag) {
        rollHigh = Math.min(NOTE_MAX, Math.max(SHOW_HIGH, neededHigh, keptHigh));
        rollLow = Math.max(NOTE_MIN, Math.min(SHOW_LOW, neededLow, keptLow));
    }

    /** After you put a note at `midi`: near the top or bottom edge opens the next octave that way. */
    function reachFor(midi: number) {
        if (midi > rollHigh - EDGE_ROWS && rollHigh < NOTE_MAX) reachHigh = Math.min(NOTE_MAX, rollHigh + 12);
        if (midi < rollLow + EDGE_ROWS && rollLow > NOTE_MIN) reachLow = Math.max(NOTE_MIN, rollLow - 12);
    }
    $: rollKeys = Array.from({ length: rollHigh - rollLow + 1 }, (_, i) => rollHigh - i);
    $: rowOf = (midi: number) => rollHigh - midi + 1;

    $: activeChordId =
        visible.find((c) => playhead >= c.start && playhead < c.start + c.beats)?.id ?? null;

    $: activeKeys = new Set(
        rollNotes.filter((n) => n.chordId === activeChordId).map((n) => n.midi),
    );


    /** Moves one note of a chord, keeping chord notes unique, and re-names the chord. */
    function setNote(chord: ChordSlot, index: number, midi: number) {
        const notes = [...rawNotes(chord)];
        midi = clamp(midi, NOTE_MIN, NOTE_MAX);

        if (notes[index] === midi || notes.includes(midi)) return false;

        notes[index] = midi;
        commitNotes(chord, notes);
        onPreview(midi);
        return true;
    }

    function commitNotes(chord: ChordSlot, notes: number[]) {
        chord.notes = notes;
        chord.slashBass = null; // hand-edited: name it from its notes again

        // keep root/type in sync when the new notes spell a known chord
        const detected = detectChord(notes);
        if (detected) {
            chord.root = detected.root;
            chord.quality = detected.quality;
        }

        chords = chords;
    }

    // ---------- click to add or remove ----------

    // a press on a note only becomes a drag once it moves this far; a press
    // that never moves is a click, and a click on a note removes it
    const DRAG_THRESHOLD_PX = 4;
    let pressedNote: { note: RollNote; startY: number } | null = null;
    let noteMoved = false;

    function removeNote(note: RollNote) {
        const chord = chords.find((c) => c.id === note.chordId);
        if (!chord) return;

        selectedNote = null;
        noteDrag = false;

        const notes = rawNotes(chord).filter((_, i) => i !== note.index);

        // removing the last note removes the chord
        if (notes.length === 0) {
            onRemove(chord.id);
            return;
        }

        commitNotes(chord, notes);
    }

    /*
        A press on empty roll space adds a note on release, and only if it
        didn't move: a clean click or tap. A press that moves is a pan instead,
        swiping the roll sideways with a finger, or dragging it with the mouse
        (use:dragScroll on .cbt_scroll, when the roll is wider than the screen),
        so moving around never drops notes. When the browser takes a touch over
        to scroll, it sends pointercancel and the tap is dropped.
    */
    const TAP_SLOP_PX = 8;
    let pendingTap: { id: number; x: number; y: number } | null = null;

    function addNoteAt(event: PointerEvent) {
        if (event.button !== 0) return;

        // a mouse press shouldn't select text; a touch is left alone so it can still scroll
        if (event.pointerType === "mouse") event.preventDefault();
        pendingTap = { id: event.pointerId, x: event.clientX, y: event.clientY };
    }

    function finishTap(event: PointerEvent) {
        if (!pendingTap || event.pointerId !== pendingTap.id) return;
        const tap = pendingTap;
        pendingTap = null;
        if (event.type !== "pointerup") return; // cancelled: the browser scrolled instead
        if (Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > TAP_SLOP_PX) return;
        addNoteAtPoint(event.clientX, event.clientY);
    }

    function addNoteAtPoint(clientX: number, clientY: number) {
        const rect = roll.getBoundingClientRect();
        const beat = Math.floor((clientX - rect.left) / (rect.width / totalBeats));
        const midi = midiAt(clientY);

        if (beat < 0 || beat >= totalBeats || midi < rollLow || midi > rollHigh) return;

        const chord = visible.find((c) => beat >= c.start && beat < c.start + c.beats);

        if (chord) {
            const notes = rawNotes(chord);
            if (notes.includes(midi)) return;

            commitNotes(chord, [...notes, midi]);
            selectedId = chord.id;
            selectedNote = { chordId: chord.id, index: notes.length };
        } else {
            // empty beat: start a new chord holding just this note
            const created = onCreate(beat, [midi]);
            selectedId = created.id;
            selectedNote = { chordId: created.id, index: 0 };
        }

        onPreview(midi);
        reachFor(midi);
    }

    function midiAt(clientY: number) {
        const rect = roll.getBoundingClientRect();
        // dragging stays inside the rows on screen, so the roll never resizes under the pointer
        return clamp(rollHigh - Math.floor((clientY - rect.top) / ROW_H), rollLow, rollHigh);
    }

    function beginNoteDrag(event: PointerEvent, note: RollNote) {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();

        // not a drag yet: removed on release unless the pointer moves first
        selectedId = note.chordId;
        selectedNote = { chordId: note.chordId, index: note.index };
        noteDrag = true;
        noteMoved = false;
        pressedNote = { note, startY: event.clientY };

        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }

    function nudgeSelectedNote(step: number) {
        if (!selectedNote) return;
        const chord = chords.find((c) => c.id === selectedNote!.chordId);
        if (!chord) return;

        // hop over notes the chord already has
        let target = rawNotes(chord)[selectedNote.index] + step;
        while (target >= NOTE_MIN && target <= NOTE_MAX) {
            if (setNote(chord, selectedNote.index, target)) {
                reachFor(target);
                break;
            }
            target += Math.sign(step);
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape" && showSuggestions) {
            showSuggestions = false; // back to the small picker
            return;
        }
        if (event.key === "Escape" && ideasFor) {
            closeIdeas();
            return;
        }
        if (!selectedNote) return;
        const tag = (event.target as HTMLElement).tagName;
        if (["INPUT", "SELECT", "TEXTAREA"].includes(tag)) return;

        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            const direction = event.key === "ArrowUp" ? 1 : -1;
            nudgeSelectedNote(direction * (event.shiftKey ? 12 : 1));
        } else if (event.key === "Escape") {
            selectedNote = null;
        }
    }

    // ---------- chord dragging ----------

    // position on the lane in beats (fractional)
    function beatAt(clientX: number) {
        const rect = lane.getBoundingClientRect();
        return (clientX - rect.left) / (rect.width / totalBeats);
    }

    // ---------- hover card: how the chord is built ----------

    // shown after a short pause over a chord; fixed-positioned so the
    // timeline's scroll box can't clip it
    let hoverCard: { chordId: number; left: number; top: number; above: boolean } | null = null;
    let hoverTimer: ReturnType<typeof setTimeout> | null = null;
    const CARD_W = 300;

    function showCardSoon(event: PointerEvent, chord: ChordSlot) {
        if (event.pointerType !== "mouse" || drag) return; // no hover on touch
        const block = event.currentTarget as HTMLElement;
        hideCard();
        hoverTimer = setTimeout(() => {
            const rect = block.getBoundingClientRect();
            const above = window.innerHeight - rect.bottom < 260 && rect.top > 260;
            hoverCard = {
                chordId: chord.id,
                left: Math.max(12, Math.min(rect.left, window.innerWidth - CARD_W - 12)),
                top: above ? rect.top - 8 : rect.bottom + 8,
                above,
            };
        }, 350);
    }

    function hideCard() {
        if (hoverTimer) clearTimeout(hoverTimer);
        hoverTimer = null;
        hoverCard = null;
    }

    // the card always describes the chord as it is now (it may change while shown)
    $: hoveredChord = hoverCard ? visible.find((c) => c.id === hoverCard?.chordId) ?? null : null;
    $: anatomy = hoveredChord ? chordAnatomy(hoveredChord) : null;
    // out of the way while dragging or while that chord's picker is open
    $: showAnatomy = anatomy !== null && drag === null && ideasFor?.id !== hoverCard?.chordId;

    onDestroy(hideCard);

    function beginDrag(event: PointerEvent, chord: ChordSlot, mode: DragMode) {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        hideCard();

        selectedId = chord.id;
        drag = {
            id: chord.id,
            mode,
            grabOffset: Math.floor(beatAt(event.clientX)) - chord.start,
            startX: event.clientX,
            moved: mode !== "move", // edge handles always resize; the body may be a click
        };

        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event: PointerEvent) {
        if (noteDrag && selectedNote) {
            if (!noteMoved) {
                if (!pressedNote || Math.abs(event.clientY - pressedNote.startY) < DRAG_THRESHOLD_PX) return;
                noteMoved = true;
                onPreview(pressedNote.note.midi);
            }

            const chord = chords.find((c) => c.id === selectedNote!.chordId);
            if (chord) setNote(chord, selectedNote.index, midiAt(event.clientY));
            return;
        }

        if (!drag) return;

        if (!drag.moved) {
            if (Math.abs(event.clientX - drag.startX) < DRAG_THRESHOLD_PX) return;
            drag.moved = true;
        }

        const chord = chords.find((c) => c.id === drag!.id);
        if (!chord) return;

        const { prevEnd, nextStart } = boundsFor(chords, chord.id, totalBeats);
        const end = chord.start + chord.beats;
        const position = beatAt(event.clientX);

        if (drag.mode === "end") {
            const newEnd = clamp(Math.round(position), chord.start + 1, nextStart);
            chord.beats = newEnd - chord.start;
        } else if (drag.mode === "start") {
            const newStart = clamp(Math.round(position), prevEnd, end - 1);
            chord.beats = end - newStart;
            chord.start = newStart;
        } else {
            const wanted = Math.floor(position) - drag.grabOffset;
            chord.start = Math.max(prevEnd, Math.min(wanted, nextStart - chord.beats));
        }

        chords = chords;
    }

    function endDrag(event?: PointerEvent) {
        if (event) finishTap(event); // a touch on empty roll space: add a note only if it was a tap
        // a note pressed and released without moving was a click: remove it
        if (noteDrag && !noteMoved && pressedNote && event?.type === "pointerup") {
            removeNote(pressedNote.note);
        }

        // a note dragged to the top or bottom edge opens the next octave (now, after the release)
        if (noteDrag && noteMoved && selectedNote) {
            const chord = chords.find((c) => c.id === selectedNote!.chordId);
            const midi = chord ? rawNotes(chord)[selectedNote.index] : undefined;
            if (midi !== undefined) reachFor(midi);
        }

        // a chord pressed and released without moving was a click: show ideas
        if (drag && !drag.moved && event?.type === "pointerup") {
            const chord = chords.find((c) => c.id === drag!.id);
            if (chord) openIdeas(chord);
        }

        drag = null;
        noteDrag = false;
        noteMoved = false;
        pressedNote = null;
    }
</script>

<svelte:window
    on:pointermove={handlePointerMove}
    on:pointerup={endDrag}
    on:pointercancel={endDrag}
    on:pointerdown={handleWindowPointerDown}
    on:keydown={handleKeydown}
    on:scroll={hideCard}
/>

<!-- how the hovered chord is built -->
{#if showAnatomy && anatomy && hoverCard}
    <div
        class="cbt_anatomy"
        class:cbt_anatomyAbove={hoverCard.above}
        style="left: {hoverCard.left}px; top: {hoverCard.top}px; width: {CARD_W}px"
        role="tooltip"
    >
        <div class="cbt_anatomyHead">
            <span class="cbt_anatomyName">{anatomy.name}</span>
            <span class="cbt_anatomySpoken">{anatomy.spoken}</span>
        </div>

        <p class="cbt_anatomyRecipe">{anatomy.recipe}</p>

        <ul class="cbt_anatomyParts">
            {#each anatomy.parts as part}
                <li class:cbt_anatomyRoot={part.role === "Root"}>
                    <span class="cbt_anatomyNote">{part.note}</span>
                    <span class="cbt_anatomyRole">{part.role}</span>
                </li>
            {/each}
        </ul>

        {#if anatomy.bass}
            <p class="cbt_anatomyBass">With {anatomy.bass} in the bass instead of the root.</p>
        {/if}
        {#if anatomy.vibe}
            <p class="cbt_anatomyVibe">{anatomy.vibe}</p>
        {/if}
    </div>
{/if}

<div class="cbt_scroll" use:dragScroll>
    <div
        class="cbt_timeline"
        style="--beats: {totalBeats}; --rows: {rollKeys.length}; --row-h: {ROW_H}px; --cell-min: {cellMin}px"
        class:cbt_dragging={drag !== null}
        class:cbt_noteDragging={noteDrag}
    >
        <!-- bar numbers, chords and tension stick under the top bar while scrolling -->
        <div class="cbt_stickyTop">
        <!-- chord lane -->
        <div class="cbt_row">
            <div class="cbt_gutter cbt_gutterLabel">Chords</div>
            <div class="cbt_lane" bind:this={lane}>
                {#each Array(totalBeats) as _, beat}
                    <button
                        type="button"
                        class="cbt_cell"
                        class:cbt_cellBar={beat % BEATS_PER_BAR === 0}
                        class:cbt_cellTaken={taken[beat]}
                        style="grid-column: {beat + 1}"
                        tabindex={taken[beat] ? -1 : 0}
                        aria-hidden={taken[beat] ? "true" : undefined}
                        aria-label={`Add chord at bar ${Math.floor(beat / BEATS_PER_BAR) + 1}, beat ${(beat % BEATS_PER_BAR) + 1}`}
                        on:click={() => {
                            // a chord's margin leaves the cell under it showing at the edges
                            if (!taken[beat]) onCreate(beat);
                        }}
                    >
                        <span aria-hidden="true">+</span>
                    </button>
                {/each}

                {#each visible as chord (chord.id)}
                    {@const shown = Math.min(chord.beats, totalBeats - chord.start)}
                    {@const func = functionOf(chord, keyRootPc, tensionKey)}
                    <div
                        class="cbt_block"
                        class:cbt_blockSelected={selectedId === chord.id}
                        class:cbt_blockActive={activeChordId === chord.id}
                        class:cbt_blockClipped={shown < chord.beats}
                        style="grid-column: {chord.start + 1} / span {shown}"
                        role="button"
                        tabindex="0"
                        aria-label={`${chordLabel(chord)} (${chordSpokenName(chord)}), ${chord.beats} beats`}
                        on:pointerenter={(e) => showCardSoon(e, chord)}
                        on:pointerleave={hideCard}
                        on:pointerdown={(e) => beginDrag(e, chord, "move")}
                        on:keydown={(e) => {
                            if (e.key === "Enter") selectedId = chord.id;
                        }}
                        on:focus={() => (selectedId = chord.id)}
                    >
                        <span
                            class="cbt_handle cbt_handleStart"
                            aria-hidden="true"
                            on:pointerdown={(e) => beginDrag(e, chord, "start")}
                        ></span>

                        <span class="cbt_blockName">{chordLabel(chord)}</span>
                        <span class="cbt_blockSpokenRow">
                            <span class="cbt_blockSpoken">{chordSpokenName(chord)}</span>
                            {#if func}
                                <span
                                    class="cbt_blockFunction"
                                    style="--fh: {FUNCTION_HUES[func]}"
                                    title={`${func} in this key`}>{func}</span
                                >
                            {/if}
                        </span>

                        <span
                            class="cbt_handle cbt_handleEnd"
                            aria-hidden="true"
                            on:pointerdown={(e) => beginDrag(e, chord, "end")}
                        ></span>
                    </div>
                {/each}

                {#if playhead >= 0}
                    <div class="cbt_playhead" style="grid-column: {playhead + 1}"></div>
                {/if}

                <!-- small chord picker under the clicked chord; the big ideas modal opens from it -->
                {#if ideasFor && ideasChord}
                    {#key ideasFor.id}
                        <div
                            class="cbt_picker"
                            bind:this={pickerPanel}
                            use:floatPanel={{ anchor: pickerAnchor, align: ideasAnchorRight ? "right" : "left", fit: true }}
                        >
                            <ChordPicker
                                current={{ root: ideasChord.root, quality: ideasChord.quality }}
                                currentLabel={chordLabel(ideasChord)}
                                {keyRoot}
                                {scale}
                                {canRevert}
                                revertLabel={chordLabel(ideasFor.original)}
                                onApply={applyIdea}
                                onRevert={revertIdea}
                                onClose={closeIdeas}
                                onOpenSuggestions={() => (showSuggestions = true)}
                            />
                        </div>

                        {#if showSuggestions}
                            <ChordSuggestions
                                current={{ root: ideasChord.root, quality: ideasChord.quality }}
                                currentLabel={chordLabel(ideasChord)}
                                prev={ideasNeighbors.prev}
                                next={ideasNeighbors.next}
                                {keyRoot}
                                {scale}
                                {canRevert}
                                revertLabel={chordLabel(ideasFor.original)}
                                onApply={applyIdea}
                                onRevert={revertIdea}
                                onClose={() => (showSuggestions = false)}
                                onDone={closeIdeas}
                            />
                        {/if}
                    {/key}
                {/if}
            </div>
        </div>

        <!-- bar numbers, between the chords and the tension row -->
        <div class="cbt_row">
            <div class="cbt_gutter"></div>
            <div class="cbt_ruler">
                {#each Array(bars) as _, bar}
                    <div class="cbt_bar" style="grid-column: {bar * BEATS_PER_BAR + 1} / span {BEATS_PER_BAR}">
                        {bar + 1}
                    </div>
                {/each}
            </div>
        </div>

        <!-- tension at each chord change -->
        <div class="cbt_row cbt_tensionRow">
            <div class="cbt_gutter cbt_gutterLabel">Tension</div>
            <div class="cbt_tension">
                {#each transitions as t (t.key)}
                    <div
                        class="cbt_tensionMark"
                        class:cbt_tensionMarkStart={t.at === 0}
                        style="left: {(t.at / totalBeats) * 100}%; --tension: {tensionColor(t.tension.value)}"
                        title={t.title}
                        role="img"
                        aria-label={t.title}
                    ></div>
                {/each}
            </div>
        </div>
        </div>

        <!-- piano roll -->
        <div class="cbt_rollWrap">
            <div class="cbt_row cbt_rollRow">
                <div class="cbt_keys">
                    {#each rollKeys as midi}
                        <button
                            type="button"
                            tabindex="-1"
                            class="cbt_key"
                            class:cbt_keyBlack={isBlackKey(midi)}
                            class:cbt_keyC={midi % 12 === 0}
                            class:cbt_keyOn={activeKeys.has(midi)}
                            class:cbt_keyInScale={inKey(midi, keyPitches)}
                            class:cbt_keyOutScale={keyPitches !== null && !inKey(midi, keyPitches)}
                            class:cbt_keyScaleRoot={isKeyRoot(midi, keyPitches, keyRootPc)}
                            aria-label={`Play ${noteName(midi)}`}
                            on:pointerdown={() => onPreview(midi)}
                        >
                            <!-- with a key picked, name every note in it (like Ableton); otherwise just the Cs -->
                            {#if keyPitches ? inKey(midi, keyPitches) : midi % 12 === 0}{noteName(midi)}{/if}
                        </button>
                    {/each}
                </div>

                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div class="cbt_roll" bind:this={roll} on:pointerdown={addNoteAt}>
                    {#each rollKeys as midi, i}
                        <div
                            class="cbt_rollLane"
                            class:cbt_rollLaneBlack={!keyPitches && isBlackKey(midi)}
                            class:cbt_rollLaneIn={inKey(midi, keyPitches)}
                            class:cbt_rollLaneOut={keyPitches !== null && !inKey(midi, keyPitches)}
                            class:cbt_rollLaneRoot={isKeyRoot(midi, keyPitches, keyRootPc)}
                            class:cbt_rollLaneC={midi % 12 === 0}
                            style="grid-row: {i + 1}"
                        ></div>
                    {/each}

                    {#each Array(totalBeats) as _, beat}
                        <div
                            class="cbt_rollBeat"
                            class:cbt_rollBeatBar={beat % BEATS_PER_BAR === 0}
                            style="grid-column: {beat + 1}"
                        ></div>
                    {/each}

                    {#each rollNotes as note (note.key)}
                        <div
                            class="cbt_note"
                            class:cbt_noteBass={note.lowest}
                            class:cbt_noteIn={notePitches !== null && inKey(note.midi, notePitches)}
                            class:cbt_noteOut={notePitches !== null && !inKey(note.midi, notePitches)}
                            class:cbt_noteChord={note.chordId === selectedId}
                            class:cbt_noteSelected={selectedNote?.chordId === note.chordId && selectedNote?.index === note.index}
                            class:cbt_noteOn={note.chordId === activeChordId}
                            style="grid-row: {rowOf(note.midi)}; grid-column: {note.start + 1} / span {note.beats}"
                            role="button"
                            tabindex="-1"
                            aria-label={`${noteName(note.midi)}, drag up or down to change pitch`}
                            on:pointerdown={(e) => beginNoteDrag(e, note)}
                        >
                            <span class="cbt_noteName">{noteName(note.midi)}</span>
                        </div>
                    {/each}

                    {#if playhead >= 0}
                        <div class="cbt_playhead cbt_rollPlayhead" style="grid-column: {playhead + 1}"></div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- beat counter -->
        <div class="cbt_row">
            <div class="cbt_gutter"></div>
            <div class="cbt_counter">
                {#each Array(totalBeats) as _, beat}
                    <span
                        class="cbt_tick"
                        class:cbt_tickBar={beat % BEATS_PER_BAR === 0}
                        class:cbt_tickOn={playhead === beat}
                    ></span>
                {/each}
            </div>
        </div>
    </div>
</div>
