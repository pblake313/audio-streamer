import { NextFunction, Request, Response } from "express";
import * as admin from "firebase-admin";
import { signFirestoreUrl } from "../../../helpers/SignFirestoreUrl";
import { Beat } from "../../../types/Beat";

const db = admin.firestore();


const beatPageSize = Number(process.env.BEATS_PAGE_SIZE) || 10;


export async function getFilteredBeatsByPage(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const page = Number(req.params.page || 1);


        if (!Number.isInteger(page) || page < 1) {
            return res.status(400).send({
                message: "Invalid page number.",
            });
        }


        const artistFilters: string[] = Array.isArray(req.body.artistFilter)
            ? req.body.artistFilter
            : [];

        const beatTypeFilter: string[] = Array.isArray(req.body.beatTypeFilter)
            ? req.body.beatTypeFilter
            : [];

        const tagFilter: string[] = Array.isArray(req.body.tagFilter)
            ? req.body.tagFilter
            : [];

        const moodFilter: string[] = Array.isArray(req.body.moodFilter)
            ? req.body.moodFilter
            : [];


        const filters: admin.firestore.Filter[] = [];


        if (artistFilters.length > 0) {
            filters.push(
                admin.firestore.Filter.or(
                    admin.firestore.Filter.where(
                        "tagOne",
                        "in",
                        artistFilters
                    ),
                    admin.firestore.Filter.where(
                        "tagTwo",
                        "in",
                        artistFilters
                    )
                )
            );
        }


        if (beatTypeFilter.length > 0) {
            filters.push(
                admin.firestore.Filter.where(
                    "trackType",
                    "in",
                    beatTypeFilter
                )
            );
        }


        if (tagFilter.length > 0) {
            filters.push(
                admin.firestore.Filter.where(
                    "customTag",
                    "in",
                    tagFilter
                )
            );
        }


        if (moodFilter.length > 0) {
            filters.push(
                admin.firestore.Filter.where(
                    "mood",
                    "in",
                    moodFilter
                )
            );
        }


        let beatsQuery: admin.firestore.Query = db.collection("Beats");


        if (filters.length === 1) {
            beatsQuery = beatsQuery.where(filters[0]);
        }


        if (filters.length > 1) {
            beatsQuery = beatsQuery.where(
                admin.firestore.Filter.and(...filters)
            );
        }


        const offset = (page - 1) * beatPageSize;


        const snapshot = await beatsQuery
            .orderBy("createdAt", "desc")
            .offset(offset)
            .limit(beatPageSize + 1)
            .get();


        const hasMore = snapshot.docs.length > beatPageSize;

        const beats = await Promise.all(
            snapshot.docs
                .slice(0, beatPageSize)
                .map(async (doc) => {
                    const beat = {
                        id: doc.id,
                        ...doc.data(),
                    } as Beat;

                    const signedMp3Url = await signFirestoreUrl(
                        beat.mp3Url,
                        0,
                        1
                    );

                    return {
                        ...beat,
                        mp3Url: signedMp3Url, 
                    };
                })
        );


        return res.status(200).send({
            beats,
            page,
            hasMore,
        });
    } catch (err: any) {
        console.log(err)
        next(err);
    }
}