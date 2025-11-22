import * as admin from 'firebase-admin';
import bcryptjs from 'bcryptjs';
import { isValidEmail } from '../validators/stringValidation';
import { getUserByEmail } from './users';

interface Token {
    ip: string,
    token: string,
    createdAt: Date,
    expires: Date
}
const db = admin.firestore();


// SOLID --- will delete all the refresh tokens for a user and store a new one, or throw an error.
export async function storeRefreshToken(tokenData: Token) {
    const tokenCollection = db.collection('refreshTokens'); 

    try {
        // Step 1: Query all tokens for this user
        const existingTokensSnapshot = await tokenCollection.where('ip', '==', tokenData.ip).get();

        // Step 2: Batch delete all matching tokens
        const batch = db.batch();
        existingTokensSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Step 3: Store the new token
        await tokenCollection.add(tokenData);
    } catch (error) {
        throw new Error('Error storing refresh token in DB.')
    }
}


// DECENCT -- Need to possibly throw more errors... this is used in /refreshaccesstoken
export async function getRefreshTokenDocByUserId(userId: string) {
   
    const tokenCollection = db.collection('refreshTokens');
    const today = new Date();

    try {
        // Query for documents where 'userDocId' matches 'docId'
        const querySnapshot = await tokenCollection.where('userDocId', '==', userId).get();

        if (querySnapshot.empty) {
            throw new Error('Could not find a refresh token document in the DB.')
        }

        // Assume the first document in the results is the correct one
        const tokenDoc = querySnapshot.docs[0];
        const tokenData = tokenDoc.data();

        // Check if the token has expired
        const tokenExpiryDate = new Date(tokenData.expires._seconds * 1000); // Converting Firestore Timestamp to JavaScript Date object

        if (today > tokenExpiryDate) {
            throw new Error('Refresh Token Has Expired')
        }

        return tokenData; // Token is valid
    } catch (error) {
        // console.error('Error retrieving token:', error);
        throw error 
    }
}

export async function removeTokenDoc(userDocId: string) { 
   
    const tokenCollection = db.collection('refreshTokens');

    try {
        // Query for documents where 'userDocId' matches the provided 'userDocId'
        const querySnapshot = await tokenCollection.where('userDocId', '==', userDocId).get();

        if (querySnapshot.empty) {
            // console.log('No matching documents found to delete.');
            return;
        }

        // Deleting each document found in the query
        querySnapshot.forEach(async (doc) => {
            await doc.ref.delete();
            // console.log(`Deleted document with ID: ${doc.id}`);
        });
    } catch (error) {
        console.error('Error removing token documents:', error);
        throw new Error('Error removing token documents in removeTokenDoc function in helpers / auth.ts.');
    }
}

export function getAccessTokenUsed(req: any, res: any) {
    // Get the token from the 'Authorization' header
    let accessToken = req.header('Authorization')?.split(' ')[1] || '';

    // Override with a new access token if it's present
    if (res.locals.newAccessToken) {
        accessToken = res.locals.newAccessToken;
    }

    return accessToken;
}

export async function createEmailVerificationCode(emailRequesting: string) {
   
    const emailVerificationCollection = db.collection('EmailVerificationCodes');

    try {
        // Check if there's an existing document with the same email and delete them
        const existingDocs = await emailVerificationCollection.where('email', '==', emailRequesting).get();

        existingDocs.forEach(async (doc) => {
            await doc.ref.delete();
        });

        // Set expiration time (15 minutes from now)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15); 

        const verificationCode = Math.floor(100000 + Math.random() * 900000) 

        // Prepare document data
        const docData = {
            email: emailRequesting,
            expiresAt: admin.firestore.Timestamp.fromDate(expiresAt), // Firestore-friendly timestamp
            code: verificationCode, // Generate a random 6-digit number
            verificationAttempts: 0,
        };

        // Add a new document to Firestore
        await emailVerificationCollection.add(docData);

        return verificationCode // Return document ID if needed

    } catch (error) {
        console.error('Error storing email verification document:', error);
        throw new Error('Error storing email verification document in createEmailVerificationDocument function.');
    }
}

