// src/middleware/secureMiddleWare.ts
import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, JwtPayload, sign, TokenExpiredError, verify } from "jsonwebtoken";
import { getClientIp, normalizeIp } from "../helpers/IpHelpers";
import { AppError } from "../errors/AppError";
import { access } from "fs";


const secureMiddleWare = async (req: Request, res: Response, next: NextFunction) => {

    const authHeader = req.header("Authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : "";


    try {
        // ----------------
        // FIRST | TRY TO ACCESS RESOURCES USING THE EXISTING ACCESS TOKEN, PASSED IN THE REQUEST HEADERS.
        // ----------------

        const payload = verify(bearerToken, process.env.ACCESS_SECRET || "") as JwtPayload & {
            ip?: string;
        };

        // Ensure IP in token matches IP of current request
        const requestIp = getClientIp(req);
        const tokenIp = normalizeIp(payload.ip);


        // invalid token - did not contain ip value...
        if (!tokenIp) throw new AppError(400, "Invalid Bearer Token", {forceLogout: true, details: 'Missing IP Value'})

        // login ip and current ip dont match.
        if (tokenIp !== requestIp) throw new AppError(400, "Invalid Bearer Token", {forceLogout: true, details: 'Login IP and current IP Mismatch'})
        

        // console.log("🟢 Original token still valid! Can Access Resources");

        return next();
    } catch (accessTokenError: any) {

        // console.log('🔵 Error using access token.')

        // standard errors.
        if (accessTokenError instanceof AppError) {
            next(accessTokenError)
            return
        }

        // if the access token is fine, but has expired, OR we dont have an access token (example new window.).
        const shouldAttemptRefresh = !bearerToken || accessTokenError instanceof TokenExpiredError;

        if (shouldAttemptRefresh) {
            // console.log("🟡 Access Token Error : Token expired. Need to refresh token.");

            try {
                // console.log("🟣 Attempting Refresh.");

                const cookie = req.cookies["refresh_token"];

                const refreshPayload = verify(cookie, process.env.REFRESH_SECRET || "") as { ip: string };

                const refreshIp = normalizeIp(refreshPayload.ip);
                const currentIp = getClientIp(req);

                if (!refreshIp || refreshIp !== currentIp) {
                    throw new AppError(400, 'Invalid Refresh Token', {
                        details: "User refresh token IP is missing or does not match their current IP.",
                        forceLogout: true
                    })

                }

                // Issue new access token with same (normalized) IP
                const newAccessToken = sign(
                    { ip: refreshIp },
                    process.env.ACCESS_SECRET || "",
                    { expiresIn: "30s" }
                );

                res.setHeader("x-access-token", newAccessToken);

                // console.log(`🟢🟢🟢🟢🟢 Token Refreshed! New AccessToken: ${newAccessToken} -- Can access resources.`);

                return next();
            } catch (refreshError: any) {

                // console.log('🔴 handling refresh token error...')


                if (refreshError instanceof AppError) {
                    return next(refreshError)
                }


                if (refreshError instanceof JsonWebTokenError) {
                    return next(new AppError(400, refreshError.message || "Malformed JWT Token.", {
                        forceLogout: true,
                        details: 'General JSON Web Token Error - REFRESH TOKEN'
                    }));
                }


                // console.log('🟤 unhandled REFRESH TOKEN error has occurred.', refreshError)

                return next(new AppError(500, refreshError.message || 'An unknown error has occured.', {
                    forceLogout: true,
                    details: 'Default Secure Middleware Refresh Token Error'
                }))

            }
        }

        // if there is an error with the actual access token.
        if (accessTokenError instanceof JsonWebTokenError) {
            return next(new AppError(400, accessTokenError.message || "Malformed JWT Token.", {
                forceLogout: true,
                details: 'General JSON Web Token Error - ACCESS TOKEN'
            }));
        }

        console.log('🔵 unhandled ACCESS TOKEN error has occurred.', accessTokenError)

        // console.error("Access token server error:", accessTokenError);
        next(new AppError(500, accessTokenError.message || 'An unknown error has occured.', {
            forceLogout: true,
            details: 'Default Secure Middleware Access Token Error'
        }))
    }
};




export default secureMiddleWare;
