import { pool, sql } from "../config/dbConfig";
import { SendWhatsappMessage } from "../utils/whatsappApi";

export const getUnapprovedUsers = async () => {
  try {
    const query = `
      SELECT Id, Ac_Name, Mobile_No, Book_Pass,
        Main_Grp_Id, Sub_Grp_Id, Defa, Cancel_Bill_Ac,
        State_Name1, State_Code, Party_Type, Active, Cash_Party, Our_Shop_Ac
      FROM Ac_Mas 
      WHERE Ac_Code IS NULL`;

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
      .query("SELECT Mobile_No FROM Ac_Mas WHERE Id = @Ac_Id");

    const mobileNo = userResult.recordset[0]?.Mobile_No;

    if (!mobileNo) throw new Error("User not found.");

    const Message = `Your account has been approved by admin. Please login to use the app.`;
    SendWhatsappMessage(mobileNo, Message);

    await transaction.commit();

    return { message: "User approved successfully", Ac_Id, approvalCode };
  } catch (error: any) {
    await transaction.rollback();
    throw new Error(error.message || "Something went wrong while approving the user.");
  }
};

export const rejectUser = async (payload: any) => {
  const { Ac_Id } = payload;
  // await prisma.ac_Mas.update({
  //     where: { Id: Number(Ac_Id) },
  //     data: { Ac_Code: null },
  // });
};
