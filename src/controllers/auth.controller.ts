import { getLastIdFromCommonDB, insertIntoCommonDB, pool } from "../config/dbConfig";
import jwt from "jsonwebtoken";
import { IUser } from "../types/IUser";
import { SendWhatsappMessage } from "../utils/whatsappApi";
import { sendNotification } from "./notification.controller";

const OTP_EXPIRY = 5 * 60 * 1000;
const otpStorage = new Map<string, { otp: string; expiresAt: number }>();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();


export const requestOTP = async (mobileNo: string, Ac_Name: string) => {
  if (!mobileNo) throw new Error("Mobile number is required");
  const otp = generateOTP();
  otpStorage.set(mobileNo, { otp, expiresAt: Date.now() + OTP_EXPIRY });

  const Message = `Dear ${Ac_Name}, \n*${otp}* is your one time password (OTP). Please enter the OTP to proceed.\nThank you,\nTeam Shreeji Veg`;
  SendWhatsappMessage(mobileNo, Message);

  return { message: "OTP sent successfully" };
};

export const verifyOTPAndRegister = async (payload: IUser, enteredOTP: string) => {
  const { Ac_Name, Mobile_No, Book_Pass } = payload;

  if (!Ac_Name || !Mobile_No || !Book_Pass || !enteredOTP) throw new Error("All fields including OTP are required");

  const storedOTP = otpStorage.get(Mobile_No);
  if (!storedOTP || storedOTP.expiresAt < Date.now()) throw new Error("Expired OTP");
  if (storedOTP.otp !== enteredOTP) throw new Error("Invalid OTP");


  // Begin transaction for user registration
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
    await sendNotification({
      noti: `New user registered ${Ac_Name} ${Mobile_No}`,
      cat: "New User",
      userType: "User",
      Ac_Id: newId,
    });
    await transaction.commit();
    const welcomeMessage = `*Welcome to Shreeji Veg App*, Dear ${Ac_Name},\n\nYou have successfully created your account.\n\n*Username:* ${Mobile_No}\n*Password:* ${Book_Pass}\n\nPlease wait for login — your account is pending admin approval. You will receive a confirmation message once your account is activated.\n\nThank you,\n*Team Shreeji Veg *`;

    SendWhatsappMessage(Mobile_No, welcomeMessage);

    otpStorage.delete(Mobile_No);

    const { Book_Pass: _, ...userWithoutPassword } = payload;
    return { message: "User registered successfully", user: userWithoutPassword };
  } catch (error: any) {
    await transaction.rollback();
    throw new Error(error.message || "User registration failed");
  }
};

export const login = async (payload: IUser) => {
  const { Ac_Name, Book_Pass } = payload;
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  if (Ac_Name === process.env.ADMIN_NAME && Book_Pass === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ Ac_Id: "admin", role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    return {
      user: { Id: "admin", Ac_Name: process.env.ADMIN_NAME, isAdmin: true },
      token,
    };
  }

  try {
    const result = await pool
      .request()
      .input("Ac_Name", Ac_Name)
      .query(`SELECT Id, Ac_Name, Book_Pass, Ac_Code FROM Ac_Mas WHERE Ac_Name = @Ac_Name`);

    const user = result.recordset[0];

    if (!user || user.Book_Pass.trim() !== Book_Pass) throw new Error("Invalid account name or password");
    if (!user.Ac_Code) throw new Error("Account is not approved by admin");

    const token = jwt.sign({ Ac_Id: user.Id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    const { Book_Pass: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  } catch (error: any) {
    throw new Error(`Login failed: ${error.message}`);
  }
};

export const getCurrentUser = async (Ac_Id: string) => {
  if (Ac_Id === "admin") {
    return { Id: "admin", Ac_Name: process.env.ADMIN_NAME, isAdmin: true };
  }
  const result = await pool
    .request()
    .input("Id", Ac_Id)
    .query(`SELECT  Id, Ac_Name, Mobile_No,
        Main_Grp_Id, Sub_Grp_Id, Defa, Cancel_Bill_Ac,
        State_Name1, State_Code, Party_Type, Active, Cash_Party, Our_Shop_Ac FROM Ac_Mas WHERE Id = @Id`);
  return result.recordset[0];
}

