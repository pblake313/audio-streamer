import { Request, Response } from "express";
import {io} from '../../../server'
import { buildBeatObj } from "../../helpers/FormHelpers/add-beat-helpers";
import { getStorage } from 'firebase-admin/storage';
import admin from 'firebase-admin';
import sharp from 'sharp';
import { Beat } from "../../Interfaces/beat.interface";

const db = admin.firestore();

export async function addBeat(req: Request, res: Response){
      try {

        let socketId = req.headers['x-socket-id'] as string;

        if (!socketId) throw new Error('A socket id header is required to use this endpoint.')

        io.to(socketId).emit('uploadStatus', 'Validating Request');
    
        let beatObj = buildBeatObj(req)

        io.to(socketId).emit('uploadStatus', 'Checking Files');

        const files = req.files as {
            [fieldname: string]: Express.Multer.File[]; 
        };

        // check files
        io.to(socketId).emit('uploadStatus', 'Validating Files');

        const artworkFile = files.artworkFile[0]
        if (!artworkFile){
            throw new Error('An artwork file is required.')
        }
        if (artworkFile.size > 5 * 1024 * 1024) {
            throw new Error('Artwork file is too large. Please upload a file under 5 MB.');
        }

        const mp3File = files.mp3File[0]
        if (!mp3File){
            throw new Error('An MP3 file is required.')
        }
        if (mp3File.size > 10 * 1024 * 1024) {
            throw new Error('MP3 file is too large. Please upload a file under 10 MB.');
        }
        
        // upload files
        io.to(socketId).emit('uploadStatus', 'Uploading Artwork');
        const artworkUrl = await uploadBeatArtwork(artworkFile, socketId, beatObj.id); 

        io.to(socketId).emit('uploadStatus', 'Uploading MP3');
        const mp3Url = await uploadBeatMp3(mp3File, socketId, beatObj.id)
        

        io.to(socketId).emit('uploadStatus', 'Creating beat');

        const newBeat = await createBeat(beatObj, artworkUrl, mp3Url);

        return res.status(200).send({newBeat: newBeat});
    } catch (error) {
        console.log(error)
        return res.status(500).send({
            error: (error as Error).message || 'An unknown error has occurred.',
        });
    }

}

const uploadBeatArtwork = async (file: Express.Multer.File, socketId: string, beatId: string): Promise<string> => {
    const bucket = admin.storage().bucket();
    let fileName = `Beats/${beatId}/Artwork/${beatId}`;
    io.to(socketId).emit('uploadStarted', 'artwork');

    // Check if the file is an image and convert to WebP
    let fileBuffer = file.buffer;
    if (file.mimetype.startsWith('image/')) {
        try {
        fileBuffer = await sharp(file.buffer).webp().toBuffer();
        } catch (error) {
            console.log(error)
        throw new Error('Error converting image to WebP format.');
        }
    }

    const fileUpload = bucket.file(fileName);

    return new Promise((resolve, reject) => {
        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype.startsWith('image/') ? 'image/webp' : file.mimetype, // Set content type based on the file type
            },
        });

        blobStream.on('error', (error) => {
            console.log(error)
            return reject({ message: 'Unable to upload file, something went wrong.', fileName: file.originalname });
        });

        blobStream.on('finish', () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
            io.to(socketId).emit('uploadComplete', 'artwork')

            resolve(publicUrl);
        });

        blobStream.end(fileBuffer);
    });
};
const uploadBeatMp3 = async (file: Express.Multer.File, socketId: string, beatId: string): Promise<string> => {
  const bucket = admin.storage().bucket();
  let fileName = `Beats/${beatId}/MP3Preview/${beatId}`;
  io.to(socketId).emit('uploadStarted', 'mp3');

  // Check if the file is an image and convert to WebP
  let fileBuffer = file.buffer;

  const fileUpload = bucket.file(fileName);

  return new Promise((resolve, reject) => {
    const blobStream = fileUpload.createWriteStream({
        metadata: {
            contentType: file.mimetype, // Set the content type of the uploaded file
        },
    });

    blobStream.on('error', (error) => {
        console.log(error)
        return reject({ message: 'Unable to upload file, something went wrong.', fileName: file.originalname });
    });

    blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
        io.to(socketId).emit('uploadComplete', 'mp3')

        resolve(publicUrl);
    });

    blobStream.end(fileBuffer);
  });
};

async function createBeat(obj: any, artworkUrl: string, mp3Url: string,) {
    const beat: Beat = {
        key: obj.key,
        mode: obj.mode,
        beatTitle: obj.beatTitle,
        mp3previewUrl: mp3Url,
        artworkUrl: artworkUrl,
        bpm: +obj.bpm,
        mood: obj.mood,
        tagOne: obj.tagOne,
        id: obj.id,
        tagTwo: obj.tagTwo,
        uploadDate: new Date(),
        rating: 0,
        notepad: null,
        customTag: obj.customTag,
        customTagColor: obj.customTagColor,
        futureDestinations: obj.futureDestinations
    };


  try {
    const docPath = `/Beats/${beat.id}`;
    const docRef = db.doc(docPath); // Define the document reference with the path
    await docRef.set(beat); // Create the document

    if (artworkUrl) {
        const bucket = getStorage().bucket();
        const file = bucket.file(`Beats/${beat.id}/Artwork/${beat.id}`);
        const [url] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60 * 48 // 48 hours
        });
        beat.artworkUrl = url;
    }

    return beat;
  } catch (error) {
    throw new Error('An error uploading beat occurred.');
  }
}
