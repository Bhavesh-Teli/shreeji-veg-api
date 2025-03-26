import { Request, Response, Router } from "express";
import { errorResponse, successResponse } from "../utils/responseHelper";
import { addFavorite, getFavorite, removeFavorite } from "../controllers/favorite.controller";
import { authVerify } from "../middleware/middleware";

const router = Router();

router.post("/addToFavorites", authVerify, async (req: Request, res: Response) => {
  try {
    const payload = {
      userId: req.user.id,
      ...req.body,
    };
    const result = await addFavorite(payload);
    return successResponse(res, result, "Successfully add to favorite");
  } catch (error) {
    console.log(error)
    return errorResponse(res, (error as Error).message);
  }
});
router.get("/getFavorites", authVerify, async (req: Request, res: Response) => {
    try {
      const payload = {
        userId: req.user.id,
      };
      const result = await getFavorite(payload);
      return successResponse(res, result, "Fetched favorites successfully");
    } catch (error) {
      console.log(error)
      return errorResponse(res, (error as Error).message);
    }
  });
  router.get("/deleteFavorites", authVerify, async (req: Request, res: Response) => {
    try {
      const payload = {
        userId: req.user.id,
        ...req.body,
      };
      const result = await removeFavorite(payload);
      return successResponse(res, result, "Removed from favorites");
    } catch (error) {
      console.log(error)
      return errorResponse(res, (error as Error).message);
    }
  });
  


export default router;