export async function getEmailVerificationCodeDocs(emailRequesting: string) {
   
    const emailVerificationCollection = db.collection('EmailVerificationCodes');

    try {
        // Query for all documents with the matching email
        const querySnapshot = await emailVerificationCollection
            .where('email', '==', emailRequesting)
            .get();

        if (querySnapshot.empty) {
            throw new Error('NO_VERIFICATION_DOCUMENTS_FOUND');
        }

        // If more than one document exists, delete them all and throw an error
        if (querySnapshot.size > 1) {
            const deletePromises = querySnapshot.docs.map(doc => doc.ref.delete());
            await Promise.all(deletePromises); // Wait for all deletions to complete
            throw new Error('MULTIPLE_VERIFICATION_DOCUMENTS_FOUND');
        }

        // Get the single existing document
        const doc = querySnapshot.docs[0];
        const data = doc.data();

        if (!data || !data.expiresAt || typeof data.expiresAt._seconds !== 'number') {
            throw new Error('INVALID_VERIFICATION_DOCUMENT');
        }

        // Check if the verification code has expired
        const expirationDate = new Date(data.expiresAt._seconds * 1000);
        if (Date.now() > expirationDate.getTime()) {
            await doc.ref.delete(); // Delete expired document
            throw new Error('VERIFICATION_CODE_EXPIRED');
        }

        return { id: doc.id, ...data }; // Return the valid document

    } catch (error) {
        if (error instanceof Error) {
            switch (error.message) {
                case 'NO_VERIFICATION_DOCUMENTS_FOUND':
                    throw new Error('No email verification documents exist for this user.');
                case 'MULTIPLE_VERIFICATION_DOCUMENTS_FOUND':
                    throw new Error('Multiple email verification documents exist for this user. Please request a new code.');
                case 'VERIFICATION_CODE_EXPIRED':
                    throw new Error('Verification code has expired.');
                case 'INVALID_VERIFICATION_DOCUMENT':
                    throw new Error('The verification document is invalid or malformed.');
            }
        }
        throw new Error('An unknown error occurred while retrieving email verification documents.');
    }
}

export async function incrementVerificationAttempts(docId: string) {
   
    const emailVerificationCollection = db.collection('EmailVerificationCodes');

    try {
        // Get the document reference
        const docRef = emailVerificationCollection.doc(docId);
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
            throw new Error('DOCUMENT_NOT_FOUND');
        }

        const data = docSnapshot.data();

        if (!data || typeof data.verificationAttempts !== 'number') {
            throw new Error('INVALID_VERIFICATION_DOCUMENT');
        }

        // Increment the verificationAttempts
        const newAttempts = data.verificationAttempts + 1;

        // Update the document
        await docRef.update({ verificationAttempts: newAttempts });

        return newAttempts;
    } catch (error) {
        if (error instanceof Error) {
            switch (error.message) {
                case 'DOCUMENT_NOT_FOUND':
                    throw new Error('The specified verification document does not exist.');
                case 'INVALID_VERIFICATION_DOCUMENT':
                    throw new Error('The verification document is invalid or missing required fields.');
            }
        }
        throw new Error('An unknown error occurred while updating verification attempts.');
    }
}

export async function deleteVerificationCode(docId: string): Promise<void> {
   
    const emailVerificationCollection = db.collection('EmailVerificationCodes');

    try {
        const docRef = emailVerificationCollection.doc(docId);
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
            throw new Error('DOCUMENT_NOT_FOUND');
        }

        await docRef.delete();
    } catch (error) {
        if (error instanceof Error) {
            switch (error.message) {
                case 'DOCUMENT_NOT_FOUND':
                    throw new Error('The specified verification document does not exist.');
            }
        }
        throw new Error('An unknown error occurred while deleting the verification document.');
    }
}


