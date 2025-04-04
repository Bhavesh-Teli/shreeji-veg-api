import { pool } from "../config/dbConfig";

export const getAllItem = async () => {
  const existingItems = await pool
    .request()
    .query(`SELECT Itm_ID,Itm_Name,Sale_Rate FROM Itm_Mas`);
  return existingItems.recordset;
};

export const addFavorite = async (payload: any) => {
  const { userId, itemId } = payload;

  const existingFavorite = await pool
    .request()
    .input("userId", userId)
    .input("itemId", itemId)
    .query(`SELECT * FROM [Itm_User_Fav] WHERE Ac_Id = @userId AND Itm_Id = @itemId`);

  if (existingFavorite.recordset.length > 0) {
    throw new Error("Vegetable already in favorites");
  }

  await pool
    .request()
    .input("userId", userId)
    .input("itemId", itemId)
    .query(`INSERT INTO [Itm_User_Fav] (Ac_Id, Itm_Id) VALUES (@userId, @itemId)`);
};


export const getFavorite = async (payload: any) => {
  const { userId } = payload;

  const favorites = await pool
    .request()
    .input("userId", userId)
    .query(`
        SELECT UF.Id, UF.Ac_Id, UF.Itm_Id, 
             IM.Itm_Code, IM.Itm_Name, IM.Sale_Rate, IM.Pur_Rate
      FROM [Itm_User_Fav] UF
      JOIN [Itm_Mas] IM ON UF.Itm_Id = IM.Itm_ID
      WHERE UF.Ac_Id = @userId
    `);

  return favorites.recordset;
};

export const removeFavorite = async (payload: any) => {
  const { userId, itemId } = payload;

  const deleted = await pool
    .request()
    .input("userId", userId)
    .input("itemId", itemId)
    .query(`DELETE FROM [Itm_User_Fav] WHERE Ac_Id = @userId AND Itm_Id = @itemId`);

  return deleted.rowsAffected;
};
