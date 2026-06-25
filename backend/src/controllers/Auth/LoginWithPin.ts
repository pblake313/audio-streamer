// src/routes/auth/loginWithPin.ts
import { NextFunction, Request, Response } from "express";
import { sign } from "jsonwebtoken";
import { getClientIp } from "../../helpers/IpHelpers";
import { createWrongPinDocument, deleteWrongPinDocByIP, getWrongPinDocByIP, incrementLastPinDoc } from "../../helpers/WrongPin";
import { AppError } from "../../errors/AppError";

export async function loginWithPin(req: Request, res: Response, next: NextFunction) {
	try {
		const activePIN = process.env.ACTIVE_PIN;
		const pinSubmitted = req.body.pin;

		const ip = getClientIp(req);

        if (!ip) throw new AppError(400, "Missing or invalid IP address.");

		if (pinSubmitted === activePIN) {
			// console.log("🟢 pins match -- create and send tokens.");


            // first check if we have a wrong pin doc for this ip

            const pastWrongPinDoc = await getWrongPinDocByIP(ip)

            if (pastWrongPinDoc) {

                if (pastWrongPinDoc?.blocked){
                    // check if the user is still blocked.

                    const lastAttempt =
                        pastWrongPinDoc.lastAttempt instanceof Date
                            ? pastWrongPinDoc.lastAttempt
                            : pastWrongPinDoc.lastAttempt.toDate();

                    const now = new Date();
                    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
                    const diffMs = now.getTime() - lastAttempt.getTime();

                    if (diffMs >= sevenDaysMs) {
                        // console.log('🟢 password correct, but users block period has expired and can now log in.', ip);
                    } else {
                        // console.log(`🔴 Password correct, but user is still blocked.);
                        throw new AppError(401, 'Device Blocked', {wrongPinDoc: pastWrongPinDoc})
                    }

                } 
            }

            // delete all wrong pin docs for this ip.
            await deleteWrongPinDocByIP(ip)


            // got here...

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

            // console.log("🟠 pin mismatch :(");

            const pastWrongPinDoc = await getWrongPinDocByIP(ip)

            if (pastWrongPinDoc) {
                // console.log('🔵 Past wrong pin doc: ', pastWrongPinDoc)


                if (pastWrongPinDoc.blocked) {
                    // 🔍 Normalize lastTouched into a JS Date (handles Firestore Timestamp or Date)
                    const lastAttempt =
                        pastWrongPinDoc.lastAttempt instanceof Date
                            ? pastWrongPinDoc.lastAttempt
                            : pastWrongPinDoc.lastAttempt.toDate();

                    const now = new Date();
                    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
                    const diffMs = now.getTime() - lastAttempt.getTime();

                    if (diffMs >= sevenDaysMs) {
                        // console.log('🟢 Block expired — resetting wrong pin doc for IP:', ip);
                        const replacedPinDoc = await createWrongPinDocument(ip);

                        throw new AppError(401, 'Invalid PIN', {wrongPinDoc: replacedPinDoc})
                    } else {
                        // console.log(`🔴 User is still blocked for IP:`, ip, `Blocked until: ${diffMs}`);

                        throw new AppError(401, 'Device Blocked', {wrongPinDoc: pastWrongPinDoc})

                    }
                }

                const updatedPinDoc = await incrementLastPinDoc(ip);

                // 7 days after lastTouched

                throw new AppError(401, 'Invalid PIN', {wrongPinDoc: updatedPinDoc})

            } else {
                // console.log('🟣 need to create a past pin doc')

                const wrongPinDoc = await createWrongPinDocument(ip)
                // console.log('🟣 New wrong pin doc: ', wrongPinDoc)

                throw new AppError(401, 'Invalid PIN', {wrongPinDoc})
            }

		}
	} catch (err: any) {
        next(err)
	}

}
 