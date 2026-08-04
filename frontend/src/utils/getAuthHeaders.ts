import Cookies from "js-cookie";
import { COMPANY_CONFIG } from "./companyConfig";

export const getAuthHeaders = () => {
    const token = Cookies.get(COMPANY_CONFIG.cookieName);
    return {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
    };
};
