import { Router } from 'express';
import admin from 'firebase-admin';
import { JsonWebTokenError, sign, TokenExpiredError, verify } from 'jsonwebtoken';
import { storeRefreshToken } from '../helpers/auth';

const db = admin.firestore();

const router = Router()

interface WrongPinAttempt {
    id: string;
    ip: string;
    dateCreated: FirebaseFirestore.Timestamp | Date;
    expiresAt: FirebaseFirestore.Timestamp | Date;
    attempts: number;
    blocked: boolean;
}


router.post('/login-with-pin', async (req, res) => {
    try {
        const activePIN = process.env.ACTIVE_PIN;

        const pinSubmitted = req.body.pin;
        const forwarded = req.headers['x-forwarded-for'];
        const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket.remoteAddress;

        if (!ip) {
            throw new Error('Missing IP Address');
        }

        if (pinSubmitted === activePIN) {
            // PINS MATCH! :)
            console.log('Pins Match');

            const refreshToken = sign({ip}, process.env.REFRESH_SECRET || '', {expiresIn: '30d'}) 
            res.cookie('refresh_token', refreshToken, {
                httpOnly: true, // this means only the backend can acces the cookies... not the front.
                secure: true,
                maxAge: 30 * 24 * 60 * 60 * 1000, // 65 days
                sameSite: 'none'
            })

            const expirationDate = new Date()
            expirationDate.setDate(expirationDate.getDate() + 21)

            const accessToken = sign({ip}, process.env.ACCESS_SECRET || '', {expiresIn: '30s'})

            return res.status(200).send({accessToken: accessToken}) 


        } else {
            // PINS DONT MATCH :(

            const pastWrongPinDoc = await getWrongPinDocByIP(ip);

            if (pastWrongPinDoc) {
                // if the doc is expired, delete it and create a new one.
                if (isDocExpired(pastWrongPinDoc.expiresAt)) {
                    console.log('Expired. Deleting old doc...');
                    await db.collection('wrongPinAttempts').doc(pastWrongPinDoc.id).delete();
                    await createWrongPinDoc(ip);
                    return res.status(200).send({ error: 'Wrong Pin', attemptsRemaining: 2 });
                }

                const attempts = await updateWrongPinDoc(ip, pastWrongPinDoc.id, pastWrongPinDoc.attempts || 1);
                const attemptsRemaining = Math.max(0, 3 - attempts);
            
                return res.status(200).send({
                    error: 'Wrong Pin',
                    attemptsRemaining,
                    blocked: attempts >= 3
                });

            } else {
                await createWrongPinDoc(ip);
                return res.status(200).send({error: 'Wrong Pin', attemptsRemaining: 2})
            }

        }

    } catch (error) {
        return res.status(500).send({
            error: (error as Error).message || 'An unknown error has occurred.',
        });
    }
});

router.post('/check-ip', async (req, res)=>{
    try {
        const forwarded = req.headers['x-forwarded-for'];
        const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket.remoteAddress;

        if (!ip) {
            throw new Error('Missing IP Address');
        }

        const pastWrongPinDoc = await getWrongPinDocByIP(ip);

        if (pastWrongPinDoc) {
            // Check to see if the document has expired
            if (isDocExpired(pastWrongPinDoc.expiresAt)) { 
                console.log('document expired.')
                await db.collection('wrongPinAttempts').doc(pastWrongPinDoc.id).delete();
                return res.status(200).send({message: 'ok 4 now'})
            }

            // Check if the IP is blocked due to too many failed attempts
            if (pastWrongPinDoc.blocked) {
                throw new Error('Access Denied')
            }
        }

        // IP Address is not blocked... try and autologin...


        // here we are only going to attempt an autologin if the refresh cookie is valid, hence there is no catch block
        try {
            const refreshCookie = req.cookies['refresh_token'] 

            if (!refreshCookie){
                throw new Error('No Refresh Cookie')
            }

            const refreshPayload = verify(refreshCookie, process.env.REFRESH_SECRET || '') as { ip: string };

            console.log('RefreshPayloadIP: ', getFirstIP(refreshPayload.ip))
            console.log('Actual IP',  getFirstIP(ip))

            if (getFirstIP(refreshPayload.ip) === getFirstIP(ip)){
                const newAccessToken = sign({ip: getFirstIP(refreshPayload.ip)}, process.env.ACCESS_SECRET || '', {expiresIn: '30s'})
                return res.status(200).send({accessToken: newAccessToken})
            } else {
                throw new Error('IP does not match refresh token ip.')
            }

        } catch (refreshError) {
            return res.status(200).send({error: (refreshError as Error).message})
        }

    } catch (error) {
        return res.status(500).send({
            error: (error as Error).message || 'An unknown error has occurred.',
        });
    }
})

const getFirstIP = (ipString: string | undefined): string | null => {
	if (!ipString) return null;
	return ipString.split(',')[0].trim(); // Grab only the first IP
};

async function createWrongPinDoc(ip: string) {
    console.log(`IP Address: ${ip}`);
    const now = new Date();
    const expiresAt = new Date(now);
    // expiresAt.setDate(now.getDate() + 7); // adds 7 days
    expiresAt.setTime(now.getTime() + 60 * 1000); // adds 1 minute

    const docData = {
        ip,
        dateCreated: now,
        expiresAt,
        attempts: 1,
        blocked: false,
    };

    try {
       // Step 1: Query for existing docs with same IP
       const existingDocs = await db
            .collection('wrongPinAttempts')
            .where('ip', '==', ip)
            .get();

        // Step 2: Delete each matching doc
        const deletePromises = existingDocs.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);

        // Step 3: Add new doc
        await db.collection('wrongPinAttempts').add(docData);
        console.log('Wrong PIN attempt logged.');
    } catch (err) {
        throw new Error('An error creating the pin attempt document in the DB.')
    }

}

async function getWrongPinDocByIP(ip: string): Promise<WrongPinAttempt | null> {
    try {
        const snapshot = await db
            .collection('wrongPinAttempts')
            .where('ip', '==', ip)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return null;
        }

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        } as WrongPinAttempt;
    } catch (err) {
        console.error('Error fetching wrong PIN doc by IP:', err);
        throw new Error('Failed to fetch wrong PIN document.');
    }
}


async function updateWrongPinDoc(ip: string, docId: string, currentAttempts: number) {
    const newAttempts = currentAttempts + 1;
    const blocked = newAttempts >= 3;

    const updateData = {
        attempts: newAttempts,
        blocked
    };

    try {
        await db.collection('wrongPinAttempts').doc(docId).update(updateData);
        console.log(`Wrong PIN doc updated: Attempts = ${newAttempts}, Blocked = ${blocked}`);
        return newAttempts;
    } catch (err) {
        console.error('Error updating wrong PIN doc:', err);
        throw new Error('Failed to update wrong PIN document.');
    }
}

function isDocExpired(expiresAt: FirebaseFirestore.Timestamp | Date): boolean {
    const expirationDate = expiresAt instanceof admin.firestore.Timestamp
        ? expiresAt.toDate()
        : expiresAt;

    return expirationDate < new Date();
}

export default router