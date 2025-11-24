import { Request, Response } from "express"

export async function logout(req: Request, res: Response) {
    try {
        res.cookie('refresh_token', '', {maxAge: 0})
        res.status(200).send({message: 'logout successful'})
    } catch {
        res.cookie('refresh_token', '', {maxAge: 0})
        res.status(200).send({message: 'logout successful'})
    }
    
}