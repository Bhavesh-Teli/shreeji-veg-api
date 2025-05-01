import { pool } from "../config/dbConfig";

export const getAllItem = async () => {
  const existingItems = await pool
    .request()
    .query(`SELECT 
            Itm_Mas.Itm_ID,
            Itm_Mas.Itm_Name,
            Itm_Mas.Sale_Rate,
            Itm_Mas.Uni_ID,
            Uni_Mas.Uni_Name
            FROM Itm_Mas JOIN Uni_Mas ON Itm_Mas.Uni_ID = Uni_Mas.Uni_ID
`);
  return existingItems.recordset;
};

export const addFavorite = async (payload: any) => {
  const { Ac_Id, Itm_Id } = payload;

  const existingFavorite = await pool
    .request()
    .input("Ac_Id", Ac_Id)
    .input("Itm_Id", Itm_Id)
    .query(`SELECT * FROM [Itm_User_Fav] WHERE Ac_Id = @Ac_Id AND Itm_Id = @Itm_Id`);

  if (existingFavorite.recordset.length > 0) {
    throw new Error("Vegetable already in favorites");
  }

  await pool
    .request()
    .input("Ac_Id", Ac_Id)
    .input("Itm_Id", Itm_Id)
    .query(`INSERT INTO [Itm_User_Fav] (Ac_Id, Itm_Id) VALUES (@Ac_Id, @Itm_Id)`);
};


export const getFavorite = async (payload: any) => {
  const { Ac_Id } = payload;

  const favorites = await pool
    .request()
    .input("Ac_Id", Ac_Id)
    .query(`
        SELECT 
        UF.Id, 
        UF.Ac_Id, 
        UF.Itm_Id, 
        IM.Itm_Code, 
        IM.Itm_Name, 
        IM.Sale_Rate, 
        IM.Pur_Rate,
        IM.Uni_ID,
        UM.Uni_Name
      FROM [Itm_User_Fav] UF
      JOIN [Itm_Mas] IM ON UF.Itm_Id = IM.Itm_ID
      JOIN [Uni_Mas] UM ON IM.Uni_ID = UM.Uni_ID
      WHERE UF.Ac_Id = @Ac_Id
    `);

  return favorites.recordset;
};

export const removeFavorite = async (payload: any) => {
  const { Ac_Id, Itm_Id } = payload;

  const deleted = await pool
    .request()
    .input("Ac_Id", Ac_Id)
    .input("Itm_Id", Itm_Id)
    .query(`DELETE FROM [Itm_User_Fav] WHERE Ac_Id = @Ac_Id AND Itm_Id = @Itm_Id`);

  return deleted.rowsAffected;
};
