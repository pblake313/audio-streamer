// src/middleware/secureMiddleWare.ts
import { NextFunction, Request, Response } from "express";
import {JsonWebTokenError, JwtPayload, sign, TokenExpiredError, verify} from "jsonwebtoken";
import { getClientIp, normalizeIp } from "../helpers/IpHelpers";
import { ForceLogoutError } from "../errors/ForceLogoutError";


const secureMiddleWare = async (req: Request, res: Response, next: NextFunction) => {
	const authHeader = req.header("Authorization");
	const bearerToken = authHeader?.startsWith("Bearer ")
		? authHeader.split(" ")[1]
		: "";


    const issueStreamToken = (ip: string | undefined | null) => {
        const normalizedIp = normalizeIp(ip);

        if (!normalizedIp || !process.env.STREAM_SECRET) {
            console.log("🔴 Skipping stream token issue (missing IP or STREAM_SECRET)");
            return;
        }
        const streamToken = sign(
            { ip: normalizedIp },
            process.env.STREAM_SECRET,
            { expiresIn: "10s" }
        );

        res.setHeader("x-stream-token", streamToken);
    };


    // console.log('----------------------------------------')

	// console.log(`🔵 Original Token : ${bearerToken || "NO TOKEN"}`);

	try {
		// 1️⃣ Try to validate existing access token
		const payload = verify(bearerToken, process.env.ACCESS_SECRET || "") as JwtPayload & {
			ip?: string;
		};

		// Ensure IP in token matches IP of current request
		const requestIp = getClientIp(req);
		const tokenIp = normalizeIp(payload.ip);

		if (!tokenIp) {
            throw new ForceLogoutError('Invalid Token - Token did not contain ip value.')
		}

		if (tokenIp !== requestIp) {
            throw new ForceLogoutError('IP address mismatch detected.')
		}

        issueStreamToken(tokenIp)
		// console.log("🟢 Original token still valid! Can Access Resources");

		return next();
	} catch (accessTokenError: any) {

        // IF WE THROW A FORCELOGOUT ERROR
		if (accessTokenError instanceof ForceLogoutError) {
			return res.status(440).json({
				forceLogout: true,
				message: accessTokenError.message || "An unknown error occurred."
			});
		}

        // IF THERRE IS AN ERROR WITH OUR ACCESS TOKEN
		if (
			accessTokenError instanceof TokenExpiredError ||
			accessTokenError?.name === "JsonWebTokenError" ||
			accessTokenError?.message === "No access token provided"
		) {
			// console.log("🟡 Access Token Error : Token expired, or nonexistent. Need to refresh.");

			try {
			    // console.log("🟣 Attempting Refresh.");

				const cookie = req.cookies["refresh_token"];

				const refreshPayload = verify(cookie, process.env.REFRESH_SECRET || "") as { ip: string };

				const refreshIp = normalizeIp(refreshPayload.ip);
				const currentIp = getClientIp(req);

				// console.log("RefreshPayload IP:", refreshIp);
				// console.log("Current Req IP:", currentIp);

				if (!refreshIp || refreshIp !== currentIp) {
					throw new ForceLogoutError("Refresh token IP mismatch");
				}

				// Issue new access token with same (normalized) IP
				const newAccessToken = sign(
					{ ip: refreshIp },
					process.env.ACCESS_SECRET || "",
					{ expiresIn: "30s" }
				);

				res.setHeader("x-access-token", newAccessToken);

				// console.log(`🟢 Token Refreshed! New AccessToken: ${newAccessToken} -- Can access resources.`);
                issueStreamToken(refreshIp)

				return next();
			} catch (refreshError: any) {
				// 4️⃣ ForceLogout during refresh
				if (refreshError instanceof ForceLogoutError) {
					console.log("🔴 ForceLogoutError (refresh):", refreshError.message);
					return res.status(440).json({
						forceLogout: true,
						message: refreshError.message || "Force logout required"
					});
				}

				if (refreshError instanceof TokenExpiredError) {
					return res.status(401).json({
						resourceError: "Refresh Token expired",
						message: "Refresh Token Has Expired."
					});
				}

				if (refreshError instanceof JsonWebTokenError) {
					return res.status(401).json({
						resourceError: "Invalid Refresh token",
						message: "Invalid Refresh Token"
					});
				}

				// console.error("Refresh token server error:", refreshError);
				return res.status(401).json({
					resourceError: "Server Error",
					message: "Server Error"
				});
			}
		}

		// 5️⃣ Invalid access token (bad signature, malformed, etc.) but not expired
		if (accessTokenError instanceof JsonWebTokenError) {
			return res.status(401).json({
				resourceError: "Invalid Access Token",
				message: "Malformed Token"
			});
		}

		// console.error("Access token server error:", accessTokenError);
		return res.status(401).json({
			resourceError: "Server Error",
			message: "An unknown error has occurred."
		});
	}
};




export default secureMiddleWare;
