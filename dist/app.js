"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/app.ts
var import_express5 = __toESM(require("express"));
var import_dotenv2 = __toESM(require("dotenv"));
var import_cors = __toESM(require("cors"));
var import_morgan = __toESM(require("morgan"));
var import_cookie_parser = __toESM(require("cookie-parser"));

// src/routes/index.ts
var import_express4 = require("express");

// src/routes/auth.routes.ts
var import_express = require("express");

// src/config/dbConfig.ts
var import_mssql = __toESM(require("mssql"));
var import_dotenv = __toESM(require("dotenv"));
import_dotenv.default.config();
var shreejiDbConfig = {
  user: process.env.SHREEJI_DB_USER || "",
  password: process.env.SHREEJI_DB_PASSWORD || "",
  server: process.env.SHREEJI_DB_SERVER || "",
  database: process.env.SHREEJI_DB_DATABASE || "",
  port: Number(process.env.SHREEJI_DB_PORT) || 1433,
  options: {
    encrypt: false,
    // Set true if using Azure
    trustServerCertificate: true
  }
};
var commonDbConfig = {
  user: process.env.COMMON_DB_USER || "",
  password: process.env.COMMON_DB_PASSWORD || "",
  server: process.env.COMMON_DB_SERVER || "",
  database: process.env.COMMON_DB_DATABASE || "",
  port: Number(process.env.COMMON_DB_PORT) || 1433,
  options: {
    encrypt: false,
    // Set true if using Azure
    trustServerCertificate: true
  }
};
var pool = new import_mssql.default.ConnectionPool(shreejiDbConfig);
var poolCommon = new import_mssql.default.ConnectionPool(commonDbConfig);
var connectDB = async () => {
  try {
    await pool.connect();
    console.log("Connected to ShreejiVegDB \u2705");
  } catch (err) {
    console.error("Database Connection Failed \u274C", err);
    process.exit(1);
  }
};
var getLastIdFromCommonDB = async () => {
  const tempPool = await new import_mssql.default.ConnectionPool(commonDbConfig).connect();
  try {
    const lastIdQuery = `SELECT TOP 1 Id FROM Ac_Mas ORDER BY Id DESC`;
    const lastIdResult = await tempPool.request().query(lastIdQuery);
    return lastIdResult.recordset[0]?.Id || 0;
  } finally {
    tempPool.close();
  }
};
var insertIntoCommonDB = async (newId) => {
  const tempPool = await new import_mssql.default.ConnectionPool(commonDbConfig).connect();
  try {
    const insertCommonDbQuery = `
      INSERT INTO Ac_Mas (Id) VALUES (@id);
    `;
    await tempPool.request().input("id", import_mssql.default.Int, newId).query(insertCommonDbQuery);
  } finally {
    tempPool.close();
  }
};

