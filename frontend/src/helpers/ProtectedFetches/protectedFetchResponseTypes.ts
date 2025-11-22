import type { Beat } from "../../lib/types/Beats";

export type FetchBeatsResponse = {
	beats: Beat[];
	fullBatch: boolean;
};

export type FetchLiveBeatResponse = {
	beat: Beat
}

export type AddBeatResponse = {
	error: string,
	newBeat:Beat
}

export type NewBeatRatingResponse = {
	beat: Beat,
	error: string,
}
export type NotepadUpdateResponse = {
	beat: Beat,
	error: string,
}