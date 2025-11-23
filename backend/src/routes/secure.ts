import {Request, Response, Router} from 'express'
import secureMiddleWare from '../middlewares/secureMiddleware'

const router = Router()

// this route is /secure



//  this uses a "stream token" to authenticate
import stream from './Streaming/stream'
router.use('/stream', stream)



router.use(secureMiddleWare) // make sure we use access token or refresh it if we have a valid refresh token.



router.use('/get-authorized-user', (req: Request, res: Response) =>{
    // if we made it here it means that we have successfully went through the middleware and we have a valid access token....
    return res.status(200).send({message: 'valid access token exists.'})
})

import beats from './Beats/beats'
router.use('/beats', beats)


export default router