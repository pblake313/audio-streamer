import { Router } from 'express'
import secureMiddleWare from '../../middlewares/secureMiddleware'

import stream from './Stream/stream'
import beats from './Beats/beats'
import { getAuthorizedUser } from '../../controllers/Secure/GetAuthorizedUser'

const router = Router()


//  this uses a "stream token" to authenticate so no need for the middleware
router.use('/stream', stream)


// make sure we have a valid access token on all requests using /secure
router.use(secureMiddleWare)


// this route is /secure

router.get('/get-authorized-user', getAuthorizedUser)

router.use('/beats', beats) // imports more routes

export default router