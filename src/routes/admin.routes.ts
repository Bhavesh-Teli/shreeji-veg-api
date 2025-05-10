import { Router } from "express";
import { approveUser, getUnapprovedUsers, getUserList } from "../controllers/admin.controller";
import { errorResponse, successResponse } from "../utils/responseHelper";
import { authorizeAdmin, authVerify } from "../middleware/middleware";

const router = Router();

router.get("/getUnapprovedUsers", authVerify, authorizeAdmin, async (req, res) => {
    try {
        const users = await getUnapprovedUsers();
        return successResponse(res, users, "Unapproved users fetched successfully");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
});

router.post("/approveUser", authVerify, authorizeAdmin, async (req, res) => {
    try {
        const payload = req.body;
        await approveUser(payload);
        return successResponse(res, "User approved successfully");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
});

router.get("/getUserList",authVerify,authorizeAdmin,async(req,res)=>{
    try {
        const users = await getUserList();
        return successResponse(res, users, "User list fetched successfully");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
})
router.get("/getTime",authVerify,authorizeAdmin,async(req,res)=>{
    try {
        const Time = new Date().toLocaleString();
        return successResponse(res, Time, "Time fetched successfully");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
})
export default router;

