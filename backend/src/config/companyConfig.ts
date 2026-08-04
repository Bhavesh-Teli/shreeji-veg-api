import dotenv from "dotenv";
dotenv.config();

export const COMPANY_KEY = (process.env.COMPANY || "shreeji").toLowerCase();
export const isKarnavati = COMPANY_KEY === "karnavati";

export const COMPANY_CONFIG = isKarnavati
  ? {
      name: "Karnavati Agro Products",
      teamName: "Team Karnavati Agro Products",
      appName: "Karnavati Agro Products App",
      cookieName: "Karnavati_Agro",
    }
  : {
      name: "Shreeji Veg",
      teamName: "Team Shreeji Veg",
      appName: "Shreeji Veg App",
      cookieName: "Shreeji_Veg",
    };
