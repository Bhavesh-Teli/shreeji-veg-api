import sql from "mssql";
import { baseDbConfig } from "../config/dbConfig"; // Import your base DB config

// Cache object to store pools per database
const dbPools: { [dbName: string]: sql.ConnectionPool } = {};

/**
 * Returns a SQL connection pool for the given database name.
 * If a pool already exists and is connected, reuses it.
 */
export const getDbPool = async (dbName: string): Promise<sql.ConnectionPool> => {
    if (dbPools[dbName]) {
        const existingPool = dbPools[dbName];
        if (existingPool.connected) {
            return existingPool;
        } else {
            try {
                await existingPool.connect();
                return existingPool;
            } catch (err) {
                const newPool = new sql.ConnectionPool({ ...baseDbConfig, database: dbName });
                dbPools[dbName] = newPool;
                await newPool.connect();
                return newPool;
            }
        }
    }

    const config = {
        ...baseDbConfig,
        database: dbName,
    };

    const newPool = new sql.ConnectionPool(config);
    dbPools[dbName] = newPool;
    await newPool.connect();
    return newPool;
};
