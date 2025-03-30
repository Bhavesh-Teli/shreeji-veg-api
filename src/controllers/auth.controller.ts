import { getLastIdFromCommonDB, insertIntoCommonDB, pool } from "../config/dbConfig";
import jwt from "jsonwebtoken";
import { IUser } from "../types/IUser";

export const register = async (payload: IUser) => {
  const { Ac_Name, Mobile_No, Book_Pass } = payload;

  if (!Ac_Name || !Mobile_No || !Book_Pass) {
    throw new Error("Ac_Name, Mobile_No, and Book_Pass are required");
  }

  const transaction = pool.transaction();
  await transaction.begin();

  try {
    const exists = await transaction
      .request()
      .input("Ac_Name", Ac_Name)
      .input("Mobile_No", Mobile_No)
      .query(`SELECT 1 FROM Ac_Mas WHERE Ac_Name = @Ac_Name OR Mobile_No = @Mobile_No`);

    if (exists.recordset.length > 0) {
      throw new Error("Ac_Name or Mobile_No already exists");
    }
    const newId = (await getLastIdFromCommonDB()) + 1;

    await transaction
      .request()
      .input("Id", newId)
      .input("Ac_Name", Ac_Name)
      .input("Mobile_No", Mobile_No)
      .input("Book_Pass", Book_Pass)
      .input("Main_Grp_Id", 7)
      .input("Sub_Grp_Id", 3)
      .input("Defa", 0)
      .input("Cancel_Bill_Ac", 0)
      .input("State_Name1", "Gujarat")
      .input("State_Code", "24")
      .input("Party_Type", "Local")
      .input("Active", 1)
      .input("Cash_Party", 1)
      .input("Our_Shop_Ac", 0).query(`
      INSERT INTO Ac_Mas (
        Id, Ac_Name, Mobile_No, Book_Pass,
        Main_Grp_Id, Sub_Grp_Id, Defa, Cancel_Bill_Ac,
        State_Name1, State_Code, Party_Type, Active, Cash_Party, Our_Shop_Ac
      ) VALUES (
        @Id, @Ac_Name, @Mobile_No, @Book_Pass,
        @Main_Grp_Id, @Sub_Grp_Id, @Defa, @Cancel_Bill_Ac,
        @State_Name1, @State_Code, @Party_Type, @Active, @Cash_Party, @Our_Shop_Ac
      )
    `);
    await insertIntoCommonDB(newId);
    await transaction.commit();
    const { Book_Pass: _, ...userWithoutPassword } = payload;
    return { message: "User created successfully", user: userWithoutPassword };
  } catch (error: any) {
    await transaction.rollback();
    throw new Error(error.message || "User registration failed");
  }
};

export const login = async (payload: IUser) => {
  const { Ac_Name, Book_Pass } = payload;

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }
  try {
    if (Ac_Name === process.env.ADMIN_NAME && Book_Pass === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ userId: "admin", role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1d" });
      return {
        user: { Id: "admin", Ac_Name: process.env.ADMIN_NAME, isAdmin: true },
        token,
      };
    }

    const result = await pool
      .request()
      .input("Ac_Name", Ac_Name)
      .query(`SELECT Id, Ac_Name, Book_Pass, Ac_Code FROM Ac_Mas WHERE Ac_Name = @Ac_Name`);

    const user = result.recordset[0];

    if (!user || user.Book_Pass !== Book_Pass) {
      throw new Error("Invalid account name or password");
    }

    if (user.Ac_Code === null) {
      throw new Error("Account is not approved by admin");
    }

    const token = jwt.sign({ userId: user.Id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    const { Book_Pass: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  } catch (error: any) {
    throw new Error(`Login failed: ${error.message}`);
  }
};