// src/controllers/auth.controller.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var register = async (payload) => {
  const { Ac_Name, Mobile_No, Book_Pass } = payload;
  if (!Ac_Name || !Mobile_No || !Book_Pass) {
    throw new Error("Ac_Name, Mobile_No, and Book_Pass are required");
  }
  const transaction = pool.transaction();
  await transaction.begin();
  try {
    const exists = await transaction.request().input("Ac_Name", Ac_Name).input("Mobile_No", Mobile_No).query(`SELECT 1 FROM Ac_Mas WHERE Ac_Name = @Ac_Name OR Mobile_No = @Mobile_No`);
    if (exists.recordset.length > 0) {
      throw new Error("Ac_Name or Mobile_No already exists");
    }
    const newId = await getLastIdFromCommonDB() + 1;
    await transaction.request().input("Id", newId).input("Ac_Name", Ac_Name).input("Mobile_No", Mobile_No).input("Book_Pass", Book_Pass).input("Main_Grp_Id", 7).input("Sub_Grp_Id", 3).input("Defa", 0).input("Cancel_Bill_Ac", 0).input("State_Name1", "Gujarat").input("State_Code", "24").input("Party_Type", "Local").input("Active", 1).input("Cash_Party", 1).input("Our_Shop_Ac", 0).query(`
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
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message || "User registration failed");
  }
};
var login = async (payload) => {
  const { Ac_Name, Book_Pass } = payload;
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }
  try {
    if (Ac_Name === process.env.ADMIN_NAME && Book_Pass === process.env.ADMIN_PASSWORD) {
      const token2 = import_jsonwebtoken.default.sign({ userId: "admin", role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1d" });
      return {
        user: { Id: "admin", Ac_Name: process.env.ADMIN_NAME, isAdmin: true },
        token: token2
      };
    }
    const result = await pool.request().input("Ac_Name", Ac_Name).query(`SELECT Id, Ac_Name, Book_Pass, Ac_Code FROM Ac_Mas WHERE Ac_Name = @Ac_Name`);
    const user = result.recordset[0];
    if (!user || user.Book_Pass !== Book_Pass) {
      throw new Error("Invalid account name or password");
    }
    if (user.Ac_Code === null) {
      throw new Error("Account is not approved by admin");
    }
    const token = import_jsonwebtoken.default.sign({ userId: user.Id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    const { Book_Pass: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    throw new Error(`Login failed: ${error.message}`);
  }
};

// src/utils/responseHelper.ts
var successResponse = (res, data, message = "Success") => {
  res.status(200).json({ success: true, message, data });
};
var errorResponse = (res, message = "Something went wrong", status = 400) => {
  res.status(status).json({ success: false, message });
};

// src/routes/auth.routes.ts
var router = (0, import_express.Router)();
router.post("/register", async (req, res) => {
  try {
    const payload = req.body;
    const user = await register(payload);
    return successResponse(res, user, "User registered successfully");
  } catch (error) {
    return errorResponse(res, error.message);
  }
});
router.post("/login", async (req, res) => {
  try {
    const payload = req.body;
    const result = await login(payload);
    return successResponse(res, result, "Login successful.");
  } catch (error) {
    return errorResponse(res, error.message);
  }
});
var auth_routes_default = router;

// src/routes/favorite.routes.ts
var import_express2 = require("express");

// src/middleware/middleware.ts
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"));
var authVerify = async (req, res, next) => {
  try {
    const authHeaders = req.headers.authorization;
    if (!authHeaders || !authHeaders.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized user request" });
      return;
    }
    const token = authHeaders.split(" ")[1];
    if (!token) {
      res.status(401).send({ error: "Unauthorized user request" });
      return;
    }
    const decodedToken = import_jsonwebtoken2.default.verify(token, process.env.JWT_SECRET);
    if (decodedToken.userId === "admin") {
      req.user = { Id: "admin", Ac_Name: process.env.ADMIN_NAME, isAdmin: true };
      return next();
    }
    const result = await pool.request().input("userId", import_mssql.default.Int, decodedToken.userId).query("SELECT * FROM Ac_Mas WHERE Id = @userId");
    if (result.recordset.length === 0) {
      res.status(401).json({ error: "Invalid User Token" });
      return;
    }
    req.user = result.recordset[0];
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
var authorizeAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ message: "Access forbidden. Admins only." });
    return;
  }
  next();
};

// src/routes/favorite.routes.ts
var router2 = (0, import_express2.Router)();
router2.post("/addToFavorites", authVerify, async (req, res) => {
  try {
    const payload = {
      userId: req.user.id,
      ...req.body
    };
    const result = await (void 0)(payload);
    return successResponse(res, result, "Successfully add to favorite");
  } catch (error) {
    console.log(error);
    return errorResponse(res, error.message);
  }
});
router2.get("/getFavorites", authVerify, async (req, res) => {
  try {
    const payload = {
      userId: req.user.id
    };
    const result = await (void 0)(payload);
    return successResponse(res, result, "Fetched favorites successfully");
  } catch (error) {
    console.log(error);
    return errorResponse(res, error.message);
  }
});
router2.get("/deleteFavorites", authVerify, async (req, res) => {
  try {
    const payload = {
      userId: req.user.id,
      ...req.body
    };
    const result = await (void 0)(payload);
    return successResponse(res, result, "Removed from favorites");
  } catch (error) {
    console.log(error);
    return errorResponse(res, error.message);
  }
});
var favorite_routes_default = router2;

// src/routes/admin.routes.ts
var import_express3 = require("express");

// src/controllers/admin.controller.ts
var getUnapprovedUsers = async () => {
  try {
    const result = await pool.request().query(`SELECT * FROM Ac_Mas WHERE Ac_Code IS NULL`);
    return result.recordset;
  } catch (error) {
    throw new Error("Error fetching unapproved users: " + error.message);
  }
};
var approveUser = async (payload) => {
  const { userId, approvalCode } = payload;
  const transaction = pool.transaction();
  try {
    await transaction.begin();
    const result = await transaction.request().input("userId", import_mssql.default.Int, userId).input("approvalCode", import_mssql.default.NVarChar, approvalCode).query(`
    UPDATE Ac_Mas 
    SET Ac_Code = @approvalCode 
    WHERE Id = @userId
  `);
    if (result.rowsAffected[0] === 0) {
      throw new Error("User not found or already approved.");
    }
    await transaction.commit();
    return { message: "User approved successfully", userId, approvalCode };
  } catch (error) {
    await transaction.rollback();
    throw new Error(error.message || "Something went wrong while approving the user.");
  }
};
var rejectUser = async (payload) => {
  const { userId } = payload;
};

// src/routes/admin.routes.ts
var router3 = (0, import_express3.Router)();
router3.get("/getUnapprovedUsers", authVerify, authorizeAdmin, async (req, res) => {
  try {
    const users = await getUnapprovedUsers();
    return successResponse(res, users, "Unapproved users fetched successfully");
  } catch (error) {
    return errorResponse(res, error.message);
  }
});
router3.post("/approveUser", authVerify, authorizeAdmin, async (req, res) => {
  try {
    const payload = req.body;
    await approveUser(payload);
    return successResponse(res, "User approved successfully");
  } catch (error) {
    return errorResponse(res, error.message);
  }
});
router3.post("/rejectUser", async (req, res) => {
  try {
    const payload = req.body;
    await rejectUser(payload);
    return successResponse(res, "User rejected successfully");
  } catch (error) {
    return errorResponse(res, error.message);
  }
});
var admin_routes_default = router3;

// src/routes/index.ts
var registerRoutes = (app2) => {
  const router4 = (0, import_express4.Router)();
  router4.use(auth_routes_default);
  router4.use(favorite_routes_default);
  router4.use(admin_routes_default);
  router4.use("/*", (req, res) => {
    res.status(404).send("Not found");
  });
  app2.use("/api", router4);
};
var routes_default = registerRoutes;

// src/app.ts
var app = (0, import_express5.default)();
import_dotenv2.default.config();
app.use(
  (0, import_cors.default)({
    origin: process.env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(import_express5.default.json());
app.use((0, import_morgan.default)("dev"));
app.use((0, import_cookie_parser.default)());
routes_default(app);
var PORT = process.env.PORT || 5e3;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on Port ${PORT}`);
  });
}).catch((error) => {
  throw error;
});
