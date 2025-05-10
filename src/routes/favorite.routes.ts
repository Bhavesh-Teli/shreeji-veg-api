import { Request, Response, Router } from "express";
import { errorResponse, successResponse } from "../utils/responseHelper";
import { addFavorite, getAllItem, getFavorite, removeFavorite } from "../controllers/favorite.controller";
import { authVerify } from "../middleware/middleware";

const router = Router();

router.get("/getAllItem", async (req: Request, res: Response) => {
  try {
    const result = await getAllItem(req.query.lang as 'en' | 'hi' | 'gu');
    return successResponse(res, result, "Fetched all items successfully");
  } catch (error) {
    return errorResponse(res, (error as Error).message);
  }
});
router.post("/addToFavorites", authVerify, async (req: Request, res: Response) => {
  try {
    const payload = {
      Ac_Id: req.user.Id,
      ...req.body,
    };
    const result = await addFavorite(payload);
    return successResponse(res, result, "Successfully add to favorite");
  } catch (error) {
    return errorResponse(res, (error as Error).message);
  }
});
router.get("/getFavorites", authVerify, async (req: Request, res: Response) => {
  try {
    const payload = {
      Ac_Id: req.query.Ac_Id,
      lang: req.query.lang as 'en' | 'hi' | 'gu',
    };
    const result = await getFavorite(payload);
    return successResponse(res, result, "Fetched favorites successfully");
  } catch (error) {
    return errorResponse(res, (error as Error).message);
  }
});
router.post("/deleteFavorites", authVerify, async (req: Request, res: Response) => {
  try {
    const payload = {
      Ac_Id: req.user.Id,
      ...req.body,
    };
    const result = await removeFavorite(payload);
    return successResponse(res, result, "Removed from favorites");
  } catch (error) {
    return errorResponse(res, (error as Error).message);
  }
});



export default router;