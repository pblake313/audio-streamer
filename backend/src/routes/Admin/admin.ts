import { Router } from 'express';
import admin from 'firebase-admin';
import { Beat } from '../../Interfaces/beat.interface';
import { getStorage } from 'firebase-admin/storage';
const db = admin.firestore();

const router = Router();

router.post('/delete-beat/:beatId', async (req, res) => {
    const beatId = req.params.beatId;
    try {
      await db.collection('Beats').doc(beatId).delete();
      return res.status(200).json({ message: 'Beat deleted successfully' });
    } catch (error) {
      console.error('Error deleting beat:', error);
      return res.status(500).json({
        formError: 'An error occurred while deleting the beat.',
        errorTitle: 'Server Error'
      });
    }
});

router.get('/get-admin-beat/:beatId', async (req, res) => {
    const beatId = req.params.beatId;

    try {
        const latestBeat = await getAdminBeatById(beatId)

        if (!latestBeat){
            return res.status(400).send({ 
                formError: 'Could not fetch latest beat information. A beat was not found.',
                errorTitle: 'No Beat Found'
            });
        }
        res.status(200).send({adminBeat: latestBeat})
    } catch (error) {

        return res.status(500).send({ 
            formError: 'An error occurred please try again later.',
            errorTitle: 'Internal Server Error'
        });
    }

})

async function getAdminBeatById(beatId: string): Promise<Beat | null> {
    try {
        // Reference the document in the Firestore collection
        const docRef = db.collection('Beats').doc(beatId);
    
        // Fetch the document
        const doc = await docRef.get();
    
        // Check if the document exists
        if (!doc.exists) {
            console.log(`Beat with ID ${beatId} not found.`);
            return null;
        }
    
        // Get the document data
        const data = doc.data() as Beat;
    
        // Optionally, retrieve signed URLs for assets (e.g., artwork, mp3 preview, etc.)
        const bucket = getStorage().bucket();
    
        if (data.artworkUrl) {
            const file = bucket.file(`Beats/${beatId}/Artwork/${beatId}`);
            const [signedUrl] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 1000 * 60 * 10, // 10-minute signed URL
            });
            data.artworkUrl = signedUrl;
        }
    
        if (data.mp3previewUrl) {
            const file = bucket.file(`Beats/${beatId}/MP3Preview/${beatId}`);
            const [signedUrl] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 1000 * 60 * 1, // 1-minute signed URLp
            });
            data.mp3previewUrl = signedUrl;
        }

        return { id: beatId, ...data };
    } catch (error) {
        console.error(`Error fetching beat by ID ${beatId}:`, error);
        return null;
    }
}


export default router;
