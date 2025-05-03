import { pool, sql, baseDbConfig } from "../config/dbConfig";
import { getDbPool } from "../utils/dbPoolManager";
import { autoNumber, findRecReturn, getCount } from "../utils/reUsableFunction";

// Static values
const bookId = 25;
const bookAcId = 60;
const branchId = 1;
const areaId = 0;
const USER_ID = 1;
const Type = "Purchase Order";

export const getLrNo = async (Ac_Id: number, Bill_Date: string) =>
  await getCount(pool, "Sale_Pur_Main", `Ac_Id = ${Ac_Id} AND Bill_Date = '${Bill_Date}'`);
export const getBillNo = async () =>
  await autoNumber(pool, "Sale_Pur_Main", "Bill_No", `Type = '${Type}' AND Book_Ac_Id = ${bookAcId} AND Branch_Id = ${branchId}`);

// Insert into Sale_Pur_Main
export const insertSalePurMain = async (
  mode: "add" | "edit",
  Ac_Id: number,
  Ac_Code: string,
  Order_Count: number,
  Bill_No: number,
  details: SalePurDetailRow[],
  Bill_Date: string,
  Our_Shop_Ac: number
) => {
  const transaction = pool.transaction();

  try {
    await transaction.begin();
    const sysTimeFormatted = new Date().toTimeString().slice(0, 8);

    if (mode === "add") {
      const fullBillNo = `${Bill_No}`;
      const billType = `${Ac_Code}-${Order_Count}`;

      const [id, typeId, bookVNo, vNo] = await Promise.all([
        autoNumber(pool, "Sale_Pur_Main", "Id", "Type <> 'Purchase Old' AND Type <> 'Sale Old'"),
        autoNumber(pool, "Sale_Pur_Main", "Type_Id", `Type = '${Type}'`),
        autoNumber(pool, "Sale_Pur_Main", "Book_V_No", `Type = '${Type}' AND Book_Ac_Id = ${bookAcId}`),
        autoNumber(pool, "Sale_Pur_Main", "V_No", `Type = '${Type}'`)
      ]);

      const insertQuery = `
        INSERT INTO Sale_Pur_Main (
          Id, Type_Id, Book_V_No, V_No, Book_Id, Book_Ac_Id,
          Bill_No, Bill_NoP, Bill_NoS, Full_Bill_No, Bill_Type, Bill_Date,
          Gross_Amt, Total_Amount, Total_Qty, Total_Sundry_Disc_Amt,
          Round_Off, Net_Amt, Net_Amt1, Total_Disc_Amt, Asses_Val,
          AmtInWord, Ac_Id, Remark, Type, mem_no, Pay_Mode,
          Cash_Bill, Cancel_Bill, Order_Close, USER_ID,
          Sys_Date_Add, Sys_Time_Add,
          Area_Id, Branch_ID, Bala_Amt, LR_No, Manu_Order_Close
        ) VALUES (
          @Id, @Type_Id, @Book_V_No, @V_No, @Book_Id, @Book_Ac_Id,
          @Bill_No, @Bill_NoP, @Bill_NoS, @Full_Bill_No, @Bill_Type, @Bill_Date,
          @Gross_Amt, @Total_Amount, @Total_Qty, @Total_Sundry_Disc_Amt,
          @Round_Off, @Net_Amt, @Net_Amt1, @Total_Disc_Amt, @Asses_Val,
          @AmtInWord, @Ac_Id, @Remark, @Type, @mem_no, @Pay_Mode,
          @Cash_Bill, @Cancel_Bill, @Order_Close, @USER_ID,
          @Sys_Date, @Sys_Time,
          @Area_Id, @Branch_ID, @Bala_Amt, @LR_No, @Manu_Order_Close
        )
      `;

      await transaction
        .request()
        .input("Id", sql.Int, id)
        .input("Type_Id", sql.Int, typeId)
        .input("Book_V_No", sql.Int, bookVNo)
        .input("V_No", sql.Int, vNo)
        .input("Book_Id", sql.Int, bookId)
        .input("Book_Ac_Id", sql.Int, bookAcId)
        .input("Bill_No", sql.Int, Bill_No)
        .input("Bill_NoP", sql.NVarChar, "")
        .input("Bill_NoS", sql.NVarChar, "")
        .input("Full_Bill_No", sql.NVarChar, fullBillNo)
        .input("Bill_Type", sql.NVarChar, billType)
        .input("Bill_Date", sql.DateTime, Bill_Date)
        .input("Gross_Amt", sql.Decimal(18, 2), 0)
        .input("Total_Amount", sql.Decimal(18, 2), 0)
        .input("Total_Qty", sql.Decimal(18, 2), 0)
        .input("Total_Sundry_Disc_Amt", sql.Decimal(18, 2), 0)
        .input("Round_Off", sql.Decimal(18, 2), 0)
        .input("Net_Amt", sql.Decimal(18, 2), 0)
        .input("Net_Amt1", sql.Decimal(18, 2), 0)
        .input("Total_Disc_Amt", sql.Decimal(18, 2), 0)
        .input("Asses_Val", sql.Decimal(18, 2), 0)
        .input("AmtInWord", sql.NVarChar, "Rs. Zero Only.")
        .input("Ac_Id", sql.Int, Ac_Id)
        .input("Remark", sql.NVarChar, "")
        .input("Type", sql.NVarChar, `${Type}`)
        .input("mem_no", sql.NVarChar, "")
        .input("Pay_Mode", sql.NVarChar, "Party")
        .input("Cash_Bill", sql.Bit, false)
        .input("Cancel_Bill", sql.Bit, false)
        .input("Order_Close", sql.Bit, false)
        .input("USER_ID", sql.Int, USER_ID)
        .input("Sys_Date", sql.DateTime, Bill_Date)
        .input("Sys_Time", sql.VarChar(8), sysTimeFormatted)
        .input("Area_Id", sql.Int, areaId)
        .input("Branch_ID", sql.Int, branchId)
        .input("Bala_Amt", sql.Decimal(18, 2), 0)
        .input("LR_No", sql.Int, Order_Count)
        .input("Manu_Order_Close", sql.Bit, Our_Shop_Ac)
        .query(insertQuery);

      // Also insert details
      await insertSalePurDetail(
        transaction,
        mode,
        details,
        Ac_Id,
        Ac_Code,
        id,
        typeId,
        Order_Count,
        Bill_No,
        Bill_Date,
        Our_Shop_Ac
      );
    } else {
      // In update mode, just update the edit timestamp
      const fetchQuery = `
      SELECT Id, Type_Id
      FROM Sale_Pur_Main
      WHERE Bill_No = @Bill_No
    `;
      const fetchResult = await transaction.request().input("Bill_No", sql.Int, Bill_No).query(fetchQuery);
      const { Id: id, Type_Id: typeId } = fetchResult.recordset[0];
      const updateQuery = `
        UPDATE Sale_Pur_Main
        SET Sys_Date_Edit = @Sys_Date, Sys_Time_Edit = @Sys_Time
        WHERE Bill_No = @Bill_No AND Ac_Id = @Ac_Id
      `;

      await transaction
        .request()
        .input("Sys_Date", sql.DateTime, Bill_Date)
        .input("Sys_Time", sql.VarChar(8), sysTimeFormatted)
        .input("Bill_No", sql.Int, Bill_No)
        .input("Ac_Id", sql.Int, Ac_Id)
        .query(updateQuery);

      // You may still want to update details
      await insertSalePurDetail(
        transaction,
        mode,
        details,
        Ac_Id,
        Ac_Code,
        id, // existing Id
        typeId, // existing Type_Id
        Order_Count,
        Bill_No,
        Bill_Date,
        Our_Shop_Ac
      );
    }

    await transaction.commit();
  } catch (error: any) {
    await transaction.rollback();
    throw error;
  }
};

