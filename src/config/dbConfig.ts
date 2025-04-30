import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

// Connection configurations for Shreeji Veg database
export const shreejiDbConfig = {
  user: process.env.SHREEJI_DB_USER || "",
  password: process.env.SHREEJI_DB_PASSWORD || "",
  server: process.env.SHREEJI_DB_SERVER || "",
  database: process.env.SHREEJI_DB_DATABASE || "",
  port: Number(process.env.SHREEJI_DB_PORT) || 1433,
  options: {
    encrypt: false, // Set true if using Azure
    trustServerCertificate: true,
  },
  requestTimeout: 60000, // 60 seconds
  connectionTimeout: 30000
};

// Connection configurations for Common Database
export const commonDbConfig = {
  user: process.env.COMMON_DB_USER || "",
  password: process.env.COMMON_DB_PASSWORD || "",
  server: process.env.COMMON_DB_SERVER || "",
  database: process.env.COMMON_DB_DATABASE || "",
  port: Number(process.env.COMMON_DB_PORT) || 1433,
  options: {
    encrypt: false, // Set true if using Azure
    trustServerCertificate: true,
  },
};

// Function to get a database connection
export const pool = new sql.ConnectionPool(shreejiDbConfig);
export const poolCommon = new sql.ConnectionPool(commonDbConfig);

export const connectDB = async () => {
  try {
    await pool.connect();
    console.log("Connected to ShreejiVegDB ✅");
  } catch (err) {
    console.error("Database Connection Failed ❌", err);
    process.exit(1);
  }
};

export const getLastIdFromCommonDB = async () => {
  const tempPool = await new sql.ConnectionPool(commonDbConfig).connect();
  try {
    const lastIdQuery = `SELECT TOP 1 Ac_Id FROM Ac_Mas ORDER BY Ac_Id DESC`;
    const lastIdResult = await tempPool.request().query(lastIdQuery);
    return lastIdResult.recordset[0]?.Ac_Id || 0;
  } finally {
    tempPool.close(); // Ensure connection is closed
  }
};

export const insertIntoCommonDB = async (newId: number) => {
  const tempPool = await new sql.ConnectionPool(commonDbConfig).connect();
  try {
    const insertCommonDbQuery = `
      UPDATE Ac_Mas
      SET Ac_Id = @Ac_Id
      WHERE Ac_Id = (SELECT TOP 1 Ac_Id FROM Ac_Mas ORDER BY Ac_Id DESC)
    `;
    await tempPool.request().input("Ac_Id", sql.Int, newId).query(insertCommonDbQuery);
  } finally {
    tempPool.close(); // Ensure connection is closed even if an error occurs
  }
};
export { sql };
