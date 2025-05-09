import { ConnectionPool } from "mssql";


// Function to get the next auto-number

export const autoNumber = async (
  pool: ConnectionPool,
  tableName: string,
  fieldName: string,
  mSQL: string = ''
): Promise<number> => {
  const condition = mSQL ? `WHERE ${mSQL}` : '';
  const query = `SELECT MAX(ISNULL(${fieldName}, 0)) AS LastNo FROM ${tableName} ${condition}`;

  try {
    const result = await pool.request().query(query);
    return (result.recordset[0]?.LastNo ?? 0) + 1;
  } catch (error: any) {
    throw error.message;
  }
};

// Function to get count and increment it
export const getCount = async (
  pool: ConnectionPool,
  tableName: string,
  mSQL: string = ''
): Promise<number> => {
  const condition = mSQL ? `WHERE ${mSQL}` : '';
  const query = `SELECT COUNT(*) AS TotalCount FROM ${tableName} ${condition}`;

  try {
    const result = await pool.request().query(query);
    return (result.recordset[0]?.TotalCount ?? 0) + 1;
  } catch (error: any) {
    throw error.message;
  }
};


export const findRecReturn = async (
  pool: ConnectionPool,
  tableName: string,
  selectField: string,
  whereCondition?: string
): Promise<string | boolean> => {
  let query = `SELECT ${selectField} FROM ${tableName}`;
  if (whereCondition && whereCondition.trim() !== '') {
    query += ` WHERE ${whereCondition}`;
  }

  try {
    const result = await pool.request().query(query);
    const rows = result.recordset;

    if (rows && rows.length > 0) {
      const value = rows[0][selectField]; // Access the first row and field
      if (value === null || value === undefined) {
        return false; // Return false if the value is null or undefined
      }
      return String(value).trim(); // Trim the result and return as string
    } else {
      return false; // No rows found, return false
    }
  } catch (error: any) {
    throw error.message;
  }
};