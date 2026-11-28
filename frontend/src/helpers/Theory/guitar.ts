// guitar neck data shared by the Fretboard component and the pentatonic positions

export const FRETS = 15;

// standard tuning, high e down to low E (the order tab draws them), as MIDI
export const STRINGS = [
    { name: "e", midi: 64 },
    { name: "B", midi: 59 },
    { name: "G", midi: 55 },
    { name: "D", midi: 50 },
    { name: "A", midi: 45 },
    { name: "E", midi: 40 },
];

/** id of one spot on the neck; `string` indexes STRINGS (0 = high e) */
export const cellId = (string: number, fret: number) => `${string}-${fret}`;

export type NeckHighlight = {
    cells: Set<string>;
    /** fret ranges (inclusive) the box covers, to shade behind it */
    spans: [number, number][];
};

/**
 * A scale's positions ("boxes") on the neck, one per note. Position n starts
 * on the scale's nth note on the low E string and climbs a fixed number of
 * notes per string: two for a pentatonic, which gives the familiar boxes,
 * B-string shift included (A minor: position 1 is frets 5-8, position 2 frets
 * 7-10, ...), and three for a seven-note scale (the 3-notes-per-string shapes).
 * Each box is also repeated an octave up or down when that copy fits.
 *
 * `pcs` are the pitch classes the boxes are built from, root first.
 * `extraPcs` (the blues' blue notes) are added wherever they fall inside a box.
 */
export function scalePositions(pcs: number[], extraPcs: number[] = []): NeckHighlight[] {
    const inScale = new Set(pcs);
    const extras = new Set(extraPcs);
    const perString = pcs.length <= 5 ? 2 : 3;
    const nextUp = (midi: number) => {
        let m = midi + 1;
        while (!inScale.has(m % 12)) m++;
        return m;
    };

    const low = STRINGS.length - 1; // the low E, last in STRINGS

    return pcs.map((pc) => {
        // lowest fret of this note on the low E
        let midi = STRINGS[low].midi + ((pc - STRINGS[low].midi) % 12 + 12) % 12;

        // `perString` notes on each string, low E up to high e
        let box: [number, number][] = [];
        for (let s = low; s >= 0; s--) {
            for (let n = 0; n < perString; n++) {
                box.push([s, midi - STRINGS[s].midi]);
                midi = nextUp(midi);
            }
        }

        const frets = () => box.map(([, f]) => f);
        // keep the box on the neck: lift it an octave if it dips below the nut,
        // drop it one if it runs off the end and there's room lower down
        if (Math.min(...frets()) < 0) box = box.map(([s, f]) => [s, f + 12]);
        if (Math.max(...frets()) > FRETS && Math.min(...frets()) >= 12) box = box.map(([s, f]) => [s, f - 12]);

        const min = Math.min(...frets());
        const max = Math.max(...frets());
        const copies = [0];
        if (max + 12 <= FRETS) copies.push(12);
        if (min - 12 >= 0) copies.push(-12);

        const cells = new Set<string>();
        const spans: [number, number][] = [];
        for (const shift of copies) {
            for (const [s, f] of box) cells.add(cellId(s, f + shift));
            spans.push([min + shift, max + shift]);

            // extra notes on each string within a fret of that string's own box
            // notes, but never outside the box (A minor blues, position 1: the
            // E♭s at A-string 6 and G-string 8)
            if (extras.size) {
                for (let s = 0; s < STRINGS.length; s++) {
                    const own = box.filter(([bs]) => bs === s).map(([, f]) => f + shift);
                    const from = Math.max(Math.min(...own) - 1, min + shift);
                    const to = Math.min(Math.max(...own) + 1, max + shift);
                    for (let f = from; f <= to; f++) {
                        if (extras.has((STRINGS[s].midi + f) % 12)) cells.add(cellId(s, f));
                    }
                }
            }
        }
        return { cells, spans };
    });
}
