import axios from "axios";

export const SendWhatsappMessage = async (mobileNo: string, message: string) => {
  const token = process.env.WHATSAPP_API_KEY; // assuming token is stored here
  const phone = `91${mobileNo}`;
  const url = `https://enotify.app/api/sendText`;

  try {
    await axios.post(url, null, {
      params: {
        token,
        phone,
        message,
      },
    });

  } catch (error) {
    throw error;
  }
};
