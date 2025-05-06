import { Router } from "express";
import { errorResponse, successResponse } from "../utils/responseHelper";
import { authVerify } from "../middleware/middleware";
import { getNotification, updateNotification } from "../controllers/notification.controller";

const router = Router();

router.get("/getNotification", authVerify, async (req, res) => {
    try {
        const result = await getNotification();
        return successResponse(res, result, "Fetched notifications successfully");
    } catch (error) {
        console.log(error)
        return errorResponse(res, (error as Error).message);
    }
});

router.put("/updateNotification", authVerify, async (req, res) => {
    try {
        const payload = req.query.Ac_Id;
        const result = await updateNotification(payload);
        return successResponse(res, result, "Updated notifications successfully");
    } catch (error) {
        console.log(error)
        return errorResponse(res, (error as Error).message);
    }
});

export default router;