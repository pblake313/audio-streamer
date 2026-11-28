import { Router } from 'express'
import secureMiddleWare from '../../middlewares/secureMiddleware'

import beats from './beats'

import converterRoute from './converter'

import midiRoute from './midi'

import statsRoute from './stats'

import { getAuthorizedUser } from '../../controllers/Secure/GetAuthorizedUser'

const router = Router()


// make sure we have a valid access token on all requests using /secure
router.use(secureMiddleWare)

// this route is /secure

router.get('/get-authorized-user', getAuthorizedUser)

router.use('/beats', beats) // imports more routes

router.use('/converter', converterRoute) // imports more routes

router.use('/midi', midiRoute) // chord builder MIDI export

router.use('/stats', statsRoute) // site traffic, for the portal's Traffic page


export default router