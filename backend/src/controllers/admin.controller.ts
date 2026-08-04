import { pool, sql } from "../config/dbConfig";
import { SendWhatsappMessage } from "../utils/whatsappApi";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { COMPANY_CONFIG } from "../config/companyConfig";

export const getUnapprovedUsers = async () => {
  try {
    const query = `
      SELECT Id, Ac_Name, Mobile_No
      FROM Ac_Mas 
      WHERE Ac_Code IS NULL AND Id != 0`;

    const result = await pool.request().query(query);

    return result.recordset; // Returns the list of unapproved users
  } catch (error: any) {
    throw new Error("Error fetching unapproved users: " + error.message);
  }
};

export const approveUser = async (payload: any) => {
  const { Ac_Id, approvalCode } = payload;
  const transaction = pool.transaction();
  try {
    await transaction.begin();

    const result = await transaction
      .request()
      .input("Ac_Id", sql.Int, Ac_Id)
      .input("approvalCode", sql.NVarChar, approvalCode)
      .query("UPDATE Ac_Mas SET Ac_Code = @approvalCode WHERE Id = @Ac_Id");

    if (result.rowsAffected[0] === 0) throw new Error("User not found or already approved.");

    const userResult = await transaction
      .request()
      .input("Ac_Id", sql.Int, Ac_Id)
      .query("SELECT Mobile_No, Ac_Name FROM Ac_Mas WHERE Id = @Ac_Id");

    const mobileNo = userResult.recordset[0]?.Mobile_No;
    const Ac_Name = userResult.recordset[0]?.Ac_Name;

    if (!mobileNo) throw new Error("User not found.");

    const Message = `Hi ${Ac_Name},\n\nWe have approved your account as requested through *${COMPANY_CONFIG.appName}*.\n\nYou can now Login using your registered ID and password.\n\nThank you,\n*${COMPANY_CONFIG.teamName}*`;
    SendWhatsappMessage(mobileNo, Message);

    await transaction.commit();

    return { message: "User approved successfully", Ac_Id, approvalCode };
  } catch (error: any) {
    await transaction.rollback();
    throw new Error(error.message || "Something went wrong while approving the user.");
  }
};

export const getUserList = async () => {
  try {
    const query = `
      SELECT Id, Ac_Name, Mobile_No, Ac_Code,Book_Pass,Our_Shop_Ac
      FROM Ac_Mas 
      WHERE Id != 0 AND Grp_Id = 10 ORDER BY Ac_Name ASC`;

    const result = await pool.request().query(query);

    return result.recordset; // Returns the list of unapproved users
  } catch (error: any) {
    throw new Error("Error fetching unapproved users: " + error.message);
  }
};

export const uploadItemPhoto = async (Itm_Id: number, fileBuffer: Buffer) => {
  try {
    // 1. Find existing photo to delete it
    const fetchOldQuery = `SELECT Photo FROM Itm_Mas WHERE Itm_ID = @Itm_Id`;
    const oldResult = await pool.request().input("Itm_Id", sql.Int, Itm_Id).query(fetchOldQuery);

    if (oldResult.recordset.length > 0 && oldResult.recordset[0].Photo) {
      const oldPhotoUrl = oldResult.recordset[0].Photo;
      // Extract filename from URL (e.g. /vegetable-images/photo_123.webp)
      const oldFilename = oldPhotoUrl.split('/').pop();
      if (oldFilename) {
        const oldFilepath = path.join(process.cwd(), "public", "vegetable-images", oldFilename);
        if (fs.existsSync(oldFilepath)) {
          fs.unlinkSync(oldFilepath); // Delete the old file from disk
        }
      }
    }

    // 2. Fetch the Item Name to make the filename descriptive
    const itemNameQuery = `SELECT Itm_Name FROM Itm_Mas WHERE Itm_ID = @Itm_Id`;
    const nameResult = await pool.request().input("Itm_Id", sql.Int, Itm_Id).query(itemNameQuery);

    let sanitizedName = "photo";
    if (nameResult.recordset.length > 0 && nameResult.recordset[0].Itm_Name) {
      sanitizedName = nameResult.recordset[0].Itm_Name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    }

    // 3. Upload the new photo
    const filename = `${sanitizedName}_${Itm_Id}_${Date.now()}.webp`;
    const safeUploadsDir = path.join(process.cwd(), "public", "vegetable-images");

    if (!fs.existsSync(safeUploadsDir)) {
      fs.mkdirSync(safeUploadsDir, { recursive: true });
    }

    const filepath = path.join(safeUploadsDir, filename);

    // Compress and save image
    await sharp(fileBuffer)
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath);

    const relativeUrl = `/vegetable-images/${filename}`;

    // Update the database
    const query = `
      UPDATE Itm_Mas
      SET Photo = @PhotoUrl
      WHERE Itm_ID = @Itm_Id
    `;

    await pool.request()
      .input("PhotoUrl", sql.VarChar, relativeUrl)
      .input("Itm_Id", sql.Int, Itm_Id)
      .query(query);

    return relativeUrl;
  } catch (error: any) {
    throw new Error("Failed to upload image: " + error.message);
  }
};

export const deleteItemPhoto = async (Itm_Id: number) => {
  try {
    const fetchOldQuery = `SELECT Photo FROM Itm_Mas WHERE Itm_ID = @Itm_Id`;
    const oldResult = await pool.request().input("Itm_Id", sql.Int, Itm_Id).query(fetchOldQuery);

    if (oldResult.recordset.length > 0 && oldResult.recordset[0].Photo) {
      const oldPhotoUrl = oldResult.recordset[0].Photo;
      const oldFilename = oldPhotoUrl.split('/').pop();
      if (oldFilename) {
        const oldFilepath = path.join(process.cwd(), "public", "vegetable-images", oldFilename);
        if (fs.existsSync(oldFilepath)) {
          fs.unlinkSync(oldFilepath); // Delete the old file from disk
        }
      }
    }

    // Set Photo to NULL in the database
    const query = `
      UPDATE Itm_Mas
      SET Photo = NULL
      WHERE Itm_ID = @Itm_Id
    `;

    await pool.request()
      .input("Itm_Id", sql.Int, Itm_Id)
      .query(query);

    return true;
  } catch (error: any) {
    throw new Error("Failed to delete image: " + error.message);
  }
};