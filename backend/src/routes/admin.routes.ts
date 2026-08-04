import { Router } from "express";
import { approveUser, getUnapprovedUsers, getUserList, uploadItemPhoto, deleteItemPhoto } from "../controllers/admin.controller";
import multer from "multer";
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

router.get("/getUserList", authVerify, authorizeAdmin, async (req, res) => {
    try {
        const users = await getUserList();
        return successResponse(res, users, "User list fetched successfully");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
})
router.get("/getTime", authVerify, authorizeAdmin, async (req, res) => {
    try {
        const Time = new Date().toLocaleString();
        return successResponse(res, Time, "Time fetched successfully");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
})

const upload = multer({ storage: multer.memoryStorage() });

router.post("/uploadItemPhoto/:id", authVerify, authorizeAdmin, upload.single("photo"), async (req, res) => {
    try {
        if (!req.file) {
            return errorResponse(res, "No file uploaded.");
        }
        const Itm_Id = parseInt(req.params.id as string);
        if (isNaN(Itm_Id)) return errorResponse(res, "Invalid Item ID");

        const photoUrl = await uploadItemPhoto(Itm_Id, req.file.buffer);
        return successResponse(res, { Photo: photoUrl }, "Photo uploaded successfully");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
});

router.delete("/deleteItemPhoto/:id", authVerify, authorizeAdmin, async (req, res) => {
    try {
        const Itm_Id = parseInt(req.params.id as string);
        if (isNaN(Itm_Id)) return errorResponse(res, "Invalid Item ID");

        await deleteItemPhoto(Itm_Id);
        return successResponse(res, null, "Photo deleted successfully");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
});

export default router;

