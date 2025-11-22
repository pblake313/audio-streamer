import { Router } from "express";
import { getBeatById, getLiveBeats } from "../../helpers/beats";
import { signFirestoreUrl } from "../../helpers/signUrls";
import { addBeat } from "./add-beat";
import multer from 'multer';
import { editBeat } from "./edit-beats";
import { updateBeatRating } from "./update-rating";
import { updateNotepad } from "./update-notepade";
import { deleteBeat } from "./delete-beat";
const router = Router()

const storage = multer.memoryStorage();


// this route is /secure/beats

// declare files we may receive
const addBeatFiles = multer({ storage }).fields([
  { name: 'artworkFile', maxCount: 1 },
  { name: 'mp3File', maxCount: 1 },
]);
router.post('/add-beat', addBeatFiles, addBeat)



const editBeatFiles = multer({ storage: storage}).fields([
    { name: 'newArtwork', maxCount: 1 },
    { name: 'newMp3File', maxCount: 1},
])
router.post('/update-beat/:beatId', editBeatFiles, editBeat);

router.post('/update-rating/:beatId', updateBeatRating)

router.post('/update-notepad/:beatId', updateNotepad)

router.get('/delete-beat/:beatId', deleteBeat);


router.get('/get-beat/:beatId', async (req, res) => {
    const beatId = req.params.beatId

    try {
        const fetchedBeat = await getBeatById(beatId)

        if (fetchedBeat){
            fetchedBeat.artworkUrl = await signFirestoreUrl(fetchedBeat.artworkUrl, 0, 45)
        }

        return res.status(200).send({message: 'ok 4 now', beat: fetchedBeat})
    } catch {
        return res.status(500).send({ error: 'An error occurred while getting the beat.' });
    }
})

router.get('/get-live-beats/:page', async (req, res) => {
    try {

        const page = parseInt(req.params.page, 10); // Parse the page parameter as an integer

        if (isNaN(page) || page <= 0) {
            // If it's not a valid positive number, return an error response
            throw new Error('Invalid page number parameter. It must be a positive number.')
        }
    
        const beatResults = await getLiveBeats(page);
        return res.status(200).send({ beats: beatResults.beats, fullBatch: beatResults.hasFullBatch });
    } catch (error: any) {
        console.error('Error occurred while getting live beats:', error);
        return res.status(500).send({ error: 'An error occurred while getting live beats', message: error.message || 'An unknwon error has occurred.' });
    }  
});  


export default router