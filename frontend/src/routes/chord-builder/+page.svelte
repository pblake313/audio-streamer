<script lang="ts">
    import "./ChordBuilderPage.css";

    import { onDestroy, onMount, tick } from "svelte";
    import Footer from "../../components/standalone/Nav/Footer.svelte";
    import Seo from "../../components/misc/Seo.svelte";
    import ChordTimeline from "../../components/ChordBuilder/ChordTimeline.svelte";
    import PlayIcon from "../../components/Icons/svg/PlayIcon.svelte";
    import PauseIcon from "../../components/Icons/svg/PauseIcon.svelte";
    import Dropdown from "../../components/ChordBuilder/Dropdown.svelte";
    import SoundPicker from "../../components/ChordBuilder/SoundPicker.svelte";
    import InspiredPicker from "../../components/ChordBuilder/InspiredPicker.svelte";
    import { audioStore } from "../../stores/AudioPlayerStore";
    import { user } from "../../stores/UserStore";
    import { pushNotification } from "../../stores/NotificationStore";
    import { downloadMidi } from "../../helpers/ChordBuilder/exportMidi";
    import { dragScroll } from "../../helpers/dragScroll";
    import { importMidiFile } from "../../helpers/ChordBuilder/importMidi";
    import {
        artistKeyOf,
        deleteProgression,
        editProgression,
        fetchProgressions,
        saveProgression,
        type SavedProgression,
    } from "../../helpers/ChordBuilder/progressionsApi";
    import MidiLibrary from "../../components/ChordBuilder/MidiLibrary.svelte";
    import {
        BEATS_PER_BAR,
        effectiveNotes,
        MAX_NOTE,
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
    import { COMPLEXITY_OPTIONS, type Complexity } from "../../helpers/ChordBuilder/complexity";
    import { numeralInKey, scaleDegree } from "../../helpers/ChordBuilder/suggestions";
    import {
        buildProgression,
        generateInStyle,
        typicalKeyAndTempo,
        withSavedProgressions,
        type ArtistStyle,
    } from "../../helpers/ChordBuilder/artistStyles";

    const MIN_BPM = 40;
    const MAX_BPM = 200;
    const BAR_OPTIONS = [2, 4, 8, 12] as const;

    let nextId = 1;
    const slot = (chord: Chord): ChordSlot => ({ ...chord, id: nextId++ });

    let bpm = 120;
    let bars: (typeof BAR_OPTIONS)[number] = 4;
    let metronome = false;
    let instrument: InstrumentId = "feltPiano";
    // how rich shuffled chords are; "random" = triads or 7ths by coin flip
    let complexity: Complexity = "random";
    const complexityOptions = COMPLEXITY_OPTIONS.map(({ value, label }) => ({ value, label }));

    // options for the custom dropdowns
    const rootOptions = ROOTS.map((root) => ({ value: root, label: root }));
    const scaleOptions = (Object.keys(SCALES) as ScaleId[]).map((id) => ({ value: id, label: SCALES[id].label }));
    const setKeyRoot = (value: string) => (keyRoot = value as Root);
    const setScale = (value: string) => (scale = value as ScaleId);

    // start somewhere new each visit: random key + a progression that fits it
    const start = randomProgression(bars, complexity);

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

    // full-width layout: the nav and footer drop their max-width on this page only
    onMount(() => {
        document.body.classList.add("chordBuilder_fullWidth");
        return () => document.body.classList.remove("chordBuilder_fullWidth");
    });

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


    // ---------- transpose: the key and every chord, a semitone at a time ----------

    const LOWEST_NOTE = 36; // the piano roll's bottom row (C1 in its Ableton-style labels)
    const shiftRoot = (root: Root, by: number) => ROOTS[(ROOTS.indexOf(root) + by + 12) % 12];

    /*
        Moves the notes the chords actually play, not just their names: an
        auto-voiced chord is re-voiced into the same fixed range from its root,
        so changing only the root made the progression climb, then drop an
        octave as soon as a root crossed that range. Now every note moves a
        semitone, so the whole thing really goes up (or down).

        The piano roll grows to show wherever it goes. Only at the hard limits
        does anything fold: a note passing MAX_NOTE (C6) drops an octave on its
        own (the chord re-voices and stays where it is); a bass passing the
        bottom lifts the whole chord an octave, so the bass stays the lowest
        note and the chord keeps its name.
    */
    function transposeNotes(notes: number[], by: number) {
        let moved = notes.map((n) => n + by);
        if (Math.min(...moved) < LOWEST_NOTE) moved = moved.map((n) => n + 12);
        const bass = Math.min(...moved);
        moved = moved.map((n) => (n > MAX_NOTE && n - 12 > bass ? n - 12 : n));
        return [...new Set(moved)].sort((a, b) => a - b);
    }

    function transpose(by: 1 | -1) {
        keyRoot = shiftRoot(keyRoot, by);
        chords = chords.map((c) => {
            const notes = transposeNotes(effectiveNotes(c), by);
            return {
                ...c,
                root: shiftRoot(c.root, by),
                slashBass: c.slashBass ? shiftRoot(c.slashBass, by) : c.slashBass,
                notes,
            };
        });
    }

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
        // never stack two chords on one beat: pick the chord already there instead
        const existing = chords.find((c) => start >= c.start && start < c.start + c.beats);
        if (existing) {
            selectedId = existing.id;
            return existing;
        }

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
    // ---------- MIDI import + library (logged-in users only) ----------
    // Importing reads the file in the browser; saving, fetching, editing and
    // deleting go to /secure/midi/progressions, behind the login middleware.

    let importingMidi = false;
    let draggingFile = false;
    let libraryOpen = false;
    let libraryLoading = false;
    let savedProgressions: SavedProgression[] = [];
    let pendingImport: { fileName: string; chordCount: number; bpm: number; keyLabel: string } | null = null;

    // fetch the library once per login; forget it (and any artist pick) on logout
    let libraryLoadedForUser = false;
    $: if ($user && !libraryLoadedForUser) {
        libraryLoadedForUser = true;
        loadLibrary();
    }
    $: if (!$user && libraryLoadedForUser) {
        libraryLoadedForUser = false;
        savedProgressions = [];
        libraryOpen = false;
        pendingImport = null;
        styleId = "none";
        basedOn = null;
    }

    async function loadLibrary() {
        libraryLoading = true;
        try {
            savedProgressions = await fetchProgressions();
        } catch (error: any) {
            pushNotification(error?.message || "Could not load your MIDI library.", "Error", false, 4000, "MIDI library");
        } finally {
            libraryLoading = false;
        }
    }

    /** Loads a .mid file into the timeline, then offers to save it to the library. */
    async function importMidi(file: File) {
        if (!$user || importingMidi) return;
        importingMidi = true;

        try {
            const result = await importMidiFile(file);

            bpm = result.bpm;
            bars = result.bars;
            keyRoot = result.keyRoot;
            scale = result.scale;
            chords = result.chords.map(slot);
            selectedId = null;
            styleId = "none";
            basedOn = { label: file.name, kind: "file" };

            pendingImport = {
                fileName: file.name,
                chordCount: result.chords.length,
                bpm: result.bpm,
                keyLabel: `${result.keyRoot} ${SCALES[result.scale].label} (a guess: change it under Key if needed)`,
            };
            libraryOpen = true;

            if (result.trimmed) {
                pushNotification("Only the first 12 bars were kept.", "Warning", false, 4000, "MIDI import");
            }
        } catch (error: any) {
            pushNotification(error?.message || "Could not read that MIDI file.", "Error", false, 5000, "MIDI import");
        } finally {
            importingMidi = false;
        }
    }

    /** Saves what is in the timeline now (the import, plus any edits) under an artist. */
    async function savePendingImport(artist: string, song: string) {
        const inLoop = chords.filter((c) => c.start < totalBeats);
        try {
            const created = await saveProgression({
                artist,
                song,
                keyRoot,
                scale,
                bpm: clampBpm(bpm),
                sourceFile: pendingImport?.fileName ?? null,
                chords: inLoop.map((c) => ({
                    start: c.start,
                    beats: Math.min(c.beats, totalBeats - c.start),
                    notes: c.notes && c.notes.length ? [...c.notes] : effectiveNotes(c),
                })),
            });
            savedProgressions = [created, ...savedProgressions];
            pendingImport = null;
            basedOn = { label: song, kind: "saved" };
            pushNotification(`Saved "${song}" under ${artist}.`, "Success", false, 3500, "MIDI library");
        } catch (error: any) {
            pushNotification(error?.message || "Could not save the progression.", "Error", false, 4000, "MIDI library");
        }
    }

    /** Puts a saved progression in the timeline, in its own key, tempo and timing. */
    function loadSaved(p: SavedProgression) {
        const lastEnd = Math.max(...p.chords.map((c) => c.start + c.beats));
        bars = BAR_OPTIONS.find((b) => b * BEATS_PER_BAR >= lastEnd) ?? 12;
        keyRoot = p.keyRoot;
        scale = p.scale;
        bpm = p.bpm;
        const song = { song: p.song, key: p.keyRoot, scale: p.scale, bpm: p.bpm, chords: [], exact: p.chords };
        chords = buildProgression(song, p.keyRoot, bars).map(slot);
        selectedId = null;
        basedOn = { label: p.song, kind: "saved" };
        libraryOpen = false;
    }

    async function editSaved(id: string, changes: { song: string; artist: string }) {
        try {
            await editProgression(id, changes);
            savedProgressions = savedProgressions.map((p) =>
                p.id === id ? { ...p, ...changes, artistKey: artistKeyOf(changes.artist) } : p,
            );
        } catch (error: any) {
            pushNotification(error?.message || "Could not update the progression.", "Error", false, 4000, "MIDI library");
            throw error;
        }
    }

    async function deleteSaved(id: string) {
        try {
            await deleteProgression(id);
            savedProgressions = savedProgressions.filter((p) => p.id !== id);
        } catch (error: any) {
            pushNotification(error?.message || "Could not delete the progression.", "Error", false, 4000, "MIDI library");
            throw error;
        }
    }

    // drag a .mid file anywhere onto the page (logged-in only)
    const hasFile = (event: DragEvent) => !!event.dataTransfer?.types.includes("Files");

    function handleDragOver(event: DragEvent) {
        if (!$user || !hasFile(event)) return;
        event.preventDefault();
        draggingFile = true;
    }

    function handleDrop(event: DragEvent) {
        if (!$user || !hasFile(event)) return;
        event.preventDefault();
        draggingFile = false;
        const file = event.dataTransfer?.files[0];
        if (!file) return;
        if (!/\.midi?$/i.test(file.name)) {
            pushNotification("Drop a .mid or .midi file to import it.", "Warning", false, 3500, "MIDI import");
            return;
        }
        importMidi(file);
    }

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

    /*
        Compact ("mobile") bar: once the one-line bar starts to squish (the
        progression name crushed, or the controls running out of room), switch
        to the compact layout (ChordBuilderPage.css). It switches back only when
        there's clearly room again (a little past where it switched), so it
        doesn't flicker at the edge. Below 1180px the CSS is compact anyway.
    */
    const MIN_NAME_W = 200;
    let compact = false;
    let compactBelow = 0; // the bar width it went compact at

    async function checkCompact() {
        if (!headerBar) return;
        const width = headerBar.clientWidth;
        if (compact) {
            if (width <= compactBelow + 40) return;
            compact = false; // try the one-line bar again, then re-check it
            await tick();
        }
        const transport = headerBar.querySelector<HTMLElement>(".chordBuilder_transport");
        const name = headerBar.querySelector<HTMLElement>(".chordBuilder_progressionName");
        const squished =
            (name && name.clientWidth < MIN_NAME_W) ||
            (transport && transport.scrollWidth > transport.clientWidth + 1);
        if (squished && !compact) {
            compact = true;
            compactBelow = width;
        }
    }

    // what's in the bar changes its width: "Inspired by" on login, a longer progression name
    $: $user, progression.length, headerBar && tick().then(checkCompact);

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
            checkCompact();
            onScroll(); // the bar's starting spot can move with the layout: is it stuck?
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

    /**
     * New chords in the current key. With an artist picked, it's a brand-new
     * progression generated from that artist's chords and habits.
     */
    function shuffleChords() {
        shuffleCount++;
        const style = styles.find((s) => s.id === styleId);
        const fresh = style ? generateInStyle(style, keyRoot, bars) : null;
        if (style && fresh) {
            scale = fresh.scale;
            chords = fresh.chords.map(slot);
            basedOn = { label: `new, in the style of ${style.name}`, kind: "generated" };
        } else {
            basedOn = null;
            chords = randomChordsInKey(keyRoot, scale, bars, complexity).map(slot);
        }
        currentSong = null;
        selectedId = null;
    }

    // ---------- shuffle complexity ----------

    /** How rich the next shuffle or dice roll is. The chords on screen don't change. */
    const setComplexity = (value: string) => (complexity = value as Complexity);
    $: complexityHint = COMPLEXITY_OPTIONS.find((o) => o.value === complexity)?.hint ?? "";

    // ---------- "Inspired by" artist styles ----------

    let styleId = "none";
    // the exact song loaded from the picker (`${styleId}:${index}`), if any
    let currentSong: string | null = null;
    // where the current progression came from (shown under the progression):
    // a reference progression, your saved MIDI, an imported file, or generated
    let basedOn: { label: string; kind: "transcription" | "file" | "saved" | "generated" } | null = null;
    // built-in artists plus the user's saved progressions (logged-in only)
    $: styles = withSavedProgressions(savedProgressions);
    $: artistNames = styles.map((s) => s.name);
    $: artistActive = styles.some((s) => s.id === styleId);

    // every song in the picker, in order (each artist's songs, then the next
    // artist), for the previous / next arrows
    $: songList = styles.flatMap((s) => s.songs.map((song, index) => ({ id: s.id, index, artist: s.name, song: song.song })));

    type SongRef = (typeof songList)[number];

    /** Where an arrow goes: one step from the loaded song, wrapping around. */
    function songStep(dir: 1 | -1, list: SongRef[], loaded: string | null, artistId: string) {
        const n = list.length;
        if (!n) return null;

        let at = loaded ? list.findIndex((s) => `${s.id}:${s.index}` === loaded) : -1;
        if (at < 0) {
            // an artist without a song loaded: start from that artist's first song
            // (next = their first song, previous = the song just before it).
            // Nothing picked: next = the very first song, previous = the last.
            const first = list.findIndex((s) => s.id === artistId);
            at = first >= 0 ? (dir === 1 ? first - 1 : first) : dir === 1 ? -1 : 0;
        }
        return list[(((at + dir) % n) + n) % n];
    }

    $: prevSong = songStep(-1, songList, currentSong, styleId);
    $: nextSong = songStep(1, songList, currentSong, styleId);

    function stepSong(dir: 1 | -1) {
        const target = dir === 1 ? nextSong : prevSong;
        if (target) chooseSong(target.id, target.index);
    }

    // hover text naming the song an arrow loads
    const songTitle = (label: string, target: SongRef | null) =>
        target ? `${label}: ${target.artist}, ${target.song}` : "No songs to browse";

    // ---------- dice: shuffle everything ----------

    let diceCount = 0; // bumps the dice icon so it tumbles on every roll

    /**
     * Rolls a whole new starting point: key, scale, BPM and chords. The bar
     * count and the sound are left as they are. With an artist picked, it's a
     * new progression in their style, in a key and tempo they use.
     */
    function shuffleEverything() {
        diceCount++;

        const style = styles.find((s) => s.id === styleId);
        if (style) {
            generateForArtist(style);
        } else {
            basedOn = null;
            const roll = randomProgression(bars, complexity);
            keyRoot = roll.keyRoot;
            scale = roll.scale;
            bpm = 70 + Math.floor(Math.random() * 91); // 70-160
            chords = roll.chords.map(slot);
            currentSong = null;
        }

        selectedId = null;
        shuffleCount++; // the purple shuffle icon spins too: new chords
    }

    /** A new progression in the artist's style, in one of their keys and tempos. */
    function generateForArtist(style: ArtistStyle) {
        const { keyRoot: key, bpm: tempo } = typicalKeyAndTempo(style);
        const fresh = generateInStyle(style, key, bars);
        if (!fresh) return;
        keyRoot = key;
        bpm = tempo;
        scale = fresh.scale;
        chords = fresh.chords.map(slot);
        basedOn = { label: `new, in the style of ${style.name}`, kind: "generated" };
        currentSong = null;
        selectedId = null;
    }

    /** Picking an artist: a brand-new progression in their style. The sound is never changed. */
    function chooseStyle(id: string) {
        styleId = id;
        const style = styles.find((s) => s.id === id);
        if (!style) {
            basedOn = null;
            currentSong = null;
            return;
        }
        generateForArtist(style);
        shuffleCount++; // spin the shuffle icon: it's a fresh progression
    }

    /** Picking one of an artist's songs: load it exactly, in its own key and tempo. */
    function chooseSong(id: string, index: number) {
        const style = styles.find((s) => s.id === id);
        const song = style?.songs[index];
        if (!style || !song) return;

        styleId = id;
        if (song.exact) {
            // saved MIDI keeps its own length
            const lastEnd = Math.max(...song.exact.map((c) => c.start + c.beats));
            bars = BAR_OPTIONS.find((b) => b * BEATS_PER_BAR >= lastEnd) ?? 12;
        }
        keyRoot = song.key;
        scale = song.scale;
        bpm = Math.min(200, Math.max(40, song.bpm));
        chords = buildProgression(song, song.key, bars).map(slot);
        basedOn = { label: song.song, kind: song.savedId ? "saved" : "transcription" };
        currentSong = `${id}:${index}`;
        selectedId = null;
        shuffleCount++;
    }

    function clearStyle() {
        styleId = "none";
        currentSong = null;
        basedOn = null;
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

    // Space plays/pauses wherever focus is, except while typing in a text field
    // (an artist or song name in the MIDI library needs its spaces). It's caught
    // in the capture phase so nothing else sees it, and its keyup is swallowed
    // too, because a focused button "clicks" when Space is released.
    const NOT_TEXT = new Set(["button", "checkbox", "radio", "range", "color", "file", "submit", "reset", "image"]);

    function isTyping(target: EventTarget | null) {
        if (!(target instanceof HTMLElement)) return false;
        if (target.isContentEditable || target instanceof HTMLTextAreaElement) return true;
        return target instanceof HTMLInputElement && !NOT_TEXT.has(target.type);
    }

    function handleSpaceDown(event: KeyboardEvent) {
        if (event.code !== "Space" || isTyping(event.target)) return;
        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat) togglePlay(); // holding Space doesn't flip it on and off
    }

    function handleSpaceUp(event: KeyboardEvent) {
        if (event.code !== "Space" || isTyping(event.target)) return;
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

<Seo
    title="Chord Builder"
    description="Sketch chord progressions, hear them instantly and export them as MIDI."
    image="/Images/Meta/chord-builder.jpg"
    imageAlt="The Chord Builder: four chords, C, G, Am and F, above a piano roll of their notes"
/>

<!-- the drop hint clears if the drag leaves the window or ends anywhere -->
<svelte:window
    on:keydown={handleKeydown}
    on:dragleave={(e) => {
        if (!e.relatedTarget) draggingFile = false;
    }}
    on:dragend={() => (draggingFile = false)}
    on:drop={() => (draggingFile = false)}
/>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
    class="chordBuilder_container"
    class:chordBuilder_dropping={draggingFile}
    class:chordBuilder_compact={compact}
    style="--nav-h: {navHeight}px; --bar-h: {barHeight}px"
    on:dragover={handleDragOver}
    on:dragleave={(e) => {
        if (e.currentTarget === e.target) draggingFile = false;
    }}
    on:drop={handleDrop}
>
    {#if draggingFile}
        <div class="chordBuilder_dropHint" aria-hidden="true">Drop a MIDI file to import its chords</div>
    {/if}
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
                title={`${progression.map((p) => p.degree).join(" – ")} progression in ${keyRoot} ${SCALES[scale].label}: ${progression.map((p) => p.numeral).join(" – ")}${basedOn ? (basedOn.kind === "file" ? ` · imported from ${basedOn.label}` : basedOn.kind === "saved" ? ` · from your MIDI library: ${basedOn.label}` : basedOn.kind === "generated" ? ` · ${basedOn.label}` : ` · based on ${basedOn.label}`) : ""}`}
            >
                <h4>
                    {progression.map((p) => p.degree).join(" – ")}
                    <span>progression</span>
                </h4>
                <p>
                    {#if basedOn}
                        <!-- a transcribed progression: say which song it came from -->
                        <span class="chordBuilder_numerals">from {basedOn.label}</span>
                    {:else}
                        <span class="chordBuilder_numerals">{progression.map((p) => p.numeral).join(" – ")}</span>
                    {/if}
                </p>
            </div>
        {/if}

        <!-- the gray controls, centered between play and shuffle -->
        <div class="chordBuilder_middle" use:dragScroll>
            <!-- artist presets are for logged-in users only -->
            {#if $user}
            <div class="chordBuilder_control">
                <span class="chordBuilder_controlLabel">Inspired by</span>
                <div class="chordBuilder_keyRow">
                    <InspiredPicker
                        {styles}
                        {styleId}
                        {currentSong}
                        onPickArtist={chooseStyle}
                        onPickSong={chooseSong}
                        onClear={clearStyle}
                    />

                    <!-- previous / next song, across every artist in the list -->
                    <div class="chordBuilder_stepper" role="group" aria-label="Browse songs">
                        <button
                            type="button"
                            aria-label="Previous song"
                            title={songTitle("Previous", prevSong)}
                            disabled={!songList.length}
                            on:click={() => stepSong(-1)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M15 6l-6 6 6 6" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            aria-label="Next song"
                            title={songTitle("Next", nextSong)}
                            disabled={!songList.length}
                            on:click={() => stepSong(1)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M9 6l6 6-6 6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            {/if}

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

            <!-- move the key and every chord a semitone down / up -->
            <div class="chordBuilder_control">
                <span class="chordBuilder_controlLabel">Transpose</span>
                <div class="chordBuilder_stepper chordBuilder_transpose" role="group" aria-label="Transpose">
                    <button
                        type="button"
                        aria-label="Transpose down a semitone"
                        title={`Transpose down: ${keyRoot} → ${shiftRoot(keyRoot, -1)}`}
                        on:click={() => transpose(-1)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        aria-label="Transpose up a semitone"
                        title={`Transpose up: ${keyRoot} → ${shiftRoot(keyRoot, 1)}`}
                        on:click={() => transpose(1)}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M6 15l6-6 6 6" />
                        </svg>
                    </button>
                </div>
            </div>

            <div class="chordBuilder_control">
                <span class="chordBuilder_controlLabel">Key</span>
                <div class="chordBuilder_keyRow">
                    <Dropdown
                        ariaLabel="Key root"
                    width="72px"
                        value={keyRoot}
                        options={rootOptions}
                        onChange={setKeyRoot}
                    />
                    <Dropdown
                        ariaLabel="Scale"
                    width="var(--cb-w-scale)"
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

            <!-- the actions: MIDI library / download, shuffle complexity, dice and shuffle (on wide screens
                 at the far right; in the compact bar they swipe along with the rest) -->
            <!-- MIDI library: import, save and manage MIDI progressions (logged-in only) -->
            {#if $user}
                <button
                    type="button"
                    class="chordBuilder_iconToggle chordBuilder_import"
                    aria-label="MIDI library"
                    title="MIDI library: import, save and manage your progressions"
                    disabled={importingMidi}
                    on:click={() => (libraryOpen = true)}
                >
                    {#if importingMidi}
                        <span class="chordBuilder_spinner chordBuilder_spinnerDark" aria-hidden="true"></span>
                    {:else}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H9l2 2.5h7.5A1.5 1.5 0 0 1 20 8v10.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z" />
                            <path d="M12 10v6" />
                            <path d="M9.5 13.5L12 16l2.5-2.5" />
                        </svg>
                    {/if}
                </button>
            {/if}

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

            <!-- shuffle complexity: how rich the shuffle / dice chords are -->
            <div class="chordBuilder_control">
                <span class="chordBuilder_controlLabel">Shuffle complexity</span>
                <Dropdown
                    ariaLabel="Shuffle complexity"
                    width="var(--cb-w-complexity)"
                    value={complexity}
                    options={complexityOptions}
                    onChange={setComplexity}
                    disabled={artistActive}
                    title={artistActive
                        ? "With an artist picked, their style decides the chords"
                        : `Shuffle complexity: ${complexityHint}`}
                />
            </div>

            <!-- dice (amber): shuffles everything: key, scale, BPM and chords -->
            <button
                type="button"
                class="chordBuilder_dice"
                aria-label="Shuffle everything"
                title={styleId === "none"
                    ? "Shuffle everything: key, BPM and chords"
                    : "Shuffle everything in this artist's style: key, BPM and chords"}
                on:click={shuffleEverything}
            >
                {#key diceCount}
                    <svg class="chordBuilder_diceIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true">
                        <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
                        <circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
                        <circle cx="15.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
                        <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
                        <circle cx="8.5" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
                        <circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
                    </svg>
                {/key}
            </button>

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
        </div>
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

{#if libraryOpen && $user}
    <MidiLibrary
        saved={savedProgressions}
        loading={libraryLoading}
        {artistNames}
        pending={pendingImport}
        onImportFile={importMidi}
        onSavePending={savePendingImport}
        onDiscardPending={() => (pendingImport = null)}
        onLoad={loadSaved}
        onEdit={editSaved}
        onDelete={deleteSaved}
        onClose={() => (libraryOpen = false)}
    />
{/if}

<Footer />
