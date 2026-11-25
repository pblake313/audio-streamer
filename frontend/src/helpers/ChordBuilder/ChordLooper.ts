// Synthesized chord loop built on the Web Audio API.
// Uses a look-ahead scheduler so timing stays tight even if the main thread is busy.

import {
    BEATS_PER_BAR,
    effectiveNotes,
    midiToFrequency,
    type Chord,
} from "./chords";
import { INSTRUMENTS, type InstrumentId, type Patch } from "./instruments";

type LooperOptions = {
    // fires on every beat with the playhead position in the loop
    onBeat?: (position: number) => void;
};

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.12;

export class ChordLooper {
    bpm = 120;
    totalBeats = 8;
    chords: Chord[] = [];
    metronome = false;
    instrument: InstrumentId = "feltPiano";

    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private timer: ReturnType<typeof setInterval> | null = null;
    private rafId: number | null = null;

    private position = 0;
    private nextBeatTime = 0;

    // scheduled UI events, fired when the audio clock reaches them
    private uiQueue: { time: number; position: number }[] = [];
    private activeVoices = new Set<{ stop: (at: number) => void }>();

    constructor(private options: LooperOptions = {}) {}

    get playing() {
        return this.timer !== null;
    }

    /** Plays one note on its own, e.g. while dragging it in the piano roll. */
    async previewNote(midi: number) {
        await this.ensureContext();

        this.playNote(midi, this.ctx!.currentTime + 0.01, 0.35);
    }

    /** Plays a whole chord once, e.g. to audition a suggestion. */
    async previewChord(notes: number[]) {
        await this.ensureContext();

        const { strum } = INSTRUMENTS[this.instrument];
        const time = this.ctx!.currentTime + 0.01;
        [...notes]
            .sort((a, b) => a - b)
            .forEach((midi, i) => this.playNote(midi, time + i * strum, 1.4));
    }

    private async ensureContext() {
        if (!this.ctx) {
            this.ctx = new AudioContext();
            this.master = this.ctx.createGain();
            this.master.gain.value = 1; // full volume

            // gentle compression so stacked notes don't clip
            const compressor = this.ctx.createDynamicsCompressor();
            compressor.threshold.value = -14;
            compressor.ratio.value = 4;

            this.master.connect(compressor);
            compressor.connect(this.ctx.destination);
        }

        if (this.ctx.state !== "running") {
            // resume() stays pending forever if the browser blocks audio,
            // so don't let it hang the play button
            await Promise.race([
                this.ctx.resume(),
                new Promise((resolve) => setTimeout(resolve, 500)),
            ]);
        }
    }

    async start() {
        if (this.playing) return;

        await this.ensureContext();
        if (!this.ctx) return;

        if (this.ctx.state !== "running") {
            console.warn("[ChordLooper] audio context state:", this.ctx.state);
            throw new Error(`Audio is ${this.ctx.state}`);
        }

        this.position = 0;
        this.nextBeatTime = this.ctx.currentTime + 0.06;
        this.uiQueue = [];

        this.timer = setInterval(() => this.schedule(), LOOKAHEAD_MS);
        this.schedule();
        this.rafId = requestAnimationFrame(this.drawUi);
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;

        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = null;

        this.uiQueue = [];

        if (this.ctx) {
            const now = this.ctx.currentTime;
            this.activeVoices.forEach((voice) => voice.stop(now));
        }
        this.activeVoices.clear();
    }

    destroy() {
        this.stop();
        this.ctx?.close();
        this.ctx = null;
    }

    private get secondsPerBeat() {
        return 60 / this.bpm;
    }

    private schedule() {
        if (!this.ctx) return;

        while (this.nextBeatTime < this.ctx.currentTime + SCHEDULE_AHEAD_S) {
            // the loop may have been shortened while playing
            if (this.position >= this.totalBeats) this.position = 0;

            const time = this.nextBeatTime;
            const position = this.position;

            const chord = this.chords.find((c) => c.start === position);
            if (chord) {
                // clip chords that run past the end of the loop;
                // length is read now, so BPM changes apply on the next chord
                const beats = Math.min(chord.beats, this.totalBeats - position);
                this.playChord(chord, time, beats * this.secondsPerBeat);
            }

            if (this.metronome) {
                this.playClick(time, position % BEATS_PER_BAR === 0);
            }

            this.uiQueue.push({ time, position });

            this.nextBeatTime += this.secondsPerBeat;
            this.position = (position + 1) % this.totalBeats;
        }
    }

