import { Request, Response } from "express";

export async function getAuthorizedUser(req: Request, res: Response) {
    return res.status(200).send({message: 'valid access token exists.'})
    
}