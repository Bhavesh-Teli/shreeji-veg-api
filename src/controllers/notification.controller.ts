import { io } from "../app";
import sql from "mssql";
import { getDbPool } from "../utils/dbPoolManager";

interface NotificationPayload {
    noti: string;
    cat: string;
    userType: string;
    Ac_Id: number;
}
export const sendNotification = async (payload: NotificationPayload) => {
    const { noti, cat, userType, Ac_Id } = payload;

    try {
        const dbName = process.env.DB_PREFIX + "ComMas";
        const pool = await getDbPool(dbName);

        await pool.request()
            .input("Noti", sql.NVarChar(sql.MAX), noti)
            .input("Cat", sql.NVarChar(20), cat)
            .input("User_Type", sql.NVarChar(15), userType)
            .input("Noti_Date_Time", sql.DateTime, new Date())
            .input("Seen", sql.Bit, 0)
            .input("Ac_Id", sql.Int, Ac_Id)
            .query(`
          INSERT INTO [dbo].[Noti_Hist]
          (Noti, Cat, User_Type, Noti_Date_Time, Seen, Ac_Id)
          VALUES (@Noti, @Cat, @User_Type, @Noti_Date_Time, @Seen, @Ac_Id)
        `);

        // Emit via Socket.IO
        const socketPayload = {
            noti,
            cat,
            userType,
            Ac_Id,
        };

        io.emit("OrderNotification", socketPayload);
    } catch (err) {
        console.error("Error sending order notification:", err);
    }
};