interface SalePurDetailRow {
  Itm_Id: number;
  Inward: number;
  Uni_ID: number;
  Itm_Name: string;
}


export const insertSalePurDetail = async (
  transaction: sql.Transaction,
  mode: "add" | "edit",
  details: SalePurDetailRow[],
  Ac_Id: number,
  Ac_Code: string,
  id: number,
  typeId: number,
  Order_Count: number,
  Bill_No: number,
  Bill_Date: string,
  Our_Shop_Ac: number
) => {
  try {
    const request = transaction.request();

    if (mode === "edit") {
      await request.query(`DELETE FROM Sale_Pur_Detail WHERE ID = ${id} AND Type = 'Purchase Order'`);
    }

    for (let i = 0; i < details.length; i++) {
      console.log(`\n🔁 Processing row ${i + 1}/${details.length}`);
      const { Itm_Id, Inward, Uni_ID, Itm_Name } = details[i];
      // console.log("📦 Row data:", row);

      const srNo = i + 1;
      // const itm_Id = row.Itm_Id || 0;
      // const inward = row.Inward || 0;
      // const Uni_ID = row.Uni_ID || 0;
      // const itmName = row.Itm_Name?.trim() || '';


      const [igpId, form_Id, Uni_Name] = await Promise.all([
        findRecReturn(pool, "Itm_Mas", "IGP_Id", `Itm_Id = ${Itm_Id}`),
        findRecReturn(pool, "Itm_Mas", "Sort_Index", `Itm_Id = ${Itm_Id}`),
        findRecReturn(pool, "Uni_Mas", "Uni_Name", `Uni_ID = ${Uni_ID}`)
      ]);

      let Product_Type = "";
      if (igpId) {
        const igpNameResult = await transaction.request().query(`SELECT IGP_Name FROM Itm_Grp WHERE IGP_Id = ${igpId}`);
        if (igpNameResult.recordset.length > 0) {
          Product_Type = igpNameResult.recordset[0].IGP_Name;
        }
      }

      if (!Uni_Name) throw new Error("❌ Unit Not Found In Master...");

      let dNo = "";
      if (Inward !== 0) {
        const qtyFormatted = Inward.toFixed(3);
        dNo =
          typeof Uni_Name === "string" && Uni_Name.toUpperCase() === "PCS"
            ? `${parseFloat(qtyFormatted)} Pcs`
            : `${parseFloat(qtyFormatted)} ${Inward <= 0.999 ? "Gm" : "Kg"}`;
      }

      console.log("📤 Executing INSERT with values:", {
        srNo,
        Itm_Id,
        Inward,
        Uni_ID,
        Itm_Name,
        Product_Type,
        form_Id,
        dNo,
        Ac_Id,
        Ac_Code,
        id,
        typeId,
        Order_Count,
        Bill_No,
        Bill_Date,
        Our_Shop_Ac
      });
      const insertQuery = `
              INSERT INTO Sale_Pur_Detail (
                SrNo, Itm_Id, inward, Qty, Rate, Uni_ID, Amt, Gross_Amt, Gross_Rate, Disc_Per, Disc_Amt, 
                Asses_Val, Description, Itm_Desc1, Delivered, Pay_Mode, Ac_Id, Style, Itm_Cat, 
                IGP_ID, Location, Form_Id, D_No, Book_Ac_Id, Book_Id, Type_Id, Type, ID, Full_Bill_No, 
                Bill_No, Bill_Date, Net_Amt, mem_no, Branch_ID, Order_Close, Area_Id, Manu_Order_Close
              ) VALUES (
                @SrNo, @Itm_Id, @Inward, @Qty, @Rate, @Uni_ID, @Amt, @Gross_Amt, @Gross_Rate, @Disc_Per, @Disc_Amt, 
                @Asses_Val, @Description, @Itm_Desc1, @Delivered, @Pay_Mode, @Ac_Id, @Style, @Itm_Cat, 
                @IGP_ID, @Location, @Form_Id, @D_No, @Book_Ac_Id, @Book_Id, @Type_Id, @Type, @ID, @Full_Bill_No, 
                @Bill_No, @Bill_Date, @Net_Amt, @mem_no, @Branch_ID, @Order_Close, @Area_Id, @Manu_Order_Close
              )
            `;

      const request = transaction
        .request()
        .input("SrNo", sql.Int, srNo)
        .input("Itm_Id", sql.Int, Itm_Id)
        .input("Inward", sql.Decimal(18, 3), Inward)
        .input("Qty", sql.Decimal(18, 3), Inward)
        .input("Rate", sql.Decimal(18, 2), 0)
        .input("Uni_ID", sql.Int, Uni_ID)
        .input("Amt", sql.Decimal(18, 2), 0)
        .input("Gross_Amt", sql.Decimal(18, 2), 0)
        .input("Gross_Rate", sql.Decimal(18, 2), 0)
        .input("Disc_Per", sql.Decimal(18, 2), 0)
        .input("Disc_Amt", sql.Decimal(18, 2), 0)
        .input("Asses_Val", sql.Decimal(18, 2), 0)
        .input("Description", sql.NVarChar, "")
        .input("Itm_Desc1", sql.NVarChar, "")
        .input("Delivered", sql.Bit, false)
        .input("Pay_Mode", sql.NVarChar, "Party")
        .input("Ac_Id", sql.Int, Ac_Id)
        .input("Style", sql.NVarChar, `${Ac_Code}-${Order_Count}`)
        .input("Itm_Cat", sql.NVarChar, Itm_Name)
        .input("IGP_ID", sql.Int, igpId || null)
        .input("Location", sql.NVarChar, Product_Type)
        .input("Form_Id", sql.Int, form_Id)
        .input("D_No", sql.NVarChar, dNo)
        .input("Book_Ac_Id", sql.Int, bookAcId)
        .input("Book_Id", sql.Int, bookId)
        .input("Type_Id", sql.Int, typeId)
        .input("Type", sql.NVarChar, "Purchase Order")
        .input("ID", sql.Int, id)
        .input("Full_Bill_No", sql.NVarChar, `${Bill_No}`)
        .input("Bill_No", sql.Int, Bill_No)
        .input("Bill_Date", sql.DateTime, new Date(Bill_Date))
        .input("Net_Amt", sql.Decimal(18, 2), 0)
        .input("mem_no", sql.NVarChar, "")
        .input("Branch_ID", sql.Int, branchId)
        .input("Order_Close", sql.Bit, false)
        .input("Area_Id", sql.Int, areaId)
        .input("Manu_Order_Close", sql.Bit, Our_Shop_Ac);

      await request.query(insertQuery);
      console.log("✅ Row inserted successfully!");
    }

    console.log("🎉 All Sale_Pur_Detail records inserted successfully!");
  } catch (error) {
    console.error("❌ Error inserting into Sale_Pur_Detail:", error);
    throw error;
  }
};

