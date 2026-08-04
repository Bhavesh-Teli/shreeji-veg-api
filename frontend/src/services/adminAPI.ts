import axios from "axios";
import { API_END_POINT } from "../utils/constant";
import { IApprove } from "../types/IApprove";
import { getAuthHeaders } from "../utils/getAuthHeaders";

export const ApproveUser = async (userData: IApprove) => {
    try {
        const res = await axios.post(`${API_END_POINT}/approveUser`, userData, {
            headers: getAuthHeaders(),
        })
        return res.data
    } catch (error) {
        console.error('Error While Approving:', error)
        throw error;
    }
}

export const getUsersToApprove = async () => {
    try {
        const res = await axios.get(`${API_END_POINT}/getUnapprovedUsers`, {
            headers: getAuthHeaders(),
        })
        return res.data
    } catch (error) {
        console.error('Error While Fetching unApprove user:', error)
        throw error;
    }
}

export const GetUsersList = async () => {
    try {
        const res = await axios.get(`${API_END_POINT}/getUserList`, {
            headers: getAuthHeaders(),
        })
        return res.data
    } catch (error) {
        console.error('Error While Fetching UserList user:', error)
        throw error;
    }
}

export const uploadItemPhoto = async (Itm_Id: number, file: File) => {
    try {
        const formData = new FormData();
        formData.append("photo", file);
        const res = await axios.post(`${API_END_POINT}/uploadItemPhoto/${Itm_Id}`, formData, {
            headers: {
                ...getAuthHeaders(),
                "Content-Type": "multipart/form-data"
            },
        });
        return res.data;
    } catch (error) {
        console.error('Error While Uploading Item Photo:', error);
        throw error;
    }
}

export const deleteItemPhoto = async (Itm_Id: number) => {
    try {
        const res = await axios.delete(`${API_END_POINT}/deleteItemPhoto/${Itm_Id}`, {
            headers: getAuthHeaders(),
        });
        return res.data;
    } catch (error) {
        console.error('Error While Deleting Item Photo:', error);
        throw error;
    }
}