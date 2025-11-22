import { Request, Response, NextFunction } from 'express';
import { JsonWebTokenError, sign, TokenExpiredError, verify } from 'jsonwebtoken';

const resourceMiddleware = async (req: Request, res: Response, next: NextFunction) => {

    const authHeader = req.header('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    
    if (!bearerToken || bearerToken === 'null' || bearerToken === 'undefined') {
        return res.status(401).json({ resourceError: 'Missing or malformed Bearer Token' });
    }
    
    try {

        // if the access token is not successfully verified it will fall under one of the two errors in the catch block.
        verify(bearerToken, process.env.ACCESS_SECRET || '');

        return next();

    } catch (accessTokenError) {

        // handles expired tokens separately. --- CHECK BEFORE jsonwebtokenerror ----
        if (accessTokenError instanceof TokenExpiredError) {
            // console.log('access token expired!')
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

                return next()

            } catch (refreshError) {

                if (refreshError instanceof TokenExpiredError) {
                    return res.status(401).json({ resourceError: 'Refresh Token expired' });
                }
                if (refreshError instanceof JsonWebTokenError) {
                    return res.status(401).json({ resourceError: 'Invalid Refresh token' });
                }
                return res.status(401).json({ resourceError: 'Server Error' });
            }


        }

        // covers bad signatures, malformed tokens, and similar issues.
        if (accessTokenError instanceof JsonWebTokenError) {
            return res.status(401).json({ resourceError: 'Invalid Access Token' });
        }

        return res.status(401).json({ resourceError: 'Server Error' });
    }
}

const getFirstIP = (ipString: string | undefined): string | null => {
	if (!ipString) return null;
	return ipString.split(',')[0].trim(); // Grab only the first IP
};

export default resourceMiddleware;
