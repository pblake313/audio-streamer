import admin from 'firebase-admin';
import sharp from 'sharp';
import type { Server } from 'socket.io';

type UploadBeatParams = {
  file: Express.Multer.File;
  beatId: string;
};


export async function uploadBeatArtwork({
  file,
  beatId,
}: UploadBeatParams): Promise<string> {
  const bucket = admin.storage().bucket();
  const fileName = `Beats/${beatId}/Artwork/${beatId}`;

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
      return reject({
        message: 'Unable to upload file, something went wrong.',
        fileName: file.originalname,
      });
    });

    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
      resolve(publicUrl);
    });

    blobStream.end(fileBuffer);
  });
}

export async function uploadBeatMp3({
  file,
  beatId,
}: UploadBeatParams): Promise<string> {
  const bucket = admin.storage().bucket();
  const fileName = `Beats/${beatId}/MP3Preview/${beatId}`;

  const fileBuffer = file.buffer;
  const fileUpload = bucket.file(fileName);

  return new Promise((resolve, reject) => {
    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on('error', (error) => {
      return reject({
        message: 'Unable to upload file, something went wrong.',
        fileName: file.originalname,
      });
    });

    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
      resolve(publicUrl);
    });

    blobStream.end(fileBuffer);
  });
}
