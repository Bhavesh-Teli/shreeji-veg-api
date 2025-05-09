import { Router } from "express";
import { errorResponse, successResponse } from "../utils/responseHelper";
import { authVerify } from "../middleware/middleware";
import { getNotification, updateAllUnseenNotifications, updateNotification } from "../controllers/notification.controller";
import { authorizeAdmin } from "../middleware/middleware";

const router = Router();

router.get("/getNotification", authVerify,authorizeAdmin, async (req, res) => {
    try {
        const result = await getNotification();
        return successResponse(res, result, "Fetched notifications successfully");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
});

router.put("/updateNotification", authVerify,authorizeAdmin, async (req, res) => {
    try {
        const payload = req.query.Ac_Id;
        const result = await updateNotification(payload);
        return successResponse(res, result, "Updated notifications successfully");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
});
router.put("/updateAllUnseenNotifications", authVerify,authorizeAdmin, async (req, res) => {
    try {
        const result = await updateAllUnseenNotifications();
        return successResponse(res, result, "Updated notifications successfully");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
});

export default router;