import { Router } from "express";
import { errorResponse, successResponse } from "../utils/responseHelper";
import { authVerify } from "../middleware/middleware";
import { deleteNotification, deleteAllNotification, getNotification, updateAllUnseenNotifications, updateNotification } from "../controllers/notification.controller";
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
router.delete("/deleteNotification", authVerify,authorizeAdmin, async (req, res) => {
    try {
        const {Ids} = req.body;
        if (!Array.isArray(Ids) || Ids.length === 0) {
            return errorResponse(res, "Invalid or empty ID array.");
          }
        const result = await deleteNotification(Ids);
        return successResponse(res, result, "Deleted notifications successfully");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
});
router.delete("/deleteAllNotification", authVerify,authorizeAdmin, async (req, res) => {
    try {
        const result = await deleteAllNotification();
        return successResponse(res, result, "Deleted notifications successfully");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
});
export default router;