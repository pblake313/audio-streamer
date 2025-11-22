import { Request, Response } from "express";
import { sign, } from 'jsonwebtoken';

export async function loginWithPin(req: Request, res: Response) {


        try {
            const activePIN = process.env.ACTIVE_PIN;
            const pinSubmitted = req.body.pin;
            const forwarded = req.headers['x-forwarded-for'];
            const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket.remoteAddress;


            if (!ip) {
                throw new Error('Missing IP address in header.');
            }

            if (pinSubmitted === activePIN) {
                console.log("🟢 pins match -- create and send a refresh token.");

                // return the refesh token in a cookie.
                const refreshToken = sign({ip}, process.env.REFRESH_SECRET || '', {expiresIn: '30d'}) 
                res.cookie('refresh_token', refreshToken, {
                    httpOnly: true, // this means only the backend can acces the cookies... not the front.
                    secure: true,
                    maxAge: 30 * 24 * 60 * 60 * 1000, // 65 days
                    sameSite: 'none'
                })

                const expirationDate = new Date()
                expirationDate.setDate(expirationDate.getDate() + 21)

                // return the access token in the object.
                const accessToken = sign({ip}, process.env.ACCESS_SECRET || '', {expiresIn: '30s'})
                return res.status(200).send({accessToken: accessToken}) 

            } else {
                console.log("🔴 pin mismatch :(");
            }

            return res.status(200).send({message: 'ok for now.'})

        } catch (err: any) {
            return res.status(500).send({
                error: err.message || 'An unknown error has occurred.',
            });
        }
 

}