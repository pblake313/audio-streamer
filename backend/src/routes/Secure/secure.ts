import { Router } from 'express'
import secureMiddleWare from '../../middlewares/secureMiddleware'

import beats from './Beats/beats'
import { getAuthorizedUser } from '../../controllers/Secure/GetAuthorizedUser'

const router = Router()


// make sure we have a valid access token on all requests using /secure
router.use(secureMiddleWare)


router.get('/test', (req, res, next) =>{
    console.log('SUCCESSFULLY PASSED MIDDLEWARE')
    return res.status(200).send({message: 'ok 4 now.'})
})

// this route is /secure

router.get('/get-authorized-user', getAuthorizedUser)

router.use('/beats', beats) // imports more routes

export default router