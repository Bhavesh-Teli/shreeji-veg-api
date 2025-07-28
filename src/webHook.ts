import crypto from "crypto";
import { exec } from "child_process";
import { Express } from "express";
import bodyParser from "body-parser";
import { SendWhatsappMessage } from "./utils/whatsappApi";

const SECRET = process.env.GITHUB_WEBHOOK_SECRET as string;
const DEPLOY_MOBILE_NO = process.env.DEPLOY_MOBILE_NO as string;
if (!SECRET) throw new Error("Missing GITHUB_WEBHOOK_SECRET");

const FRONTEND_DIR = "D:\\SHREEJI-VEG\\SHREEJI-VEG-JS";
const BACKEND_DIR = "D:\\SHREEJI-VEG\\SHREEJI-VEG-API";
const PM2_NAME = "shreeji-veg-api";

// Middleware to parse raw body for HMAC verification
const jsonWithRaw = bodyParser.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  },
});

const isValidSignature = (req: any) => {
  const signature = req.headers["x-hub-signature-256"];
  const digest = `sha256=${crypto
    .createHmac("sha256", SECRET)
    .update(req.rawBody)
    .digest("hex")}`;
  return signature === digest;
};

const runCommand = (cmd: string, source: string) => {
  exec(cmd, async (err, stdout, stderr) => {
    const msg = err
      ? `❌ ${source} Deployment Failed:\n${stderr}`
      : `✅ ${source} Deployment Success:\n${stdout}`;
    console.log(msg);
    await SendWhatsappMessage(DEPLOY_MOBILE_NO, msg);
  });
};

export default function webhookRoutes(app: Express) {
  app.post("/webhook-frontend", jsonWithRaw, (req: any, res: any) => {
    if (!isValidSignature(req)) return res.status(401).json({ message: "Invalid signature" });

    SendWhatsappMessage(DEPLOY_MOBILE_NO, "⚙️ Frontend webhook triggered");

    const cmd = `
      cd /d "${FRONTEND_DIR}" && git pull && npm install && npm run build &&
      cd /d "${BACKEND_DIR}" && pm2 restart ${PM2_NAME}
    `.replace(/\s+/g, " ");

    runCommand(cmd, "Frontend");
    return res.status(200).json({ message: "Webhook received successfully" });
  });

  app.post("/webhook-backend", jsonWithRaw, (req: any, res: any) => {
    console.log("Webhook received successfully");
    if (!isValidSignature(req)){
      console.log("Invalid signature");
      return res.status(401).json({ message: "Invalid signature" });
    }
    console.log("Valid signature");
    SendWhatsappMessage(DEPLOY_MOBILE_NO, "⚙️ Backend webhook triggered");

    const cmd = `
      cd /d "${BACKEND_DIR}" && git pull && npm install && npm run build && pm2 restart ${PM2_NAME}
    `.replace(/\s+/g, " ");

    runCommand(cmd, "Backend");
    return res.status(200).json({ message: "Webhook received successfully" });
  });
}
