import { pool, sql } from "../config/dbConfig";
import { getDbPool } from "../utils/dbPoolManager";
import { autoNumber, findRecReturn, getCount } from "../utils/reUsableFunction";
import { sendNotification } from "./notification.controller";
// Static values
const bookId = 25;
const bookAcId = 60;
const branchId = 1;
const areaId = 0;
const USER_ID = 1;
const Type = "Purchase Order";

export const getLrNo = async (Ac_Id: number, Bill_Date: string) =>
  await getCount(pool, "Sale_Pur_Main", `Ac_Id = ${Ac_Id} AND Bill_Date = '${Bill_Date}'`);

export const updateFreezeTime = async (Order_Freez_Time: string) => {
  await pool.request().input("Order_Freez_Time", Order_Freez_Time).query(`UPDATE SoftSet1 SET Order_Freez_Time = @Order_Freez_Time`);
};

export const getUnit = async () => {
  const result = await pool.request().query(`SELECT MIN(Uni_ID) as Uni_ID,Uni_Name FROM Uni_Mas WHERE Uni_ID <> 0 group by Uni_Name`);
  return result.recordset;
}
export const getFreezeTime = async () => {
  const result = await pool.request().query(`SELECT Order_Freez_Time FROM SoftSet1`);
  // return result.recordset[0].Order_Freez_Time;
  if (result.recordset.length === 0) {
    throw new Error("No freeze time found in the database.");
  }

  // Extract only the time part (HH:mm:ss)
  const freezeTime = result.recordset[0].Order_Freez_Time;

  // Format the time to HH:mm:ss without date (for simplicity)
  const formattedTime = freezeTime.toISOString().split('T')[1].split('.')[0]; // "16:00:00"

  return formattedTime;
};

export const addSalePurMain = async (
  mode: "add" | "edit",
  Ac_Id: number,
  Ac_Code: string,
  Order_Count: number,
  details: SalePurDetailRow[],
  Bill_Date: string,
  Our_Shop_Ac: number
) => {
  const transaction = pool.transaction();

  try {
    await transaction.begin();
    const sysTimeFormatted = new Date().toTimeString().slice(0, 8);
    const Total_Qty = parseFloat(details.reduce((acc, item) => acc + item.Inward, 0).toFixed(3));

    const Bill_No = await autoNumber(pool, "Sale_Pur_Main", "Bill_No", `Type = '${Type}' AND Book_Ac_Id = ${bookAcId} AND Branch_Id = ${branchId}`);
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
      .input("Total_Qty", sql.Real, Total_Qty)
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

    await insertSalePurDetail(transaction, mode, details, Ac_Id, Ac_Code, id, typeId, Order_Count, Bill_No, Bill_Date, Our_Shop_Ac);

    const Ac_Name = (await pool.request().input("Ac_Id", sql.Int, Ac_Id).query(`SELECT Ac_Name FROM Ac_Mas WHERE Id = @Ac_Id`)).recordset[0].Ac_Name;
    await sendNotification({
      noti: `You have received order ${Bill_No} from ${Ac_Name} ${Bill_Date}`,
      cat: "Order",
      userType: "User",
      Ac_Id: Ac_Id,
    });

    await transaction.commit();

  } catch (error: any) {
    await transaction.rollback();
  }
};

export const editSalePurMain = async (
  mode: "edit",
  Id: number,
  Ac_Id: number,
  Ac_Code: string,
  Order_Count: number,
  details: SalePurDetailRow[],
  Bill_Date: string,
  Our_Shop_Ac: number
) => {
  const transaction = pool.transaction();

  try {
    await transaction.begin();
    const sysTimeFormatted = new Date().toTimeString().slice(0, 8);
    const Total_Qty = parseFloat(details.reduce((acc, item) => acc + item.Inward, 0).toFixed(3));

    const fetchQuery = `
      SELECT Bill_No, Type_Id
      FROM Sale_Pur_Main
      WHERE Id = @Id
    `;

    const fetchResult = await transaction.request().input("Id", sql.Int, Id).query(fetchQuery);
    const { Bill_No, Type_Id: typeId } = fetchResult.recordset[0];

    const updateQuery = `
      UPDATE Sale_Pur_Main
      SET Sys_Date_Edit = @Sys_Date, Sys_Time_Edit = @Sys_Time, Total_Qty = @Total_Qty
      WHERE Id = @Id AND Ac_Id = @Ac_Id
    `;

    await transaction
      .request()
      .input("Sys_Date", sql.DateTime, Bill_Date)
      .input("Sys_Time", sql.VarChar(8), sysTimeFormatted)
      .input("Id", sql.Int, Id)
      .input("Ac_Id", sql.Int, Ac_Id)
      .input("Total_Qty", sql.Real, Total_Qty)
      .query(updateQuery);

    await insertSalePurDetail(transaction, mode, details, Ac_Id, Ac_Code, Id, typeId, Order_Count, Bill_No, Bill_Date, Our_Shop_Ac);
    const Ac_Name = (await pool.request().input("Ac_Id", sql.Int, Ac_Id).query(`SELECT Ac_Name FROM Ac_Mas WHERE Id = @Ac_Id`)).recordset[0].Ac_Name;
    await sendNotification({
      noti: `${Ac_Name} has updated Order ${Bill_No} ${Bill_Date}`,
      cat: "Order",
      userType: "User",
      Ac_Id: Ac_Id,
    });

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
      const { Itm_Id, Inward, Uni_ID, Itm_Name } = details[i];

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
        let mQty_Format = "###0";
        const mQty_1 = Inward.toFixed(3);
        const decimalPart = parseFloat(mQty_1) % 1;

        if (decimalPart > 0) {
          mQty_Format = "###0.000";
        }

        const formattedQty = mQty_Format === "###0.000" ? Inward.toFixed(3) : Inward.toFixed(0);

        if (typeof Uni_Name === "string") {
          const unit = Uni_Name.trim().toUpperCase();
          switch (unit) {
            case "PCS":
              dNo = `${formattedQty} Pcs`;
              break;
            case "BOX":
              dNo = `${formattedQty} Box`;
              break;
            default:
              dNo = `${formattedQty} ${Inward <= 0.999 ? "Gm" : "Kg"}`;
              break;
          }
        }
      }


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
    }

  } catch (error: any) {
    throw error.message;
  }
};

