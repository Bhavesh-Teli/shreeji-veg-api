import { Router } from "express";
import { forgotPassword, getCurrentUser, login, requestOTP, resetPassword, verifyOTPAndRegister } from "../controllers/auth.controller";
import { errorResponse, successResponse } from "../utils/responseHelper";
import { authVerify } from "../middleware/middleware";

const router = Router();

router.post("/requestOTP", async (req, res) => {
    try {
        const mobileNo = req.body.mobileNo;
        const Ac_Name = req.body.Ac_Name;
        const result = await requestOTP(mobileNo, Ac_Name);
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
router.get("/getCurrentUser", authVerify, async (req, res) => {
    try {
        const payload = req.user.Id;

        const result = await getCurrentUser(payload);
        return successResponse(res, result, "Login successful.");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
});

router.post("/logout", authVerify, async (req, res) => {
    try {
        res.clearCookie("Shreeji_Veg").status(200).json({
            success: true,
            message: "Logged out successfully.",
        });
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
});

router.post("/forgotPassword", async (req, res) => {
    try {
        const payload = req.body;
        const result = await forgotPassword(payload);
        return successResponse(res, result, "OTP sent successfully");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
});

router.post("/resetPassword", async (req, res) => {
    try {
        const {Mobile_No, otp, newPassword} = req.body;
        const result = await resetPassword(Mobile_No, otp, newPassword);
        return successResponse(res, result, "Password reset successfully");
    } catch (error) {
        return errorResponse(res, (error as Error).message);
    }
});     



export default router;  
