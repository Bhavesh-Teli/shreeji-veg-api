import { exec } from "child_process";

export const SendWhatsappMessage = (mobileNo: string, message: string) => {
  // Escape message for shell
  const escapedMessage = message
    .replace(/"/g, '\\"')       // Escape double quotes
    .replace(/\n/g, '\\n');     // Preserve line breaks

  const cmd = `${process.env.EXEC_FILE_PATH} T N ${process.env.WHATSAPP_API_KEY} 91${mobileNo} "${escapedMessage}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      throw error;
      return;
    }
    if (stderr) {
      throw stderr;
      return;
    }
  });
};
