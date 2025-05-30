import { io } from "../app";
import sql from "mssql";
import { getDbPool } from "../utils/dbPoolManager";

const dbName = process.env.DB_PREFIX + "ComMas";
export const sendNotification = async (payload: any) => {
    const { noti, cat, userType, Ac_Id } = payload;
    try {
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

        io.emit("Notification", socketPayload);
    } catch (err: any) {
        throw err.message;
    }
};

export const getNotification = async () => {
    try {
        const pool = await getDbPool(dbName);

        const result = await pool.request()
            .query(`
          SELECT 
            Noti_Hist.Id,
            Noti_Hist.Noti,
            Noti_Hist.Cat,
            Noti_Hist.User_Type,
            Noti_Hist.Noti_Date_Time,
            Noti_Hist.Seen,
            Noti_Hist.Ac_Id
          FROM [dbo].[Noti_Hist]
        `);
        return result.recordset;
    } catch (err: any) {
        throw err.message;
    }
};

export const updateNotification = async (Ac_Id: any) => {
    try {
        const pool = await getDbPool(dbName);

        await pool.request()
            .input("Ac_Id", sql.Int, Ac_Id)
            .query(`
          UPDATE [dbo].[Noti_Hist]
          SET Seen = 1
          WHERE Ac_Id = @Ac_Id
        `);
    } catch (err: any) {
        throw err.message;
    }
};
export const updateAllUnseenNotifications = async () => {
    try {
        const pool = await getDbPool(dbName);

        await pool.request()
            .query(`
                UPDATE [dbo].[Noti_Hist]
                SET Seen = 1
                WHERE Seen = 0
            `);
    } catch (err: any) {
        throw err.message;
    }
};

export const deleteNotification = async (Ids: any) => {
    try {    
        const pool = await getDbPool(dbName);

        const idList = Ids.join(","); // Converts [1,2,3] => "1,2,3"

        const result = await pool.request().query(`
            DELETE FROM [dbo].[Noti_Hist]
            WHERE Id IN (${idList})
        `);
        return result.recordset;
    } catch (err: any) {
        throw err.message;
    }
};
export const deleteAllNotification = async () => {
    try {
        const pool = await getDbPool(dbName);

        const result = await pool.request().query(`
            DELETE FROM [dbo].[Noti_Hist]
        `);
        return result.recordset;
    } catch (err: any) {
        throw err.message;
    }
};