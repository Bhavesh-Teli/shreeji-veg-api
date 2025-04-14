import { exec } from "child_process";

export const SendWhatsappMessage = (mobileNo:string,message:string) => {
    const cmd = `D:\\WhatsApp-enoify.app\\gsc-wapp.exe T N ${process.env.WHATSAPP_API_KEY} 91${mobileNo} "${message}"`;
    console.log(`Executing command: ${cmd}`); 
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        throw new Error(`Error sending WhatsApp message: ${error.message}`);
        return;
      }
      if (stderr) {
        throw new Error(`STDERR while sending WhatsApp message: ${stderr}`);
        return;
      }
      console.log(`OTP sent successfully: ${stdout}`);
    });
  };