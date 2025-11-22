

import * as admin from 'firebase-admin';
import { isValidEmail } from '../validators/stringValidation';

export async function doesUserExistByEmail(email: string): Promise<boolean> {

    if (!isValidEmail(email)) {
        throw new Error("Invalid email address doesUserExistByEmail function in helpers / users.ts.");
    }

    try {
        const usersRef = admin.firestore().collection('Users');
        const snapshot = await usersRef.where('email', '==', email).limit(1).get();
        const exists = !snapshot.empty;

        return exists;
    } catch (error) {
        // console.error('Error querying Firestore for email:', email, 'Error:', error);
        throw new Error('Failed to query user database doesUserExistByEmail helpers / users.ts.');
    }
}

export async function createAccount(email: string, password: string, isVerified: boolean) {
    if (!isValidEmail(email)) {
        throw new Error("Invalid email address create account function in helpers / users.ts.");
    }

    const userExists = await doesUserExistByEmail(email);

    if (userExists) {
        throw new Error("User already exists");
    } else {
        try {
            const usersRef = admin.firestore().collection('Users');
            const newUserRef = await usersRef.add({
                email: email,
                password: password,  // Remember to hash passwords before storing them
                createdAt: new Date().getTime(),
                permissions: [],
                profileImageUrl: null,
                emailVerified: isVerified
            });

            // Retrieve the newly created document from Firestore
            const newUserDoc = await newUserRef.get();
            if (!newUserDoc.exists) {
                throw new Error('1. Failed to fetch new user account data in createAccount in helpers/ users.ts.');
            }

            // Return the data of the new user document
            return { id: newUserDoc.id, ...newUserDoc.data() };
        } catch (error) {
            throw new Error('2. Failed to fetch new user account data in createAccount in helpers/ users.ts.');
        }
    }
}


// SOLID - This function will either return a users account document, or throw an error
export async function getUserByEmail(email: string) {
    if (!isValidEmail(email)) {
        throw new Error('Invalid email format.');
    }

    try {
        const usersRef = admin.firestore().collection('Users');
        const snapshot = await usersRef.where('email', '==', email).limit(1).get();

        if (snapshot.empty) {
            throw new Error(`UserNotFound`);
        }

        const userDoc = snapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() };
    } catch (error) {
        if (error instanceof Error && error.message === 'UserNotFound') {
            throw new Error(`No user found in DB.`);
        }
        throw new Error('Failed to retrieve user by email due to a Firebase error.');
    }
}

export async function getUserByDocId(id: string): Promise<{ id: string; [key: string]: any }> {
    try {
        const userRef = admin.firestore().collection('Users').doc(id);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            throw new Error('NonExistantUserDoc');
        }
        const userData = userDoc.data();

        if (!userData) {
            throw new Error('NoUserData');
        }

        // Safely remove the password from the user data object.
        const { password, ...userWithoutPassword } = userData;

        return { id: userDoc.id, ...userWithoutPassword };
    } catch (error) {
        // console.error('Error fetching user:', error);

        if (error instanceof Error && error.message === 'NonExistantUserDoc') {
            throw new Error(`Could not find a user doc in the DB from getUserByDocId`);
        } else if (error instanceof Error && error.message === 'NoUserData'){
            throw new Error(`Retrieved user document, but no data was found.`);
        }
        throw new Error('Failed to retrieve user by document ID in getUserByDocId function in helpers / users.ts.');
    }
} 

export async function verifyUserEmail(userId: string): Promise<{ id: string; [key: string]: any }> {
    try {
        const userRef = admin.firestore().collection('Users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            throw new Error('User does not exist for the provided ID in verifyUserEmail function in helpers / users.ts.');
        }

        await userRef.update({ emailVerified: true });

        // Retrieve the updated document
        const updatedUserDoc = await userRef.get();
        const userData = updatedUserDoc.data();

        if (!userData) {
            throw new Error('Failed to retrieve updated user data.');
        }

        // Exclude the password field for security
        const { password, ...userWithoutPassword } = userData;

        return { id: updatedUserDoc.id, ...userWithoutPassword };
    } catch (error) {
        throw new Error('Failed to update emailVerified in verifyUserEmail function in helpers / users.ts.');
    }
}
 