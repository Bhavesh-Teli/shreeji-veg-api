import { pool, sql } from "../config/dbConfig";

export const getUnapprovedUsers = async () => {
  try {
    const result = await pool.request().query(`SELECT * FROM Ac_Mas WHERE Ac_Code IS NULL`);

    return result.recordset; // Returns the list of unapproved users
  } catch (error:any) {
    throw new Error("Error fetching unapproved users: " + error.message);
  }
};

export const approveUser = async (payload: any) => {
  const { userId, approvalCode } = payload;
  const transaction = pool.transaction();
  try {
    await transaction.begin();

    const result = await transaction.request().input("userId", sql.Int, userId).input("approvalCode", sql.NVarChar, approvalCode).query(`
    UPDATE Ac_Mas 
    SET Ac_Code = @approvalCode 
    WHERE Id = @userId
  `);

    if (result.rowsAffected[0] === 0) {
      throw new Error("User not found or already approved.");
    }

    await transaction.commit();

    return { message: "User approved successfully", userId, approvalCode };
  } catch (error:any) {
    await transaction.rollback();
    throw new Error(error.message || "Something went wrong while approving the user.");
  }
};

export const rejectUser = async (payload: any) => {
  const { userId } = payload;
  // await prisma.ac_Mas.update({
  //     where: { Id: Number(userId) },
  //     data: { Ac_Code: null },
  // });
};
