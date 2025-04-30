import { Router } from "express";
import { errorResponse, successResponse } from "../utils/responseHelper";
import { authVerify } from "../middleware/middleware";
import { insertSalePurMain, getSalePurMain, insertSalePurDetail, getOrderData, getLrNo,getBillNo } from "../controllers/order.controller";

const router = Router();

router.post("/getLrNo", authVerify, async (req, res) => {
  try {
    const { Bill_Date } = req.body;
    const { Id: Ac_Id } = req.user;
    const Order_Count = await getLrNo(Ac_Id, Bill_Date);
    return successResponse(res, { Order_Count }, "LR No fetched successfully.");
  } catch (error) {
    return errorResponse(res, (error as Error).message);
  }
});

router.get("/getBillNo",authVerify,async (req,res)=>{
    try {
        const Bill_No=await getBillNo();
        return successResponse(res,{Bill_No},"Bill No fetched successfully.");
    } catch (error) {
        return errorResponse(res,(error as Error).message);
    }
})


// Route to insert data into Sale_Pur_Main
router.post("/insertSalePurMain", authVerify, async (req, res) => {
  try {
    const { mode, Bill_Date, Order_Count, Bill_No, details } = req.body;
    const { Id: Ac_Id, Ac_Code, Our_Shop_Ac } = req.user;

    // Call the insert function from the controller
    await insertSalePurMain(mode, Ac_Id, Ac_Code, Order_Count,Bill_No, details, Bill_Date, Our_Shop_Ac);

    return successResponse(res, null, "Data inserted successfully into Sale_Pur_Main!");
  } catch (error) {
    return errorResponse(res, (error as Error).message);
  }
});

// Route to get Sale_Pur_Main data by ID or other parameters (example)
router.get("/getSalePurMain/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Call your get data function (you need to implement this)
    const result = await getSalePurMain(id);

    return successResponse(res, result, "Sale_Pur_Main data fetched successfully.");
  } catch (error) {
    return errorResponse(res, (error as Error).message);

  }
});

router.post("/insertSalePurDetail", authVerify, async (req, res) => {
  try {
    const {
      mode,
      details,
      id,
      typeId,
      Bill_No,
      Order_SrNo,
      Bill_Date,
    } = req.body;
    const { Id: Ac_Id, Ac_Code, Our_Shop_Ac } = req.user;

    await insertSalePurDetail(
      mode,
      details,
      Ac_Id,
      Ac_Code,
      id,
      typeId,
      Order_SrNo,
      Bill_No,
      Bill_Date,
      Our_Shop_Ac
    );

    return successResponse(res, null, "Data inserted successfully into Sale_Pur_Detail!");
  } catch (error) {
    return errorResponse(res, (error as Error).message);
  }
});


router.get("/OrderData", authVerify, async (req, res) => {
  const { fromDate, toDate,Ac } = req.query;
  const { isAdmin, Id: Ac_Id } = req.user;
  try {
    const result = await getOrderData({ fromDate, toDate, Ac_Id, isAdmin });
    return successResponse(res, result, "Order data fetched successfully.");
  } catch (error) {
    return errorResponse(res, (error as Error).message);
  }
})

export default router;
