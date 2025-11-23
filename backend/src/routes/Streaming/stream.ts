import { Router } from 'express';
import admin from 'firebase-admin';
import { verify, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

const router = Router();

// Handle preflight OPTIONS requests
router.options('/stream-beat/:beatId', (req, res) => {
    const allowedOrigin = process.env.FRONTEND_URL || '';
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
    res.status(200).send();
});

router.get('/stream-beat/:beatId', async (req, res) => {
    const beatId = req.params.beatId;

    const streamToken = req.query.stream

    if (!streamToken) {
        return res.status(401).json({ error: '!streamToken – missing stream token' });
    }

    // verify stream token.... stream token only lasts 1 minute, and because this is a streaming url, it cannot throw detailed errors...
    try {
        verify(streamToken as string, process.env.STREAM_SECRET!);
        
    } catch (err) {
        return res.status(500).json({ error: 'Token verification failed' });
    }

    // Set CORS headers
    const origin = req.headers.origin || '';
    const allowedOrigin = process.env.FRONTEND_URL || ''; // frontend origin

    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');

    // Block direct access if request does not come from the allowed origin
    const referer = req.headers.referer || '';
    if (!referer.startsWith(allowedOrigin) && !origin.startsWith(allowedOrigin)) {
        return res.status(403).send('Direct access blocked');
    }

    try {
        const bucket = admin.storage().bucket();
        const file = bucket.file(`Beats/${beatId}/MP3Preview/${beatId}`);

        const [exists] = await file.exists();
        if (!exists) return res.status(404).send('File not found');

        const [metadata] = await file.getMetadata();
        const fileSize = Number(metadata.size);
        const range = req.headers.range;

        if (range) {
            const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
            const start = parseInt(startStr, 10);
            const end = endStr ? parseInt(endStr, 10) : fileSize - 1;

            if (start >= fileSize || end >= fileSize) {
                return res.status(416).send('Requested range not satisfiable');
            }

            const chunkSize = end - start + 1;
            const stream = file.createReadStream({ start, end });

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': 'inline',
                'Cache-Control': 'no-store',
                'Cross-Origin-Resource-Policy': 'cross-origin',
            });

            return stream.pipe(res);
        } else {
            // Full file fallback
            res.writeHead(200, {
                'Content-Type': 'audio/mpeg',
                'Content-Length': fileSize,
                'Accept-Ranges': 'bytes',
                'Content-Disposition': 'inline',
                'Cache-Control': 'no-store',
                'Cross-Origin-Resource-Policy': 'cross-origin',
            });

            return file.createReadStream().pipe(res);
        }
    } catch (err) {
        console.error('Streaming error:', err);
        return res.status(500).send('Error streaming file');
    }
});

export default router;
