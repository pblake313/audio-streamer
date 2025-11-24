import { Request, Response } from "express";
import { getClientIp } from "../../helpers/IpHelpers";
import { getWrongPinDocByIP } from "../../helpers/WrongPin";

export async function checkBlockStatus(req: Request, res: Response){
    try {
        const ip = getClientIp(req);

        if (!ip) {
            throw new Error("Missing IP address in header.");
        }

        const pastWrongPinDoc = await getWrongPinDocByIP(ip)

        if (!pastWrongPinDoc){
            // nothing to do user hasnt entered a wrong pin...
            return res.status(200).send({
                blocked: false,
                message: "No wrong PIN attempts recorded."
            });
        } else {
            // check to see if they are blocked...
            if (pastWrongPinDoc.blocked) {

                const lastTouched =
                    pastWrongPinDoc.lastTouched instanceof Date
                        ? pastWrongPinDoc.lastTouched
                        : pastWrongPinDoc.lastTouched.toDate();

                const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
                const blockedUntil = new Date(lastTouched.getTime() + sevenDaysMs);
                const now = new Date();

                if (now >= blockedUntil) {
                    return res.status(200).send({
                        blocked: false,
                        message: "Block period expired."
                    });
                }

                return res.status(401).send({
                    blocked: true,
                    blockedUntil
                });

            } else {
                // user is not blocked
                return res.status(200).send({
                    blocked: false,
                    message: "Not blocked."
                });
            }
        }

    } catch (error: any) {
        return res.status(500).send({
            error: error.message || "An unknown error has occurred."
        });
    }
}
