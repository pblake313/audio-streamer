import { NextFunction, Request, Response } from "express";
import * as admin from 'firebase-admin';
const db = admin.firestore();


export async function deleteBeat(req: Request, res: Response, next: NextFunction){
    try {
        const beatId = req.params.beatId;

        await db.collection('Beats').doc(beatId).delete();
        return res.status(200).json({ message: 'Beat deleted successfully' });
    } catch (error: any) {
        next(error)
    }

}