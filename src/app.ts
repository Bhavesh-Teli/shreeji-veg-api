import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import http from "http";
import registerRoutes from "./routes/index";
import { connectDB } from "./config/dbConfig";
import compression from "compression";


dotenv.config();
const ALLOWED_ORIGINS = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : [];

const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
});


app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  })
);

app.options('*', cors()); // Preflight support

app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(compression());
registerRoutes(app);

io.on("connection", (socket) => {
  socket.on("disconnect", () => {

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
