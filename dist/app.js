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
var import_config = require("dotenv/config");
var import_cors = __toESM(require("cors"));
var import_morgan = __toESM(require("morgan"));
var import_cookie_parser = __toESM(require("cookie-parser"));

// src/routes/index.ts
var import_express4 = require("express");

// src/routes/auth.routes.ts
var import_express = require("express");

// src/prisma/client.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient();
var client_default = prisma;

// src/controllers/auth.controller.ts
var import_bcrypt = __toESM(require("bcrypt"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var register = async (payload) => {
  const { accountName, phone, password } = payload;
  if (!accountName || !phone || !password) {
    throw new Error("Phone, accountName, and password are required");
  }
  const existingUser = await client_default.user.findFirst({
    where: {
      OR: [{ phone }, { accountName }]
    }
  });
  if (existingUser) {
    throw new Error("User with this phone or account name already exists");
  }
  const hashedPassword = await import_bcrypt.default.hash(password, 10);
  const user = await client_default.user.create({
    data: { accountName, phone, password: hashedPassword, approvalCode: null }
  });
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
var login = async (payload) => {
  const { accountName, password } = payload;
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  const user = await client_default.user.findFirst({
    where: { accountName }
  });
  if (!user) throw new Error("Invalid account name or password");
  if (user.approvalCode === null) throw new Error("Account is not approved by admin");
  const isPasswordValid = await import_bcrypt.default.compare(password, user.password);
  if (!isPasswordValid) throw new Error("Invalid password");
  const token = import_jsonwebtoken.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
  const { password: _, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    token
  };
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

// src/controllers/favorite.controller.ts
var addFavorite = async (payload) => {
  const { userId, vegetableId } = payload;
  const existingFavorite = await client_default.userFavorites.findFirst({
    where: { userId, vegetableId: Number(vegetableId) }
  });
  if (existingFavorite) {
    throw new Error("Vegetable already in favorites");
  }
  const favorite = await client_default.userFavorites.create({
    data: {
      userId,
      vegetableId: Number(vegetableId)
    }
  });
  return favorite;
};
var getFavorite = async (payload) => {
  const { userId } = payload;
  const favorites = await client_default.userFavorites.findMany({
    where: { userId: Number(userId) },
    include: { vegetable: true }
  });
  return favorites;
};
var removeFavorite = async (payload) => {
  const { userId, vegetableId } = payload;
  const deleted = await client_default.userFavorites.deleteMany({
    where: {
      userId: Number(userId),
      vegetableId: Number(vegetableId)
    }
  });
  return deleted;
};

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
    const user = await client_default.user.findUnique({ where: { id: decodedToken.userId } });
    if (!user) {
      res.status(401).send({ error: "Invalid User Token" });
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// src/routes/favorite.routes.ts
var router2 = (0, import_express2.Router)();
router2.post("/addToFavorites", authVerify, async (req, res) => {
  try {
    const payload = {
      userId: req.user.id,
      ...req.body
    };
    const result = await addFavorite(payload);
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
    const result = await getFavorite(payload);
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
    const result = await removeFavorite(payload);
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
  const users = await client_default.user.findMany({
    where: { approvalCode: null }
  });
  return users;
};
var approveUser = async (payload) => {
  const { userId, approvalCode } = payload;
  await client_default.user.update({
    where: { id: Number(userId) },
    data: { approvalCode }
  });
};
var rejectUser = async (payload) => {
  const { userId } = payload;
  await client_default.user.update({
    where: { id: Number(userId) },
    data: { approvalCode: null }
  });
};

// src/routes/admin.routes.ts
var router3 = (0, import_express3.Router)();
router3.get("/getUnapprovedUsers", async (req, res) => {
  try {
    const users = await getUnapprovedUsers();
    return successResponse(res, users, "Unapproved users fetched successfully");
  } catch (error) {
    return errorResponse(res, error.message);
  }
});
router3.post("/approveUser", async (req, res) => {
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
var server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
