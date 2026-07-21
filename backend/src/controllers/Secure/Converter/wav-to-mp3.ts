import { error } from "console";
import { NextFunction, Request, Response } from "express";

export async function wavToMp3(req: Request, res: Response, next: NextFunction) {


    try {
        const files = req.files as Express.Multer.File[];

        if (!files?.length) {
            throw new Error('No files sent.')
        }

        files.forEach(file => {
            console.log(file)
        });


        return res.status(200).send({ message: 'ok 4 now' })
    } catch {
        next(error)
    }



}