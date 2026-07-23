import { Router } from "express";
import multer from "multer";

import { wavToMp3 } from "../../controllers/Secure/Converter/wav-to-mp3";
import { getConvertedFilesByPage } from "../../controllers/Secure/Converter/get-files";
import { downloadConvertedFile } from "../../controllers/Secure/Converter/download-converted-file";

const router = Router();

const storage = multer.memoryStorage();

const wavToMp3Files = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB per WAV file
        files: 20, // Maximum number of files
    },
    fileFilter: (_req, file, callback) => {
        const isWav =
            file.mimetype === "audio/wav" ||
            file.mimetype === "audio/x-wav" ||
            file.originalname.toLowerCase().endsWith(".wav");

        if (!isWav) {
            return callback(
                new multer.MulterError(
                    "LIMIT_UNEXPECTED_FILE",
                    file.originalname
                )
            );
        }

        callback(null, true);
    },
}).array("wavFiles", 20);

// Base route: /secure/converter

router.post("/wav-to-mp3", wavToMp3Files, wavToMp3);

router.get('/get-files/:page', getConvertedFilesByPage)

router.get('/download-converted-file/:fileId', downloadConvertedFile)

export default router;