export const getOrderData = async ({ fromDate, toDate, Ac_Id, isAdmin, db_name, lang }: any) => {
  try {
    const DBName = process.env.DB_PREFIX + db_name;
    const pool = await getDbPool(DBName);

    let itemNameColumn = 'I.Itm_Name';
    let itemNameAlias = 'I.Itm_Name AS Itm_Name';
    let itemNameEnColumn = '';
    if (lang === 'hi') {
      itemNameColumn = 'I.Part_Name';
      itemNameAlias = 'I.Part_Name AS Itm_Name';
      itemNameEnColumn = ', I.Itm_Name AS Itm_Name_en';
    } else if (lang === 'gu') {
      itemNameColumn = 'I.Ex_Location';
      itemNameAlias = 'I.Ex_Location AS Itm_Name';
      itemNameEnColumn = ', I.Itm_Name AS Itm_Name_en';
    }

    const optimizedQuery = `
      SELECT 
        M.Bill_No,
        M.Bill_Date,
        M.LR_No,
        M.Id,
        M.Ac_Id,
        A.Ac_Name,
        A.Ac_Code,
        A.Our_Shop_Ac,
        D.SrNo,
        D.Itm_Id,
        ${itemNameAlias}
        ${itemNameEnColumn},
        D.Qty,
        D.Uni_ID,
        U.Uni_Name,
        IG.IGP_NAME
      FROM Sale_Pur_Main M
      JOIN Ac_Mas A ON M.Ac_Id = A.Id
      JOIN Sale_Pur_Detail D ON M.Bill_No = D.Bill_No
      LEFT JOIN Uni_Mas U ON D.Uni_ID = U.Uni_ID
      LEFT JOIN Itm_Mas I ON D.Itm_Id = I.Itm_ID
      LEFT JOIN Itm_Grp IG ON I.IGP_ID = IG.IGP_ID
      WHERE M.Bill_Date BETWEEN @FromDate AND @ToDate
      ${!isAdmin ? "AND M.Ac_Id = @Ac_Id" : ""}
      ORDER BY M.Bill_No DESC, D.SrNo
    `;

    const request = pool.request()
      .input("FromDate", sql.Date, fromDate)
      .input("ToDate", sql.Date, toDate);

    if (!isAdmin) {
      request.input("Ac_Id", sql.Int, Ac_Id);
    }

    const result = await request.query(optimizedQuery);
    const records = result.recordset;

    if (!records.length) {
      return [];
    }

    // Group by Bill_No
    const groupedData: any = {};
    for (const row of records) {
      if (!groupedData[row.Bill_No]) {
        groupedData[row.Bill_No] = {
          Id: row.Id,
          Ac_Code: row.Ac_Code,
          Ac_Name: row.Ac_Name,
          Ac_Id: row.Ac_Id,
          Our_Shop_Ac: row.Our_Shop_Ac,
          Bill_No: row.Bill_No,
          Bill_Date: row.Bill_Date,
          Order_Count: row.LR_No,
          Details: [],
        };
      }

      groupedData[row.Bill_No].Details.push({
        SrNo: row.SrNo,
        Itm_Id: row.Itm_Id,
        Itm_Name: row.Itm_Name,
        Qty: Number(row.Qty) % 1 === 0 ? Number(row.Qty) : Number(row.Qty).toFixed(3),
        Uni_ID: row.Uni_ID,
        Uni_Name: row.Uni_Name,
        IGP_NAME: row.IGP_NAME,
      });
    }

    const finalData = Object.values(groupedData);
    return finalData;
  } catch (error: any) {
    throw error.message;
  }
};

export const deleteOrder = async (Bill_No: number, Ac_Name: string) => {
  const transaction = pool.transaction();

  try {
    await transaction.begin();

    // Delete from Sale_Pur_Detail first (child table)
    const Ac_Id = (await pool.request().input("Bill_No", Bill_No).query("SELECT Ac_Id FROM Sale_Pur_Main WHERE Bill_No = @Bill_No")).recordset[0].Ac_Id;
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

    await sendNotification({
      noti: `${Ac_Name} has deleted Order ${Bill_No}`,
      cat: "Order",
      userType: "User",
      Ac_Id: Ac_Id,
    });


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

