import { Request, Response } from 'express';
import { findUserByEmail, findUserById } from '../models/user.model.js';




const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try{
        const { token } = req.params as { token: string };

    }catch(err){

    }
}