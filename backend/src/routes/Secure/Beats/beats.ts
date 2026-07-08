import { Router } from "express";
import { addBeat } from "../../../controllers/Secure/Beats/AddBeat";
import multer from 'multer';
import { editBeat } from "../../../controllers/Secure/Beats/EditBeat";
import { updateNotepad } from "../../../controllers/Secure/Beats/UpdateNotepad";
import { deleteBeat } from "../../../controllers/Secure/Beats/DeleteBeat";
import { getSingleBeat } from "../../../controllers/Secure/Beats/GetSingleBeat";
import { getLiveBeatsByPage } from "../../../controllers/Secure/Beats/GetLiveBeatsByPage";
import { toggleBeatDestination } from "../../../controllers/Secure/Beats/ToggleDestination";
import { updateBeatRating } from "../../../controllers/Secure/Beats/UpdateRating";
import { markBeatAsTrash } from "../../../controllers/Secure/Beats/MarkTrash";
const router = Router()

const storage = multer.memoryStorage();


// declare files we may receive
const addBeatFiles = multer({ storage }).fields([
  { name: 'artworkFile', maxCount: 1 },
  { name: 'mp3File', maxCount: 1 },
]);
const editBeatFiles = multer({ storage }).fields([
    { name: 'newArtwork', maxCount: 1 },
    { name: 'newMp3File', maxCount: 1},
])


// this route is /secure/beats
 
router.post('/add-beat', addBeatFiles, addBeat)

router.post('/toggle-destination/:beatId', toggleBeatDestination)

router.post('/update-beat/:beatId', editBeatFiles, editBeat);

router.post('/update-rating/:beatId', updateBeatRating)

router.get('/mark-trash/:beatId', markBeatAsTrash)

router.post('/update-notepad/:beatId', updateNotepad)

router.get('/delete-beat/:beatId', deleteBeat);

router.get('/get-beat/:beatId', getSingleBeat)
 
router.get('/get-live-beats/:page', getLiveBeatsByPage);  


export default router