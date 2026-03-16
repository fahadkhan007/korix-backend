import { Request, Response, NextFunction } from "express";
import { findUserById } from "../models/user.model.js";

const verifyEmailMiddleware = async (req: Request, res: Response, next: NextFunction)=>{
    try{
        const userId = (req as any).userId;
        const user = await findUserById(userId);
        if(!user){
            res.status(404).json({
                message: "user not found"
            });
            return;
        }

        if(!user.isVerified){
            res.status(401).json({
                message: "user not verified"
            });
            return;
        }

        next();
    }catch(err){
        if (res.headersSent) {
            return;
        }

        res.status(500).json({
            message: "internal server error"
        });
    }
}

export { verifyEmailMiddleware };
