import { Router } from 'express';
import resourceMiddleware from '../middlewares/resourceMiddleware';

const router = Router()


// streaming beats
import stream from '../routes/Streaming/stream'
router.use('/stream', stream)




// used to get the beats that the admin would use...
import admin from '../routes/Admin/admin'
router.use('/admin', admin)

export default router