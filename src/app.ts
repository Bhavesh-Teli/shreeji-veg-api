import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import http from "http";
import registerRoutes from "./routes/index";
import { connectDB } from "./config/dbConfig";

dotenv.config();

const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    // origin: process.env.CORS_ORIGIN,
    origin: '*',
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    // origin: process.env.CORS_ORIGIN,
    origin: '*',
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

registerRoutes(app);

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});


const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on Port ${PORT}`);
    });
  })
  .catch((error) => {
    throw error;
  });
