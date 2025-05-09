import { sql, baseDbConfig } from "../config/dbConfig";

export const getCurrentYearDbNameFromComMass = async (): Promise<string> => {
    const ComMassConfig = { ...baseDbConfig, database: process.env.DB_PREFIX + "ComMas" };
    const tempPool = new sql.ConnectionPool(ComMassConfig);
    try {
        await tempPool.connect();

        const result = await tempPool.request().query(`
            SELECT DB_Name
            FROM CoAcYr
            WHERE Year_Type = 'C'
        `);

        const dbName = result.recordset[0]?.DB_Name?.replace(/\.mdf$/i, "");

        if (!dbName) throw new Error("DB_Name not found for Year_Type = 'C'");

        return dbName;
    } catch (err: any) {
        throw err.message;
    } finally {
        tempPool.close();
    }
};
interface YearRange {
    year1: number;
    year2: number;
    year_type: string;
}

export const getAllYearRangesFromComMass = async (): Promise<YearRange[]> => {
    const ComMassConfig = { ...baseDbConfig, database: process.env.DB_PREFIX + "ComMas" };
    const tempPool = new sql.ConnectionPool(ComMassConfig);
    try {
        await tempPool.connect();

        const result = await tempPool.request().query(`
            SELECT Year1, Year2, Year_Type, DB_Name
            FROM CoAcYr
        `);

        return result.recordset.map((row) => ({
            year1: row.Year1,
            year2: row.Year2,
            year_type: row.Year_Type,
            db_name: row.DB_Name?.replace(/\.mdf$/i, "")
        }));
    } catch (err: any) {
        throw err.message;
    } finally {
        tempPool.close();
    }
};
