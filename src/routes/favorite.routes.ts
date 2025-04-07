import { Request, Response, Router } from "express";
import { errorResponse, successResponse } from "../utils/responseHelper";
import { addFavorite, getAllItem, getFavorite, removeFavorite } from "../controllers/favorite.controller";
import { authVerify } from "../middleware/middleware";

const router = Router();

router.get("/getAllItem", async (req: Request, res: Response) => {
  try {
    const result = await getAllItem();
    return successResponse(res, result, "Fetched all items successfully");
  } catch (error) {
    return errorResponse(res, (error as Error).message);
  }
});
router.post("/addToFavorites", authVerify, async (req: Request, res: Response) => {
  try {
    const payload = {
      userId: req.user.Id,
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
        userId: req.user.Id,
      };
      const result = await getFavorite(payload);
      console.log(result)
      return successResponse(res, result, "Fetched favorites successfully");
    } catch (error) {
      console.log(error)
      return errorResponse(res, (error as Error).message);
    }
  });
  router.post("/deleteFavorites", authVerify, async (req: Request, res: Response) => {
    try {
      const payload = {
        userId: req.user.Id,
        ...req.body,
      };
      const result = await removeFavorite(payload);
      return successResponse(res, result, "Removed from favorites");
    } catch (error) {
      return errorResponse(res, (error as Error).message);
    }
  });
  


export default router;