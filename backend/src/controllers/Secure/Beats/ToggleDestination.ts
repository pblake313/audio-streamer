import { NextFunction, Request, Response } from "express";
import { FutureDestination } from "../../../types/Beat";
import { getBeatById } from "../../../helpers/GetBeatById";
import admin from 'firebase-admin';

export async function toggleBeatDestination(req: Request, res: Response, next: NextFunction) {
    try {
        const beatId = req.params.beatId
        const destination = req.body.destination

        // if destination is not a future destination.. throw an error..
        if (!isFutureDestination(destination)){
            throw new Error('Not a valid future destination string.')
        }

        const beat = await getBeatById(beatId)

        // update the beats future destinantions... basically if the destination isnt there, add it, and if it is there remove it. return the updated beat

        const currentFutureDestinations = Array.isArray(
            beat.futureDestinations
        )
            ? beat.futureDestinations
            : [];

        const updatedFutureDestinations = currentFutureDestinations.includes(
            destination
        )
            ? currentFutureDestinations.filter((item) => item !== destination)
            : [...currentFutureDestinations, destination];

        const updatedBeat = {
            ...beat,
            futureDestinations: updatedFutureDestinations,
            updatedAt: new Date(),
        };

        await admin
            .firestore()
            .collection("Beats")
            .doc(beatId)
            .update({
                futureDestinations: updatedFutureDestinations,
                updatedAt: updatedBeat.updatedAt,
            });

        return res.status(200).send({
            futureDestinations: updatedFutureDestinations
        });


    } catch (error: any) {
        next(error)
    }
    
}


const validFutureDestinations: FutureDestination[] = [
    "Soundcloud",
    "Youtube",
    "Pattsway",
];

export function isFutureDestination(
    value: unknown
): value is FutureDestination {
    return (
        typeof value === "string" &&
        validFutureDestinations.includes(value as FutureDestination)
    );
}