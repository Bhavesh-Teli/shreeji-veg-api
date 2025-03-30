import { Router } from "express";
import { approveUser, getUnapprovedUsers, rejectUser } from "../controllers/admin.controller";
import { errorResponse, successResponse } from "../utils/responseHelper";
import { authorizeAdmin, authVerify } from "../middleware/middleware";

const router = Router();

router.get("/getUnapprovedUsers",authVerify,authorizeAdmin, async (req, res) => {
    try {
        const users = await getUnapprovedUsers();
        return successResponse(res, users, "Unapproved users fetched successfully");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
}); 

router.post("/approveUser",authVerify,authorizeAdmin, async (req, res) => {
    try {
        const payload = req.body;
        await approveUser(payload);
        return successResponse(res, "User approved successfully");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
});

router.post("/rejectUser", async (req, res) => {
    try {
        const payload = req.body;
        await rejectUser(payload);
        return successResponse(res, "User rejected successfully");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
});

export default router;