export const getOrderData = async ({ fromDate, toDate, Ac_Id, isAdmin, db_name }: any) => {
  try {
    console.log("🔽 Fetching order data with params:", { fromDate, toDate, Ac_Id, isAdmin, db_name });
    const DBName = process.env.DB_PREFIX + db_name;
    const pool = await getDbPool(DBName);

    let mainQuery = `
      SELECT M.Id, M.Bill_No, M.Bill_Date,M.LR_No, A.Ac_Name
      FROM Sale_Pur_Main M
      JOIN Ac_Mas A ON M.Ac_Id = A.Id
      WHERE M.Bill_Date BETWEEN @FromDate AND @ToDate
    `;

    if (!isAdmin) {
      mainQuery += ` AND Ac_Id = @Ac_Id`;
      console.log("🔐 Applying Ac_Id filter for non-admin");
    }

    console.log("🟡 Executing mainQuery:", mainQuery);

    const mainRequest = pool.request()
      .input("FromDate", sql.Date, fromDate)
      .input("ToDate", sql.Date, toDate);

    if (!isAdmin) {
      mainRequest.input("Ac_Id", sql.Int, Ac_Id);
    }

    const mainResult = (await mainRequest.query(mainQuery)).recordset;
    console.log("✅ mainRecord:", mainResult);

    if (mainResult.length === 0) {
      console.log("⚠️ No main records found");
      return [];
    }

    const mainBillNos = mainResult.map((record) => `'${record.Bill_No}'`).join(",");
    console.log("🧾 mainBillNos:", mainBillNos);

    const detailQuery = `
      SELECT 
        D.Bill_No,D.SrNo, D.Itm_Id, I.Itm_Name, D.Qty, D.Uni_ID, U.Uni_Name
      FROM Sale_Pur_Detail D
      LEFT JOIN Uni_Mas U ON D.Uni_ID = U.Uni_ID
      LEFT JOIN Itm_Mas I ON D.Itm_Id = I.Itm_ID
      WHERE D.Bill_No IN (${mainBillNos})
    `;

    console.log("🔍 detailQuery:", detailQuery);

    const detailResult = (await pool.request().query(detailQuery)).recordset;
    console.log("📦 detailResult:", detailResult);

    const combinedData = mainResult.map((main) => ({
      Ac_Name: main.Ac_Name,
      Bill_No: main.Bill_No,
      Bill_Date: main.Bill_Date,
      Order_Count: main.LR_No,
      Details: detailResult
        .filter((detail) => detail.Bill_No === main.Bill_No)
        .map((detail) => ({
          ...detail,
          Qty:
            Number(detail.Qty) % 1 === 0
              ? Number(detail.Qty)
              : Number(detail.Qty).toFixed(3),
        })),
    }));

    console.log("🧩 Combined Data:", combinedData);
    return combinedData;
  } catch (error) {
    console.error("❌ Error in getOrderData:", error);
    throw error;
  }
};


export const deleteOrder = async (Bill_No: number) => {
  const transaction = pool.transaction();

  try {
    await transaction.begin();

    // Delete from Sale_Pur_Detail first (child table)
    const detailResult = await transaction
      .request()
      .input("Bill_No", sql.Int, Bill_No)
      .query("DELETE FROM [Sale_Pur_Detail] WHERE Bill_No = @Bill_No");

    // Then delete from Sale_Pur_Main (parent table)
    const mainResult = await transaction
      .request()
      .input("Bill_No", sql.Int, Bill_No)
      .query("DELETE FROM [Sale_Pur_Main] WHERE Bill_No = @Bill_No");

    // If no rows were deleted in main, throw an error
    if (mainResult.rowsAffected[0] === 0) {
      throw new Error("Order not found");
    }

    await transaction.commit();

    return {
      message: "Order deleted successfully",
      Bill_No,
      detailRowsDeleted: detailResult.rowsAffected[0],
      mainRowsDeleted: mainResult.rowsAffected[0],
    };
  } catch (error: any) {
    await transaction.rollback();
    throw new Error(error.message || "Something went wrong while deleting the order.");
  }
};
