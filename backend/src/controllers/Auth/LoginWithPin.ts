// src/routes/auth/loginWithPin.ts
import { Request, Response } from "express";
import { sign } from "jsonwebtoken";
import { getClientIp } from "../../helpers/ip";

export async function loginWithPin(req: Request, res: Response) {
	try {
		const activePIN = process.env.ACTIVE_PIN;
		const pinSubmitted = req.body.pin;

		const ip = getClientIp(req);

		if (!ip) {
			throw new Error("Missing IP address in header.");
		}

		if (pinSubmitted === activePIN) {
			console.log("🟢 pins match -- create and send tokens.");
			console.log("Client IP:", ip);

			// Refresh token – long lived, stored in cookie
			const refreshToken = sign(
				{ ip }, // normalized
				process.env.REFRESH_SECRET || "",
				{ expiresIn: "30d" }
			);

			res.cookie("refresh_token", refreshToken, {
				httpOnly: true,
				secure: true,
				maxAge: 30 * 24 * 60 * 60 * 1000,
				sameSite: "none"
			});

			// Access token – short lived, returned in body
			const accessToken = sign(
				{ ip }, // same normalized IP
				process.env.ACCESS_SECRET || "",
				{ expiresIn: "30s" }
			);

			return res.status(200).send({ accessToken });
		} else {
			console.log("🔴 pin mismatch :(");
			return res.status(401).send({ message: "Invalid PIN" });
		}
	} catch (err: any) {
		console.error(err);
		return res.status(500).send({
			error: err.message || "An unknown error has occurred."
		});
	}
}
 