import admin from 'firebase-admin';
import sharp from 'sharp';
import type { Server } from 'socket.io';

type UploadBeatParams = {
  file: Express.Multer.File;
  socketId: string;
  beatId: string;
  io: Server;
};


export async function uploadBeatArtwork({
  file,
  socketId,
  beatId,
  io
}: UploadBeatParams): Promise<string> {
  const bucket = admin.storage().bucket();
  const fileName = `Beats/${beatId}/Artwork/${beatId}`;
  io.to(socketId).emit('uploadStarted', 'artwork');

  // convert to webp if image
  let fileBuffer = file.buffer;
  if (file.mimetype.startsWith('image/')) {
    try {
      fileBuffer = await sharp(file.buffer).webp().toBuffer();
    } catch (error) {
      console.error(error);
      throw new Error('Error converting image to WebP format.');
    }
  }

  const fileUpload = bucket.file(fileName);

  return new Promise((resolve, reject) => {
    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype.startsWith('image/')
          ? 'image/webp'
          : file.mimetype,
      },
    });

    blobStream.on('error', (error) => {
      console.error(error);
      return reject({
        message: 'Unable to upload file, something went wrong.',
        fileName: file.originalname,
      });
    });

    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
      io.to(socketId).emit('uploadComplete', 'artwork');
      resolve(publicUrl);
    });

    blobStream.end(fileBuffer);
  });
}

export async function uploadBeatMp3({
  file,
  socketId,
  beatId,
  io
}: UploadBeatParams): Promise<string> {
  const bucket = admin.storage().bucket();
  const fileName = `Beats/${beatId}/MP3Preview/${beatId}`;
  io.to(socketId).emit('uploadStarted', 'mp3');

  const fileBuffer = file.buffer;
  const fileUpload = bucket.file(fileName);

  return new Promise((resolve, reject) => {
    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on('error', (error) => {
      console.error(error);
      return reject({
        message: 'Unable to upload file, something went wrong.',
        fileName: file.originalname,
      });
    });

    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
      io.to(socketId).emit('uploadComplete', 'mp3');
      resolve(publicUrl);
    });

    blobStream.end(fileBuffer);
  });
}
