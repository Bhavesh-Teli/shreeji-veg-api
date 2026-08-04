import axios from "axios";
import { API_END_POINT } from "../utils/constant";
import { getAuthHeaders } from "../utils/getAuthHeaders";

export const GetLrNo = async (Bill_Date: string, Id: string) => {
    try {
        const res = await axios.post(`${API_END_POINT}/getLrNo`, { Bill_Date: Bill_Date, Ac_Id: Id }, {
            headers: getAuthHeaders(),
        })
        return res.data
    } catch (error) {
        console.error('Error While getting the LR No:', error)
        throw error;
    }
}

export const GetBillNo = async () => {
    try {
        const res = await axios.get(`${API_END_POINT}/getBillNo`, {
            headers: getAuthHeaders(),
        })
        return res.data
    } catch (error) {
        console.error('Error While getting the Bill No:', error)
        throw error;
    }
}

export const AddOrder = async (payload: any) => {
    try {
        const res = await axios.post(`${API_END_POINT}/addSalePurMain`, payload, {
            headers: getAuthHeaders(),
        });
        return res.data;
    } catch (error) {
        console.error("Error while adding order:", error);
        throw error;
    }
};

export const UpdateOrder = async (payload: any) => {
    try {
        const res = await axios.post(`${API_END_POINT}/editSalePurMain`, payload, {
            headers: getAuthHeaders(),
        });
        return res.data;
    } catch (error) {
        console.error("Error while Edting order:", error);
        throw error;
    }
};

export const GetOrder = async (payload: any) => {
    try {
        const res = await axios.get(`${API_END_POINT}/OrderData`, {
            headers: getAuthHeaders(),
            params: payload,
        });
        return res.data;
    } catch (error) {
        console.error("Error while Getting orders:", error);
        throw error;
    }
};


export const Deleteorder = async (id: string) => {
    try {
        const res = await axios.delete(`${API_END_POINT}/deleteOrder`, {
            headers: getAuthHeaders(),
            data: { Bill_No: id },
        });
        return res.data;
    } catch (error) {
        console.error('Error while Deleting Order:', error);
        throw error;
    }
}

export const GetAllYear = async () => {
    try {
        const res = await axios.get(`${API_END_POINT}/getAllYear`, {
            headers: getAuthHeaders(),
        });
        return res.data;
    } catch (error) {
        console.error("Error while Getting Year:", error);
        throw error;
    }
};

export const SendFreezeTime = async (time: string) => {
    try {
        const res = await axios.post(`${API_END_POINT}/updateFreezeTime`, { Order_Freez_Time: time }, {
            headers: getAuthHeaders(),
        });
        return res.data;
    } catch (error) {
        console.error("Error while Getting All Order:", error);
        throw error;
    }
};

export const GetFreezeTime = async () => {
    try {
        const res = await axios.get(`${API_END_POINT}/getFreezeTime`, {
            headers: getAuthHeaders(),
        });
        return res.data;
    } catch (error) {
        console.error("Error while Getting All Order:", error);
        throw error;
    }
};

export const GetUnits = async () => {
    try {
        const res = await axios.get(`${API_END_POINT}/getUnit`, {
            headers: getAuthHeaders(),
        });
        return res.data;
    } catch (error) {
        console.error("Error while Getting All Order:", error);
        throw error;
    }
};

