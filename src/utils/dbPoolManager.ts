import sql from "mssql";
import { baseDbConfig } from "../config/dbConfig"; // Import your base DB config

// Cache object to store pools per database
const dbPools: { [dbName: string]: sql.ConnectionPool } = {};

/**
 * Returns a SQL connection pool for the given database name.
 * If a pool already exists and is connected, reuses it.
 */
export const getDbPool = async (dbName: string): Promise<sql.ConnectionPool> => {
    console.log(`🔄 getDbPool called with dbName: ${dbName}`);

    if (dbPools[dbName]) {
        console.log(`ℹ️ Reusing existing pool for DB: ${dbName}`);
        const existingPool = dbPools[dbName];
        if (existingPool.connected) {
            console.log(`✅ Pool already connected for DB: ${dbName}`);
            return existingPool;
        } else {
            console.log(`⚠️ Pool exists but not connected. Attempting to reconnect: ${dbName}`);
            try {
                await existingPool.connect();
                console.log(`🔌 Reconnected existing pool for DB: ${dbName}`);
                return existingPool;
            } catch (err) {
                console.error(`❌ Error reconnecting pool for DB ${dbName}, recreating...`, err);
                const newPool = new sql.ConnectionPool({ ...baseDbConfig, database: dbName });
                dbPools[dbName] = newPool;
                await newPool.connect();
                console.log(`🆕 Created and connected new pool for DB: ${dbName}`);
                return newPool;
            }
        }
    }

    console.log(`🆕 Creating new pool for DB: ${dbName}`);
    const config = {
        ...baseDbConfig,
        database: dbName,
    };

    const newPool = new sql.ConnectionPool(config);
    dbPools[dbName] = newPool;
    await newPool.connect();
    console.log(`✅ New pool connected for DB: ${dbName}`);
    return newPool;
};
