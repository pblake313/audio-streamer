// this middleware makes sure we have a valid access token, if we dont, but have a valid refresh token, we will try and refresh it...

import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, sign, TokenExpiredError, verify } from "jsonwebtoken";

const secureMiddleWare = async (req: Request, res: Response, next: NextFunction) => {

    const authHeader = req.header('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : '';
    

    // we have a token in the header...
    console.log(`🔵 Original Token : ${bearerToken || 'NO TOKEN'}`)
    try {

        // means the token is still valid no need to refresh...
        verify(bearerToken , process.env.ACCESS_SECRET || '');

        console.log(`🟢 Original token still valid! Ok to proceed.`)

        return next()

    } catch (accessTokenError: any){

        if (accessTokenError instanceof TokenExpiredError || accessTokenError?.name === 'JsonWebTokenError' ||  accessTokenError?.message === 'No access token provided'){
            console.log(`🟡 Token expired, or nonexistant. Need to refresh.`)

            try {
                const cookie = req.cookies['refresh_token'] 
                const refreshPayload = verify(cookie, process.env.REFRESH_SECRET || '') as { ip: string };

                const forwarded = req.headers['x-forwarded-for'];
                const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket.remoteAddress;

                const refreshIp = getFirstIP(refreshPayload.ip);
                const currentIp = getFirstIP(ip);

                if (refreshIp !== currentIp) {
                    console.log('RefreshPayload IP: ', refreshIp);
                    console.log('Regular IP ', currentIp);
                    return res.status(401).json({ resourceError: 'User IP does not match the refresh token IP' });
                }

                const newAccessToken = sign({ip: getFirstIP(refreshPayload.ip)}, process.env.ACCESS_SECRET || '', {expiresIn: '30s'})
    
                res.setHeader('x-access-token', newAccessToken);

                console.log(`🟢 Token Refreshed! New AccessToken: ${newAccessToken}`)

                return next()

            } catch (refreshError) {
                if (refreshError instanceof TokenExpiredError) {
                    return res.status(401).json({ resourceError: 'Refresh Token expired', message: 'Refresh Token Has Expired.' });
                }
                if (refreshError instanceof JsonWebTokenError) {
                    return res.status(401).json({ resourceError: 'Invalid Refresh token', message: 'Invalid Refresh Token' });
                }
                return res.status(401).json({ resourceError: 'Server Error', message: 'server Error' });
            }

        }

        // covers bad signatures, malformed tokens, and similar issues.
        if (accessTokenError instanceof JsonWebTokenError) {
            return res.status(401).json({ resourceError: 'Invalid Access Token', message: 'Malfored Token'});
        }

        return res.status(401).json({ resourceError: 'Server Error', message: 'An unknown error has occurred.' });

    }


}

const getFirstIP = (ipString: string | undefined): string | null => {
	if (!ipString) return null;
	return ipString.split(',')[0].trim(); // Grab only the first IP
};


export default secureMiddleWare