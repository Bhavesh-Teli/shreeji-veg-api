import axios from "axios";
import { API_END_POINT } from "../utils/constant";
import { ILogin } from "../types/ILogin";
import { getAuthHeaders } from "../utils/getAuthHeaders";

export const LoginApi = async (userData: ILogin) => {
    try {
        const res = await axios.post(`${API_END_POINT}/login`, userData, {
            headers: getAuthHeaders(),
        })
        return res.data
    } catch (error) {
        console.error('Error While Login:', error)
        throw error;
    }
}

export const RequestOTP = async ({mobileNo, Ac_Name}: {mobileNo: string, Ac_Name: string}) => {
    try {
        const res = await axios.post(`${API_END_POINT}/requestOTP`, { mobileNo, Ac_Name }, {
            headers: getAuthHeaders(),
        })
        return res.data
    } catch (error) {
        console.error('Error While Requesting the OTP:', error)
        throw error;
    }
}

export const RegisterApi = async (userData: any) => {
    try {
        const res = await axios.post(`${API_END_POINT}/register`, userData, {
            headers: getAuthHeaders(),
        })
        return res.data
    } catch (error) {
        console.error('Error While Login:', error)
        throw error;
    }
}

export const GetCurrentUser = async () => {
    try {
        const res = await axios.get(`${API_END_POINT}/getCurrentUser`, {
            headers: getAuthHeaders(),
        })
        return res.data
    } catch (error) {
        console.error('Error While Verifying:', error);
        throw error;
    }
}

export const LogoutApi = async () => {
    try {
        const res = await axios.post(`${API_END_POINT}/logout`, {}, {
            headers: getAuthHeaders(),
        })
        return res.data
    } catch (error) {
        console.error('Error While Logout:', error);
        throw error;
    }
}

export const ForgetPassword = async (userData: any) => {
    try {
        const res = await axios.post(`${API_END_POINT}/forgotPassword`, userData, {
            headers: getAuthHeaders(),
        })
        return res.data
    } catch (error) {
        console.error('Error While Password(Mobile) Otp sent:', error)
        throw error;
    }
}

export const ResetPassword = async (userData: any) => {
    try {
        const res = await axios.post(`${API_END_POINT}/resetPassword`, userData, {
            headers: getAuthHeaders(),
        })
        return res.data
    } catch (error) {
        console.error('Error While Password(Mobile) Otp sent:', error)
        throw error;
    }
}