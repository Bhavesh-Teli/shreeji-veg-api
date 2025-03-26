import { Router } from "express";
import { login, register } from "../controllers/auth.controller";
import { errorResponse, successResponse } from "../utils/responseHelper";

const router = Router();

router.post("/register", async (req, res) => {
    try {
        const payload = req.body;
        const user = await register(payload);
        return successResponse(res, user, "User registered successfully");
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

export default router;  
