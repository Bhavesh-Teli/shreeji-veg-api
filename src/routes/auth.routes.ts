import { Router } from "express";
import { getCurrentUser, login, requestOTP, verifyOTPAndRegister } from "../controllers/auth.controller";
import { errorResponse, successResponse } from "../utils/responseHelper";
import { authVerify } from "../middleware/middleware";

const router = Router();

router.post("/requestOTP", async (req, res) => {
    try {
        const mobileNo = req.body.mobileNo;
        const result = await requestOTP(mobileNo);
        return successResponse(res, result, "OTP sent successfully");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
});

router.post("/register", async (req, res) => {
    try {
        const payload = req.body;
        const enteredOTP = req.body.otp;
        const result = await verifyOTPAndRegister(payload, enteredOTP);
        return successResponse(res, result, "OTP verified successfully");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
});

router.post("/login", async (req, res) => {
    try {
        const payload = req.body;
        const result = await login(payload);
        return successResponse(res, result, "Login successful.");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
});
router.get("/getCurrentUser",authVerify,async (req, res) => {
    try {
        const payload = req.user.Id;
       
        const result = await getCurrentUser(payload);
        return successResponse(res, result, "Login successful.");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
});

router.get("/logout",authVerify,async (req, res) => {
    try {
        res.clearCookie("Shreeji_Veg").status(200).json({
            success: true,
            message: "Logged out successfully.",
          });
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
});




export default router;  
