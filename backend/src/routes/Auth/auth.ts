import { Router } from "express";
import { loginWithPin } from "../../controllers/Auth/LoginWithPin";
import { checkBlockStatus } from "../../controllers/Auth/CheckBlockStatus";
import { logout } from "../../controllers/Auth/Logout";
import { loginLimiter } from "../../middlewares/rateLimiters";

const router = Router();

// this route is /auth -- all routes here should be publicly accessible.

router.post('/login-with-pin', loginLimiter, loginWithPin)

router.get('/logout', logout)

router.get('/check-ip', checkBlockStatus)

export default router;