import { exec } from "child_process";

export const SendWhatsappMessage = (mobileNo:string,message:string) => {
    const cmd = `D:\\WhatsApp-enoify.app\\gsc-wapp.exe T N ${process.env.WHATSAPP_API_KEY} 91${mobileNo} "${message}"`;
    console.log(`Executing command: ${cmd}`); 
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error sending OTP: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`STDERR: ${stderr}`);
        return;
      }
      console.log(`OTP sent successfully: ${stdout}`);
    });
  };