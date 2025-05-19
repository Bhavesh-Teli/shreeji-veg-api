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
  if (!Ac_Name) throw new Error("Account name is required");

  const mobileExists = await pool
    .request()
    .input("Mobile_No", mobileNo)
    .query(`SELECT 1 FROM Ac_Mas WHERE Mobile_No = @Mobile_No`);

  if (mobileExists.recordset.length > 0) {
    throw new Error("Mobile number is already registered");
  }

  // Check if Ac_Name exists
  const nameExists = await pool
    .request()
    .input("Ac_Name", Ac_Name)
    .query(`SELECT 1 FROM Ac_Mas WHERE Ac_Name = @Ac_Name`);

  if (nameExists.recordset.length > 0) {
    throw new Error("Account name is already taken");
  }

  const otp = generateOTP();
  otpStorage.set(mobileNo, { otp, expiresAt: Date.now() + OTP_EXPIRY });

  const Message = `Dear ${Ac_Name}, \n*${otp}* is your one time password (OTP). Please enter the OTP to proceed.\nThank you,\n*Team Shreeji Veg*`;
  SendWhatsappMessage(mobileNo, Message);

  return { message: "OTP sent successfully" };
};

export const verifyOTPAndRegister = async (payload: IUser, enteredOTP: string) => {
  const { Ac_Name, Mobile_No, Book_Pass } = payload;

  if (!Ac_Name || !Mobile_No || !Book_Pass || !enteredOTP) throw new Error("All fields including OTP are required");

  const storedOTP = otpStorage.get(Mobile_No);
  if (!storedOTP || storedOTP.expiresAt < Date.now()) {
    otpStorage.delete(Mobile_No);
    throw new Error("Expired OTP");
  }
  if (storedOTP.otp !== enteredOTP) throw new Error("Invalid OTP");


  // Begin transaction for user registration
  const transaction = await pool.transaction();
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
      .input("Area_Id", 0)
      .input("City_Id", 1)
      .input("Grp_Id", 10)
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
        Area_Id, City_Id, Grp_Id, Main_Grp_Id, Sub_Grp_Id, Defa, Cancel_Bill_Ac,
        State_Name1, State_Code, Party_Type, Active, Cash_Party, Our_Shop_Ac
      ) VALUES (
        @Id, @Ac_Name, @Mobile_No, @Book_Pass,
        @Area_Id, @City_Id, @Grp_Id, @Main_Grp_Id, @Sub_Grp_Id, @Defa, @Cancel_Bill_Ac,
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
    const welcomeMessage = `*Welcome to Shreeji Veg App*,\n\nDear ${Ac_Name},\nYou have successfully created your account.\n\n*Username:* ${Mobile_No}\n*Password:* ${Book_Pass}\n\nPlease wait for login — your account is pending admin approval. You will receive a confirmation message once your account is activated.\n\nThank you,\n*Team Shreeji Veg*`;
    SendWhatsappMessage(Mobile_No, welcomeMessage);
    const messageToAdmin = `🟢 *New User Registered* 🟢\n\n👤 *Name:* ${Ac_Name}\n📱 *Mobile:* ${Mobile_No}\n📍 *Status:* Pending Approval\n🔗 Approve User: ${process.env.APPROVR_URL}\n\nPlease review and approve if valid.\n*Team Shreeji Veg*`;

    const adminUsers = JSON.parse(process.env.ADMIN_USERS!);
    const admin2 = adminUsers.find((admin: any) => admin.Id === "admin2")!;
    SendWhatsappMessage(admin2.ADMIN_MOBILE_NO, messageToAdmin);
    otpStorage.delete(Mobile_No);

    const { Book_Pass: _, ...userWithoutPassword } = payload;
    return { message: "User registered successfully", user: userWithoutPassword };
  } catch (error) {
    await transaction.rollback();
    throw new Error((error as Error).message || "User registration failed");
  }
};

export const login = async (payload: IUser) => {
  const { Mobile_No, Book_Pass } = payload;
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");

  const adminUsers = JSON.parse(process.env.ADMIN_USERS!);

  const matchedAdmin = adminUsers.find(
    (user: any) => user.ADMIN_MOBILE_NO === Mobile_No && user.ADMIN_PASSWORD === Book_Pass
  );
  if (matchedAdmin) {
    const token = jwt.sign({ Ac_Id: matchedAdmin.Id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    return {
      user: { Id: matchedAdmin.Id, Ac_Name: matchedAdmin.ADMIN_NAME, isAdmin: true },
      token,
    };
  }

  try {
    const result = await pool
      .request()
      .input("Mobile_No", Mobile_No)
      .query(`SELECT Id, Ac_Name, Book_Pass, Ac_Code FROM Ac_Mas WHERE Mobile_No = @Mobile_No`);

    const user = result.recordset[0];

    if (!user || user.Book_Pass.trim() !== Book_Pass) throw new Error("Invalid mobile number or password");
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
  const adminUsers = JSON.parse(process.env.ADMIN_USERS!);
  const matchedAdmin = adminUsers.find((user: any) => user.Id === Ac_Id);
  if (matchedAdmin) {
    return { Id: matchedAdmin.Id, Ac_Name: matchedAdmin.ADMIN_NAME, isAdmin: true };
  }

  const result = await pool
    .request()
    .input("Id", Ac_Id)
    .query(`SELECT  Id, Ac_Name, Mobile_No, Ac_Code, Our_Shop_Ac
         FROM Ac_Mas WHERE Id = @Id`);
  return result.recordset[0];
}

export const forgotPassword = async (payload: IUser) => {
  const { Mobile_No } = payload;
  if (!Mobile_No) throw new Error("Mobile_No is required");

  const result = await pool
    .request()
    .input("Mobile_No", Mobile_No)
    .query(`SELECT Id, Ac_Name, Mobile_No FROM Ac_Mas WHERE Mobile_No = @Mobile_No`);

  const user = result.recordset[0];

  if (!user) throw new Error("User not found");

  const otp = generateOTP();
  otpStorage.set(Mobile_No, { otp, expiresAt: Date.now() + OTP_EXPIRY });

  const message = `Dear ${user.Ac_Name}, \n*${otp}* is your OTP to reset your password.\nDo not share this with anyone.\n*Team Shreeji Veg*`;
  SendWhatsappMessage(Mobile_No, message);
  return { message: "OTP sent successfully" };
}

export const resetPassword = async (Mobile_No: string, otp: string, newPassword: string) => {
  if (!Mobile_No || !otp || !newPassword) throw new Error("All fields are required");

  const storedOTP = otpStorage.get(Mobile_No);
  if (!storedOTP || storedOTP.expiresAt < Date.now()) throw new Error("Expired OTP");
  if (storedOTP.otp !== otp) throw new Error("Invalid OTP");

  await pool
    .request()
    .input("Mobile_No", Mobile_No)
    .input("Book_Pass", newPassword)
    .query(`UPDATE Ac_Mas SET Book_Pass = @Book_Pass WHERE Mobile_No = @Mobile_No`);

  otpStorage.delete(Mobile_No);

  return { message: "Password updated successfully" };
};