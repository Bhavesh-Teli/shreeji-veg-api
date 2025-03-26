import { Application, Router, Request, Response } from "express";
import authRoutes from "./auth.routes";
import favoriteRoutes from "./favorite.routes"

const registerRoutes = (app: Application) => {
    const router = Router();
    router.use(authRoutes);
    router.use(favoriteRoutes);
    router.use("/*", (req: Request, res: Response) => {
        res.status(404).send("Not found");
      });
      app.use("/api", router);
}

export default registerRoutes;

