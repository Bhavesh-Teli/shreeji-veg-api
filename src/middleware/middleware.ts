import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { pool, sql } from "../config/dbConfig";

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
    const adminList = JSON.parse(process.env.ADMIN_USERS!);

    const matchedAdmin = adminList.find((admin: any) => admin.Id === decodedToken.Ac_Id);
    if (matchedAdmin) {
      req.user = {
        Id: matchedAdmin.Id,
        Ac_Name: matchedAdmin.ADMIN_NAME,
        Mobile_No: matchedAdmin.ADMIN_MOBILE_NO,
        isAdmin: true,
      };
      return next();
    }
    const result = await pool.request().input("Ac_Id", sql.Int, decodedToken.Ac_Id).query("SELECT * FROM Ac_Mas WHERE Id = @Ac_Id");

    if (result.recordset.length === 0) {
      res.status(401).json({ error: "Invalid User Token" });
      return;
    }

    req.user = result.recordset[0];
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ message: "Access forbidden. Admins only." });
    return;
  }
  next();
};
