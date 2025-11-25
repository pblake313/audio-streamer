// src/routes/auth/loginWithPin.ts
import { Request, Response } from "express";
import { sign } from "jsonwebtoken";
import { getClientIp } from "../../helpers/IpHelpers";
import { createWrongPinDocument, deleteWrongPinDocByIP, getWrongPinDocByIP, incrementLastPinDoc } from "../../helpers/WrongPin";

export async function loginWithPin(req: Request, res: Response) {
	try {
		const activePIN = process.env.ACTIVE_PIN;
		const pinSubmitted = req.body.pin;

		const ip = getClientIp(req);

		if (!ip) {
			throw new Error("Missing IP address in header.");
		}

		if (pinSubmitted === activePIN) {
			// console.log("🟢 pins match -- create and send tokens.");

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

            const streamToken = sign(
                { ip },
                process.env.STREAM_SECRET || "",
                { expiresIn: "10s" }
            );


            // delete wrong pin doc.

            await deleteWrongPinDocByIP(ip)

			return res.status(200).send({ accessToken, streamToken });
		} else {

            // console.log("🟠 pin mismatch :(");

            // create a wrong pin doc.
            console.log(ip)

            const pastWrongPinDoc = await getWrongPinDocByIP(ip)

            if (pastWrongPinDoc) {
                console.log('🔵 We have a past pin doc')

                if (pastWrongPinDoc.blocked) {
                    // 🔍 Normalize lastTouched into a JS Date (handles Firestore Timestamp or Date)
                    const lastTouched =
                        pastWrongPinDoc.lastTouched instanceof Date
                            ? pastWrongPinDoc.lastTouched
                            : pastWrongPinDoc.lastTouched.toDate();

                    const now = new Date();
                    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
                    const diffMs = now.getTime() - lastTouched.getTime();

                    if (diffMs >= sevenDaysMs) {
                        // console.log('🟢 Block expired — resetting wrong pin doc for IP:', ip);
                        await createWrongPinDocument(ip);

                        return res.status(401).send({
                            message: 'Invalid PIN',
                            attemptsRemaining: 4, // back to "first wrong attempt" state
                            blocked: false
                        });
                    } else {
                        // console.log('🔴 User is still blocked for IP:', ip);

                        const blockedUntil = new Date(
                            lastTouched.getTime() + sevenDaysMs
                        );

                        return res.status(401).send({
                            message: 'Too many invalid attempts. Try again later.',
                            blocked: true,
                            blockedUntil // you can .toISOString() this if you want
                        });
                    }
                }


                const updatedPinDoc = await incrementLastPinDoc(ip);

                // Convert Firestore Timestamp or JS Date into a JS Date
                const lastTouched = updatedPinDoc.lastTouched instanceof Date
                    ? updatedPinDoc.lastTouched
                    : updatedPinDoc.lastTouched.toDate();

                // 7 days after lastTouched
                const blockedUntil = new Date(lastTouched.getTime() + 7 * 24 * 60 * 60 * 1000);

                return res.status(401).send({
                    message: 'Invalid PIN',
                    attemptsRemaining: 5 - updatedPinDoc.attempts,
                    blocked: updatedPinDoc.blocked,
                    blockedUntil
                });

            } else {
                // console.log('🟣 need to create a past pin doc')
                await createWrongPinDocument(ip)
                return res.status(401).send({message: 'Invalid PIN', attemptsRemaining: 4})
            }

		}
	} catch (err: any) {
		return res.status(500).send({
			error: err.message || "An unknown error has occurred."
		});
	}
}
 