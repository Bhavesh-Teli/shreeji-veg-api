import { Router } from "express";
import { errorResponse, successResponse } from "../utils/responseHelper";
import { authVerify } from "../middleware/middleware";
import { addSalePurMain, editSalePurMain, getOrderData, getLrNo, deleteOrder, updateFreezeTime, getFreezeTime, getUnit } from "../controllers/order.controller";
import { getAllYearRangesFromComMass } from "../utils/dbFunctions";

const router = Router();

router.post("/getLrNo", authVerify, async (req, res) => {
  try {
    const { Bill_Date, Ac_Id } = req.body;
    const Order_Count = await getLrNo(Ac_Id, Bill_Date);
    return successResponse(res, { Order_Count }, "LR No fetched successfully.");
  } catch (error) {
    return errorResponse(res, (error as Error).message);
  }
});

router.post("/updateFreezeTime", authVerify, async (req, res) => {
  try {
    const { Order_Freez_Time } = req.body;
    await updateFreezeTime(Order_Freez_Time);
    return successResponse(res, null, "Freeze time updated successfully.");
  } catch (error) {
    return errorResponse(res, (error as Error).message);
  }
});

router.get("/getFreezeTime", authVerify, async (req, res) => {
  try {
    const freezeTime = await getFreezeTime();
    return successResponse(res, { freezeTime }, "Freeze time fetched successfully.");
  } catch (error) {
    return errorResponse(res, (error as Error).message);
  }
}); 

router.get("/getUnit", authVerify, async (req, res) => {
  try {
    const result = await getUnit();
    return successResponse(res, result, "Unique unit fetched successfully.");
  } catch (error) {
    return errorResponse(res, (error as Error).message);
  }
});

// Route to insert data into Sale_Pur_Main
router.post("/addSalePurMain", authVerify, async (req, res) => {
  try {
    const { mode, Bill_Date, Order_Count, details , Ac_Id, Ac_Code, Our_Shop_Ac} = req.body;
    // const { Id: Ac_Id, Ac_Code, Our_Shop_Ac } = req.user;

    // Call the insert function from the controller
    await addSalePurMain(mode, Ac_Id, Ac_Code, Order_Count, details, Bill_Date, Our_Shop_Ac);
    return successResponse(res, null, "Data inserted successfully into Sale_Pur_Main!");
  } catch (error) {
    return errorResponse(res, (error as Error).message);
  }
});

router.post("/editSalePurMain", authVerify, async (req, res) => {
  try {
    const { mode, Bill_Date, Order_Count, Id, details, Ac_Id, Ac_Code, Our_Shop_Ac } = req.body;
    await editSalePurMain(mode, Id, Ac_Id, Ac_Code, Order_Count, details, Bill_Date, Our_Shop_Ac);
    return successResponse(res, null, "Data inserted successfully into Sale_Pur_Main!");
  } catch (error) {
    return errorResponse(res, (error as Error).message);
  }
});


router.get("/OrderData", authVerify, async (req, res) => {
  const { fromDate, toDate, db_name } = req.query;
  const { isAdmin, Id: Ac_Id } = req.user;
  try {
    const result = await getOrderData({ fromDate, toDate, Ac_Id, isAdmin, db_name });
    return successResponse(res, result, "Order data fetched successfully.");
  } catch (error) {
    return errorResponse(res, (error as Error).message);
  }
})

router.delete("/deleteOrder", authVerify, async (req, res) => {
  try {
    const { Bill_No } = req.body;
    const result = await deleteOrder(Bill_No, req.user.Ac_Name);
    return successResponse(res, result, "Order deleted successfully.");
  } catch (error) {
    return errorResponse(res, (error as Error).message);
  }
});


router.get("/getAllYear", authVerify, async (req, res) => {
  try {
    const yearRanges = await getAllYearRangesFromComMass();
    return successResponse(res, yearRanges, "Year ranges fetched successfully.");
  } catch (error) {
    return errorResponse(res, (error as Error).message);
  }
});

export default router;