    private drawUi = () => {
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        while (this.uiQueue.length && this.uiQueue[0].time <= now) {
            this.options.onBeat?.(this.uiQueue.shift()!.position);
        }

        this.rafId = requestAnimationFrame(this.drawUi);
    };

    // ---------- sound design ----------

    private playChord(chord: Chord, time: number, duration: number) {
        const { strum } = INSTRUMENTS[this.instrument];

        effectiveNotes(chord).forEach((note, i) => {
            // small strum so the chord feels played, not stamped
            this.playNote(note, time + i * strum, duration);
        });
    }

    /** One note on the current instrument, from the lowest key to the highest. */
    private playNote(midi: number, time: number, duration: number) {
        const ctx = this.ctx!;
        const patch: Patch = INSTRUMENTS[this.instrument];
        const frequency = midiToFrequency(midi);

        // low notes sound quieter to the ear at the same level, so lift them a
        // little (up to ~1.8x at C1, none from C4 up)
        const loudness = 1 + Math.max(0, Math.min(1, (60 - midi) / 36)) * 0.8;

        const voiceGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.Q.value = patch.filter.q ?? 0.5;
        filter.connect(voiceGain);
        voiceGain.connect(this.master!);

        const sources: OscillatorNode[] = [];

        const oscillators = patch.oscillators.map(({ type, detune = 0, ratio = 1, level }) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = type;
            osc.frequency.value = frequency * ratio;
            osc.detune.value = detune;
            g.gain.value = level;
            osc.connect(g);
            g.connect(filter);
            sources.push(osc);
            return osc;
        });

        // FM: a sine modulator wobbling the oscillators' pitch gives the
        // electric-piano "tine" bark, fading fast after the hit
        if (patch.fm) {
            const mod = ctx.createOscillator();
            const modGain = ctx.createGain();
            mod.frequency.value = frequency * patch.fm.ratio;
            const depth = frequency * patch.fm.index;
            modGain.gain.setValueAtTime(depth, time);
            modGain.gain.setTargetAtTime(depth * 0.08, time, patch.fm.decay);
            mod.connect(modGain);
            oscillators.forEach((osc) => modGain.connect(osc.frequency));
            sources.push(mod);
        }

        // vibrato / slow drift
        if (patch.vibrato) {
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.value = patch.vibrato.rate;
            lfoGain.gain.value = patch.vibrato.depth;
            lfo.connect(lfoGain);
            oscillators.forEach((osc) => lfoGain.connect(osc.detune));
            sources.push(lfo);
        }

        const { attack, release } = patch.amp;
        const peak = patch.amp.peak * loudness;
        const sustain = patch.amp.sustain * loudness;
        // struck strings ring longer down low (about 2x at C2, 0.5x at C6)
        const decay = patch.amp.keyTrack
            ? patch.amp.decay * Math.pow(2, (60 - midi) / 24)
            : patch.amp.decay;
        const holdEnd = Math.max(time + attack, time + duration - 0.02);

        const gain = voiceGain.gain;
        gain.setValueAtTime(0, time);
        gain.linearRampToValueAtTime(peak, time + attack);
        gain.setTargetAtTime(sustain, time + attack, decay);
        // release starts from wherever the decay has reached by then
        gain.setTargetAtTime(0, holdEnd, release / 4);

        filter.frequency.setValueAtTime(patch.filter.from, time);
        filter.frequency.setTargetAtTime(patch.filter.to, time, patch.filter.time);

        this.runVoice(sources, voiceGain, time, holdEnd + release + 0.05);
    }

    private playClick(time: number, accent: boolean) {
        const ctx = this.ctx!;

        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = accent ? 1600 : 1100;
        osc.connect(g);
        g.connect(this.master!);

        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(accent ? 0.12 : 0.07, time + 0.001);
        g.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

        this.runVoice([osc], g, time, time + 0.05);
    }

    private runVoice(
        oscillators: OscillatorNode[],
        output: GainNode,
        start: number,
        end: number,
    ) {
        const voice = {
            stop: (at: number) => {
                // quick fade avoids a click when stopping mid-note
                output.gain.cancelScheduledValues(at);
                output.gain.setTargetAtTime(0, at, 0.015);
                oscillators.forEach((osc) => {
                    try {
                        osc.stop(at + 0.1);
                    } catch {
                        /* already stopped */
                    }
                });
            },
        };

        oscillators.forEach((osc) => {
            osc.start(start);
            osc.stop(end);
        });

        oscillators[0].onended = () => {
            output.disconnect();
            this.activeVoices.delete(voice);
        };

        this.activeVoices.add(voice);
    }
}