// SOLID - This will create a password reset document for the email account passed in. It will return either an error, or the created document id. IF the email is unverified, mark verifyEmailAccount as true to verify it in the DB.
export async function createPasswordResetDoc(email: string, verifyEmailAccount: boolean) {

    const passwordResetCollection = db.collection('PasswordResets');

    if (!isValidEmail(email)){
        throw new Error('Could not create a password reset doc due to an invalid email address.')
    }

    try {

        // if we need to verify that a user is in the db first. It will throw an error if there is no user returned.
        if (verifyEmailAccount){
            await getUserByEmail(email)
        }

        // Check if there's an existing document with the same email and delete them
        const existingDocs = await passwordResetCollection.where('email', '==', email).get();

        existingDocs.forEach(async (doc) => {
            await doc.ref.delete();
        });

        // Set expiration time (15 minutes from now)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        // Prepare document data
        const docData = {
            email,
            expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        };

        // Add a new document to Firestore
        const docRef = await passwordResetCollection.add(docData);

        return { docId: docRef.id }; // Return reset token and document ID if needed
    } catch (error) {
        console.log(error) 

        // from getUserByEmail Function
        if (error instanceof Error) {
            if (error.message === 'No user found in DB.') {
                throw new Error('No user found in DB.');
            }
            if (error.message === 'Invalid email format.') {
                throw new Error('Invalid email format.');
            } 
            if (error.message === 'Failed to retrieve user by email due to a Firebase error.') {
                throw new Error('Failed to retrieve user by email due to a Firebase error.')
            }
        }

        // fallback
        throw new Error('An error occurred creating the password reset document.');
    }
}

export async function isResetDocValid(resetDocId: string) {
   
    const passwordResetCollection = db.collection('PasswordResets');

    try {
        // Get the document reference
        const docRef = passwordResetCollection.doc(resetDocId);
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
            return 'Reset Doc Not Found'
        }

        const data = docSnapshot.data();

        if (!data || !data.expiresAt || typeof data.expiresAt._seconds !== 'number') {
            return 'Invalid Reset Doc'
        }

        // Convert Firestore Timestamp to JavaScript Date object
        const expirationDate = new Date(data.expiresAt._seconds * 1000);

        // Check if the reset document is expired
        if (Date.now() > expirationDate.getTime()) {
            await docRef.delete(); // Delete expired reset document
            return 'Reset Doc Expired'
        }

        return 'Doc Is Valid'; // Reset document is valid
    } catch (error) {
        throw new Error('An unknown error occurred while validating the password reset document.');
    }
}

// SOLID - this function will retrun the password reset document.
export async function getResetDoc(resetDocId: string) {
   
    const passwordResetCollection = db.collection('PasswordResets');

    try {
        const docRef = passwordResetCollection.doc(resetDocId);
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
            throw new Error('No reset doc found.')
        }

        const data = docSnapshot.data();

        if (!data || !data.expiresAt || typeof data.expiresAt._seconds !== 'number') {
            throw new Error('Invalid Reset Doc')
        }

        const expirationDate = new Date(data.expiresAt._seconds * 1000);

        if (Date.now() > expirationDate.getTime()) {
            throw new Error('Document Expired')
        }

        return { id: docSnapshot.id, ...data }; // return the document data if valid
    } catch (error) {
        throw error;
    }
}

// SOLID this function will delete a password reset document.
export async function deleteResetDoc(resetDocId: string) {
   
    const passwordResetCollection = db.collection('PasswordResets');

    try {
        const docRef = passwordResetCollection.doc(resetDocId);
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
            throw new Error('Reset document not found');
        }

        await docRef.delete();
        return
    } catch (error) {
        throw new Error(`Failed to delete reset document.`);
    }
}

// SOLID  -- this will either update the password, or throw failed to update user password.
export async function updateUserPassword(userId: string, newPassword: string) {
   
    const userRef = db.collection('Users').doc(userId); // or your actual users collection

    const hashedPassword = await bcryptjs.hash(newPassword, 12);

    try {
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            throw new Error('User does not exist');
        }

        await userRef.update({ password: hashedPassword });
    } catch (error) {
        throw new Error(`Failed to update user password.`);
    }
}
