import { pool, sql } from "../config/dbConfig";
import { SendWhatsappMessage } from "../utils/whatsappApi";

export const getUnapprovedUsers = async () => {
  try {
    const query = `
      SELECT Id, Ac_Name, Mobile_No
      FROM Ac_Mas 
      WHERE Ac_Code IS NULL AND Id != 0`;

    const result = await pool.request().query(query);

    return result.recordset; // Returns the list of unapproved users
  } catch (error: any) {
    throw new Error("Error fetching unapproved users: " + error.message);
  }
};

export const approveUser = async (payload: any) => {
  const { Ac_Id, approvalCode } = payload;
  const transaction = pool.transaction();
  try {
    await transaction.begin();

    const result = await transaction
      .request()
      .input("Ac_Id", sql.Int, Ac_Id)
      .input("approvalCode", sql.NVarChar, approvalCode)
      .query("UPDATE Ac_Mas SET Ac_Code = @approvalCode WHERE Id = @Ac_Id");

    if (result.rowsAffected[0] === 0) throw new Error("User not found or already approved.");

    const userResult = await transaction
      .request()
      .input("Ac_Id", sql.Int, Ac_Id)
      .query("SELECT Mobile_No, Ac_Name FROM Ac_Mas WHERE Id = @Ac_Id");

    const mobileNo = userResult.recordset[0]?.Mobile_No;
    const Ac_Name = userResult.recordset[0]?.Ac_Name;

    if (!mobileNo) throw new Error("User not found.");

    const Message = `Hi ${Ac_Name},\n\nWe have approved your account as requested through *Shreeji Veg App*.\n\nYou can now Login using your registered ID and password.\n\nThank you,\n*Team Shreeji Veg*`;
    SendWhatsappMessage(mobileNo, Message);

    await transaction.commit();

    return { message: "User approved successfully", Ac_Id, approvalCode };
  } catch (error: any) {
    await transaction.rollback();
    throw new Error(error.message || "Something went wrong while approving the user.");
  }
};

export const getUserList = async () => {
  try {
    const query = `
      SELECT Id, Ac_Name, Mobile_No, Ac_Code,Book_Pass,Our_Shop_Ac
      FROM Ac_Mas 
      WHERE Id != 0 AND Grp_Id = 10 AND Defa=0 And Cancel_Bill_Ac=0 `;

    const result = await pool.request().query(query);

    return result.recordset; // Returns the list of unapproved users
  } catch (error: any) {
    throw new Error("Error fetching unapproved users: " + error.message);
  }
}

