import { pool, sql } from "../config/dbConfig";
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
  let transaction: sql.Transaction | null = null;

  try {
    console.log("🔄 Starting transaction...");
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    const sysTimeFormatted = new Date().toTimeString().slice(0, 8);
    console.log("🕒 Sys Time:", sysTimeFormatted);

    // Generate auto numbers
    console.log("🔢 Generating auto numbers...");
    const [id, typeId, bookVNo, vNo] = await Promise.all([
      autoNumber(pool, "Sale_Pur_Main", "Id", "Type <> 'Purchase Old' AND Type <> 'Sale Old'"),
      autoNumber(pool, "Sale_Pur_Main", "Type_Id", `Type = '${Type}'`),
      autoNumber(pool, "Sale_Pur_Main", "Book_V_No", `Type = '${Type}' AND Book_Ac_Id = ${bookAcId}`),
      autoNumber(pool, "Sale_Pur_Main", "V_No", `Type = '${Type}'`)
    ]);
    console.log("✅ Auto Numbers Generated:", { id, typeId, bookVNo, vNo });

    console.log("📦 Preparing insert query...");

    // Insert Query
    const insertQuery = `
      INSERT INTO Sale_Pur_Main (
        Id, Type_Id, Book_V_No, V_No, Book_Id, Book_Ac_Id,
        Bill_No, Bill_NoP, Bill_NoS, Full_Bill_No, Bill_Type, Bill_Date,
        Gross_Amt, Total_Amount, Total_Qty, Total_Sundry_Disc_Amt,
        Round_Off, Net_Amt, Net_Amt1, Total_Disc_Amt, Asses_Val,
        AmtInWord, Ac_Id, Remark, Type, mem_no, Pay_Mode,
        Cash_Bill, Cancel_Bill, Order_Close, USER_ID,
        ${mode === "add" ? "Sys_Date_Add, Sys_Time_Add" : "Sys_Date_Edit, Sys_Time_Edit"},
        Area_Id, Branch_ID, Bala_Amt, LR_No,Manu_Order_Close
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

    // Request object directly from the pool
    const request = transaction
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
      .input("Full_Bill_No", sql.NVarChar, `${Bill_No}`)
      .input("Bill_Type", sql.NVarChar, `${Ac_Code}-${Order_Count}`)
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
      .input("AmtInWord", sql.NVarChar, "Zero Only")
      .input("Ac_Id", sql.Int, Ac_Id)
      .input("Remark", sql.NVarChar, "")
      .input("Type", sql.NVarChar, "Purchase Order")
      .input("mem_no", sql.NVarChar, "")
      .input("Pay_Mode", sql.NVarChar, "Party")
      .input("Cash_Bill", sql.Bit, false)
      .input("Cancel_Bill", sql.Bit, false)
      .input("Order_Close", sql.Bit, false)
      .input("USER_ID", sql.Int, USER_ID)
      .input("Sys_Date", sql.DateTime, Bill_Date) //dATE NOW
      .input("Sys_Time", sql.VarChar(8), sysTimeFormatted)
      .input("Area_Id", sql.Int, areaId)
      .input("Branch_ID", sql.Int, branchId)
      .input("Bala_Amt", sql.Decimal(18, 2), 0)
      .input("LR_No", sql.Int, Order_Count)
      .input("Manu_Order_Close", sql.Bit, Our_Shop_Ac);
      console.log("🚀 Executing insert query...");
      await request.query(insertQuery);
      console.log("✅ Inserted into Sale_Pur_Main");
  
      console.log("📥 Inserting SalePurDetail...");
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
      console.log("✅ Inserted SalePurDetail");
  
      await transaction.commit();
      console.log("✅ Transaction committed successfully!");
  } catch (error: any) {
    console.error("❌ Error inserting into Sale_Pur_Main:", error.message);
    if (transaction !== null) await transaction.rollback(); // rollback safely
    throw error;
  }
};

interface SalePurDetailRow {
  Itm_Id: number;
  Inward: number;
  Uni_ID: number;
  Itm_Name: string;
}

// export const insertSalePurDetail = async (
//   mode: "add" | "edit",
//   details: SalePurDetailRow[],
//   Ac_Id: number,
//   Ac_Code: string,
//   id: number,
//   typeId: number,
//   Order_Count: number,
//   Bill_No: number,
//   Bill_Date: string,
//   Our_Shop_Ac: number
// ) => {
//   try {
//     console.log("enter in insert sale put detail");

//     if (mode === "edit") {
//       await pool.request().query(`DELETE FROM Sale_Pur_Detail WHERE ID = ${id} AND Type = 'Purchase Order'`);
//     }

//     for (let i = 0; i < details.length; i++) {
//       const row = details[i];

//       const srNo = i + 1;
//       const itm_Id = row.Itm_Id || 0;
//       const inward = row.Inward || 0;
//       const Uni_ID = row.Uni_ID || 0;

//       const itmName = row.Itm_Name?.trim() || "";
//       // Find additional fields
//       const igpId = await findRecReturn(pool, "Itm_Mas", "IGP_Id", `Itm_Id = ${itm_Id}`);
//       let Product_Type = "";

//       if (igpId) {
//         const igpNameResult = await pool.request().query(`SELECT IGP_Name FROM Itm_Grp WHERE IGP_Id = ${igpId}`);
//         if (igpNameResult.recordset.length > 0) {
//           Product_Type = igpNameResult.recordset[0].IGP_Name;
//         }
//       }

//       const form_Id = await findRecReturn(pool, "Itm_Mas", "Sort_Index", `Itm_Id = ${itm_Id}`);

//       const mUniName = await findRecReturn(pool, "Uni_Mas", "Uni_Name", `Uni_ID = ${Uni_ID}`);
//       if (!mUniName) {
//         throw new Error("Unit Not Found In Master...");
//       }

//       let dNo = "";
//       if (inward !== 0) {
//         const qtyFormatted = inward.toFixed(3);
//         if (mUniName && typeof mUniName === "string" && mUniName.toUpperCase() === "PCS") {
//           dNo = `${parseFloat(qtyFormatted)} Pcs`;
//         } else {
//           dNo = `${parseFloat(qtyFormatted)} ${inward <= 0.999 ? "Gm" : "Kg"}`;
//         }
//       }

//       const insertQuery = `
//         INSERT INTO Sale_Pur_Detail (
//           SrNo, Itm_Id, inward, Qty, Rate, Uni_ID, Amt, Gross_Amt, Gross_Rate, Disc_Per, Disc_Amt, 
//           Asses_Val, Description, Itm_Desc1, Delivered, Pay_Mode, Ac_Id, Style, Itm_Cat, 
//           IGP_ID, Location, Form_Id, D_No, Book_Ac_Id, Book_Id, Type_Id, Type, ID, Full_Bill_No, 
//           Bill_No, Bill_Date, Net_Amt, mem_no, Branch_ID, Order_Close, Area_Id, Manu_Order_Close
//         ) VALUES (
//           @SrNo, @Itm_Id, @Inward, @Qty, @Rate, @Uni_ID, @Amt, @Gross_Amt, @Gross_Rate, @Disc_Per, @Disc_Amt, 
//           @Asses_Val, @Description, @Itm_Desc1, @Delivered, @Pay_Mode, @Ac_Id, @Style, @Itm_Cat, 
//           @IGP_ID, @Location, @Form_Id, @D_No, @Book_Ac_Id, @Book_Id, @Type_Id, @Type, @ID, @Full_Bill_No, 
//           @Bill_No, @Bill_Date, @Net_Amt, @mem_no, @Branch_ID, @Order_Close, @Area_Id, @Manu_Order_Close
//         )
//       `;
//       const request = pool
//         .request()
//         .input("SrNo", sql.Int, srNo)
//         .input("Itm_Id", sql.Int, itm_Id)
//         .input("Inward", sql.Decimal(18, 3), inward)
//         .input("Qty", sql.Decimal(18, 3), inward)
//         .input("Rate", sql.Decimal(18, 2), 0)
//         .input("Uni_ID", sql.Int, Uni_ID)
//         .input("Amt", sql.Decimal(18, 2), 0)
//         .input("Gross_Amt", sql.Decimal(18, 2), 0)
//         .input("Gross_Rate", sql.Decimal(18, 2), 0)
//         .input("Disc_Per", sql.Decimal(18, 2), 0)
//         .input("Disc_Amt", sql.Decimal(18, 2), 0)
//         .input("Asses_Val", sql.Decimal(18, 2), 0)
//         .input("Description", sql.NVarChar, "")
//         .input("Itm_Desc1", sql.NVarChar, "")
//         .input("Delivered", sql.Bit, false)
//         .input("Pay_Mode", sql.NVarChar, "Party")
//         .input("Ac_Id", sql.Int, Ac_Id)
//         .input("Style", sql.NVarChar, `${Ac_Code}-${Order_Count}`)
//         .input("Itm_Cat", sql.NVarChar, itmName)
//         .input("IGP_ID", sql.Int, igpId || null)
//         .input("Location", sql.NVarChar, Product_Type)
//         .input("Form_Id", sql.Int, form_Id)
//         .input("D_No", sql.NVarChar, dNo)
//         .input("Book_Ac_Id", sql.Int, bookAcId)
//         .input("Book_Id", sql.Int, bookId)
//         .input("Type_Id", sql.Int, typeId)
//         .input("Type", sql.NVarChar, "Purchase Order")
//         .input("ID", sql.Int, id)
//         .input("Full_Bill_No", sql.NVarChar, `${Bill_No}`)
//         .input("Bill_No", sql.Int, Bill_No)
//         .input("Bill_Date", sql.DateTime, new Date(Bill_Date))
//         .input("Net_Amt", sql.Decimal(18, 2), 0)
//         .input("mem_no", sql.NVarChar, "")
//         .input("Branch_ID", sql.Int, branchId)
//         .input("Order_Close", sql.Bit, false)
//         .input("Area_Id", sql.Int, areaId)
//         .input("Manu_Order_Close", sql.Bit, Our_Shop_Ac);

//       console.log(`
//           Inserting into Sale_Pur_Detail:
//           Mode: ${mode}
//           Details: ${JSON.stringify(details)}
//           Ac_Id: ${Ac_Id}
//           Ac_Code: ${Ac_Code}
//           Id: ${id}
//           Type_Id: ${typeId}
//           Order_Count: ${Order_Count}
//           Bill_No: ${Bill_No}
//           Bill_Date: ${Bill_Date}
//           Our_Shop_Ac: ${Our_Shop_Ac}
          
//         `);

//       await request.query(insertQuery);
//     }

//     console.log("✅ Sale_Pur_Detail records inserted successfully!");
//   } catch (error) {
//     console.error("❌ Error inserting into Sale_Pur_Detail:", error);
//     throw error;
//   }
// };

// Fetch Sale_Pur_Main by ID

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

    console.log("🚀 Entered insertSalePurDetail function");
    console.log(details)

    if (mode === "edit") {
      console.log(`🧹 Deleting existing Sale_Pur_Detail rows for ID: ${id}`);
      await request.query(`DELETE FROM Sale_Pur_Detail WHERE ID = ${id} AND Type = 'Purchase Order'`);
    }

    for (let i = 0; i < details.length; i++) {
      console.log(`\n🔁 Processing row ${i + 1}/${details.length}`);
      const row = details[i];
      console.log("📦 Row data:", row);

      const srNo = i + 1;
      const itm_Id = row.Itm_Id || 0;
      const inward = row.Inward || 0;
      const Uni_ID = row.Uni_ID || 0;
      const itmName = row.Itm_Name?.trim() || '';

      const igpId = await findRecReturn(transaction, "Itm_Mas", "IGP_Id", `Itm_Id = ${itm_Id}`);
      console.log("🔍 IGP_Id:", igpId);

      let Product_Type = "";
      if (igpId) {
        const igpNameResult = await transaction.request().query(`SELECT IGP_Name FROM Itm_Grp WHERE IGP_Id = ${igpId}`);
        if (igpNameResult.recordset.length > 0) {
          Product_Type = igpNameResult.recordset[0].IGP_Name;
          console.log("📦 Product_Type (IGP_Name):", Product_Type);
        }
      }

      const form_Id = await findRecReturn(pool, "Itm_Mas", "Sort_Index", `Itm_Id = ${itm_Id}`);
      console.log("📝 Form_Id (Sort_Index):", form_Id);

      const mUniName = await findRecReturn(pool, "Uni_Mas", "Uni_Name", `Uni_ID = ${Uni_ID}`);
      if (!mUniName) throw new Error("❌ Unit Not Found In Master...");
      console.log("📐 Unit Name (Uni_Name):", mUniName);

      let dNo = "";
      if (inward !== 0) {
        const qtyFormatted = inward.toFixed(3);
        dNo =
          mUniName.toUpperCase() === "PCS"
            ? `${parseFloat(qtyFormatted)} Pcs`
            : `${parseFloat(qtyFormatted)} ${inward <= 0.999 ? "Gm" : "Kg"}`;
      }
      console.log("📄 D_No (Quantity Description):", dNo);

      console.log("📤 Executing INSERT with values:", {
        srNo,
        itm_Id,
        inward,
        Uni_ID,
        itmName,
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
        .input("Itm_Id", sql.Int, itm_Id)
        .input("Inward", sql.Decimal(18, 3), inward)
        .input("Qty", sql.Decimal(18, 3), inward)
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
        .input("Itm_Cat", sql.NVarChar, itmName)
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

export const getSalePurMain = async (id: number) => {
  try {
    const result = await pool.request().input("Id", id).query(`
        SELECT 
          Id,
          Type_Id,
          Book_V_No,
          V_No,
          Book_Id,
          Book_Ac_Id,
          Bill_No,
          Bill_NoP,
          Bill_NoS,
          Full_Bill_No,
          Bill_Type,
          Bill_Date,
          Gross_Amt,
          Total_Amount,
          Total_Qty,
          Total_Sundry_Disc_Amt,
          Round_Off,
          Net_Amt,
          Net_Amt1,
          Total_Disc_Amt,
          Asses_Val,
          AmtInWord,
          Ac_Id,
          Remark,
          Type,
          mem_no,
          Pay_Mode,
          Cash_Bill,
          Cancel_Bill,
          Order_Close,
          USER_ID,
          Sys_Date_Add,
          Sys_Time_Add,
          Sys_Date_Edit,
          Sys_Time_Edit,
          Area_Id,
          Branch_ID,
          Bala_Amt,
          LR_No,
          Manu_Order_Close
        FROM Sale_Pur_Main
        WHERE Id = @Id
      `);

    if (result.recordset.length === 0) {
      throw new Error("No record found with the provided Id");
    }

    return result.recordset[0];
  } catch (error) {
    console.error("Error in getSalePurMain:", error);
    throw error;
  }
};

export const getOrderData = async ({ fromDate, toDate, Ac_Id, isAdmin }: any) => {
  try {
    let mainQuery = `
      SELECT Id, Ac_Id, Bill_No, Bill_Date
      FROM Sale_Pur_Main
      WHERE Bill_Date BETWEEN @FromDate AND @ToDate
    `;

    if (!isAdmin) {
      mainQuery += ` AND Ac_Id = @Ac_Id`;
    }

    const mainRequest = pool.request().input("FromDate", sql.Date, fromDate).input("ToDate", sql.Date, toDate);

    if (!isAdmin) {
      mainRequest.input("Ac_Id", sql.Int, Ac_Id);
    }

    const mainResult = (await mainRequest.query(mainQuery)).recordset;
    console.log("mainRecord", mainResult);

    if (mainResult.length === 0) {
      return [];
    }

    const mainIds = mainResult.map((record) => record.Bill_No);
    console.log("mainIds", mainIds);

    const detailResult = (
      await pool.request().query(`
      SELECT 
        Bill_No, Itm_Id, Qty, Uni_ID
      FROM Sale_Pur_Detail
      WHERE Bill_No IN (${mainIds.join(",")})
    `)
    ).recordset;

    const combinedData = mainResult.map((main) => ({
      Ac_Id: main.Ac_Id,
      Bill_No: main.Bill_No,
      Bill_Date: main.Bill_Date,
      Details: detailResult.filter((detail) => detail.Bill_No === main.Bill_No),
    }));
    console.log("combine data", combinedData);
    return combinedData;
  } catch (error) {
    console.error("Error in getOrderData:", error);
    throw error;
  }
};
