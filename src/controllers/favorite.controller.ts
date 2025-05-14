import { pool } from "../config/dbConfig";

export const getAllItem = async (lang: 'en' | 'hi' | 'gu') => {
  let itemNameColumn = 'Itm_Mas.Itm_Name';
  if (lang === 'hi') {
    itemNameColumn = 'Itm_Mas.Part_Name';
  } else if (lang === 'gu') {
    itemNameColumn = 'Itm_Mas.Ex_Location';
  }
  const existingItems = await pool
    .request()
    .query(`SELECT 
            Itm_Mas.Itm_ID,
            ${itemNameColumn} AS Itm_Name,
            Itm_Mas.Sale_Rate,
            Itm_Mas.Uni_ID,
            Uni_Mas.Uni_Name,
            Itm_Grp.IGP_NAME
            FROM Itm_Mas
            JOIN Uni_Mas ON Itm_Mas.Uni_ID = Uni_Mas.Uni_ID
            JOIN Itm_Grp ON Itm_Mas.IGP_ID = Itm_Grp.IGP_ID
`);
  return existingItems.recordset;
};

export const addFavorite = async (payload: any) => {
  const { Ac_Id, Itm_Id,Sort_Index } = payload;

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
    .input("Sort_Index", Sort_Index)
    .query(`INSERT INTO [Itm_User_Fav] (Ac_Id, Itm_Id,Sort_Index) VALUES (@Ac_Id, @Itm_Id,@Sort_Index)`);
};

export const getFavorite = async (payload: any) => {
  const { Ac_Id, lang } = payload;
  let itemNameColumn = 'IM.Itm_Name';
  if (lang === 'hi') {
    itemNameColumn = 'IM.Part_Name';
  } else if (lang === 'gu') {
    itemNameColumn = 'IM.Ex_Location';
  }

  const favorites = await pool
    .request()
    .input("Ac_Id", Ac_Id)
    .query(`
        SELECT 
        UF.Id, 
        UF.Ac_Id, 
        UF.Itm_Id,
        IM.Itm_Code, 
        ${itemNameColumn} AS Itm_Name, 
        IM.Uni_ID,
        UM.Uni_Name,
        IG.IGP_NAME,
        UF.Sort_Index
      FROM [Itm_User_Fav] UF
      JOIN [Itm_Mas] IM ON UF.Itm_Id = IM.Itm_ID
      JOIN [Uni_Mas] UM ON IM.Uni_ID = UM.Uni_ID
      JOIN [Itm_Grp] IG ON IM.IGP_ID = IG.IGP_ID
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

