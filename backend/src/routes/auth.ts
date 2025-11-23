import { Router } from "express";
import { loginWithPin } from "../controllers/Auth/LoginWithPin";
import { checkBlockStatus } from "../controllers/Auth/CheckBlockStatus";

const router = Router();

// this route is /auth -- all routes here should be publicly accessible.

router.post('/login-with-pin', loginWithPin)

router.get('/logout', async (req, res)=> {
    try {
        res.cookie('refresh_token', '', {maxAge: 0})
        res.status(200).send({message: 'logout successful'})
    } catch {
        res.cookie('refresh_token', '', {maxAge: 0})
        res.status(200).send({message: 'logout successful'})
    }
})


router.get('/check-ip', checkBlockStatus)

export default router;