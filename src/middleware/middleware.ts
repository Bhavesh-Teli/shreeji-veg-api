import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import prisma from "../prisma/client";


declare global {
    namespace Express {
        interface Request {
            user?: any; // Replace 'any' with your User type if defined
        }
    }
}

export const authVerify = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeaders = req.headers.authorization;
        if (!authHeaders || !authHeaders.startsWith("Bearer ")) {
            res.status(401).json({ error: "Unauthorized user request" });
            return;
        }
        const token = authHeaders.split(" ")[1];

        if (!token) {
            res.status(401).send({ error: "Unauthorized user request" });
            return;
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

        const user = await prisma.user.findUnique({ where: { id: decodedToken.userId } });

        if (!user) {
            res.status(401).send({ error: "Invalid User Token" });
            return;
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
}   