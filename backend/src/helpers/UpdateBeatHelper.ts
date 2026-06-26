// import * as admin from 'firebase-admin';
// const db = admin.firestore();
// import { getStorage } from 'firebase-admin/storage';

// type BeatUpdateInput = {
//     beatTitle?: string;
//     tagOne?: string | null;
//     tagTwo?: string | null;
//     mood?: string | null;
//     bpm?: number;
//     key?: string;
//     mode?: string;
//     customTag?: string | null;
//     customTagColor?: string | null;
//     futureDestinations?: string[];
//     rating?: Beat['rating'];
//     notepad?: string | null;        
// };

// export async function updateBeat(
//     beatId: string,
//     updates: BeatUpdateInput
// ): Promise<Beat> {
//     try {
//         const beatRef = db.collection('Beats').doc(beatId);

//         const payload: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
//             ...(updates.beatTitle !== undefined && { beatTitle: updates.beatTitle }),
//             ...(updates.tagOne !== undefined && { tagOne: updates.tagOne }),
//             ...(updates.tagTwo !== undefined && { tagTwo: updates.tagTwo }),
//             ...(updates.mood !== undefined && { mood: updates.mood }),
//             ...(updates.bpm !== undefined && { bpm: updates.bpm }),
//             ...(updates.key !== undefined && { key: updates.key }),
//             ...(updates.mode !== undefined && { mode: updates.mode }),
//             ...(updates.customTag !== undefined && { customTag: updates.customTag || "" }),
//             ...(updates.customTagColor !== undefined && {
//                 customTagColor: updates.customTagColor || ""
//             }),
//             ...(updates.futureDestinations !== undefined && {
//                 futureDestinations: updates.futureDestinations || []
//             }),
//             ...(updates.rating !== undefined && { rating: updates.rating }),
//             ...(updates.notepad !== undefined && { notepad: updates.notepad }) 
//         };

//         await beatRef.update(payload); // ← throws if doc doesn't exist

//         const updatedDoc = await beatRef.get();
//         if (!updatedDoc.exists) {
//             throw new Error(`Beat with ID ${beatId} does not exist after update.`);
//         }

//         const updatedBeat = updatedDoc.data() as Beat;
//         updatedBeat.id = updatedDoc.id;

//         const bucket = getStorage().bucket();
//         if (updatedBeat.artworkUrl) {
//             const file = bucket.file(`Beats/${beatId}/Artwork/${beatId}`);
//             const [url] = await file.getSignedUrl({
//                 version: "v4",
//                 action: "read",
//                 expires: Date.now() + 1000 * 60 * 60 * 26
//             });
//             updatedBeat.artworkUrl = url;
//         }

//         return updatedBeat;
//     } catch (error) {
//         throw error;
//     }
// }

