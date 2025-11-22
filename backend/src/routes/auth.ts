import { Router } from "express";
import { loginWithPin } from "../controllers/Auth/LoginWithPin";

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

export default router;