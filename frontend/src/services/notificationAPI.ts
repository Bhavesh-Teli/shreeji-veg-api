import axios from "axios";
import { API_END_POINT } from "../utils/constant";
import { getAuthHeaders } from "../utils/getAuthHeaders";

export const GetNotifaction = async () => {
    try {
        const res = await axios.get(`${API_END_POINT}/getNotification`, {
            headers: getAuthHeaders(),
        })
        return res.data
    } catch (error) {
        console.error('Error While getting the Notification:', error)
        throw error;
    }
}

export const MarkNotificationAsSeen = async () => {
    try {
        const res = await axios.put(`${API_END_POINT}/updateAllUnseenNotifications`, {}, {
            headers: getAuthHeaders(),
        })
        return res.data
    } catch (error) {
        console.error('Error While updating the Notification:', error)
        throw error;
    }
}

export const DeleteNotifications = async (Ids: number[]) => {
    try {
        const res = await axios.delete(`${API_END_POINT}/deleteNotification`, {
            headers: getAuthHeaders(),
            data: {Ids}
        })
        return res.data
    } catch (error) {
        console.error('Error While deleting the Notification:', error)
        throw error;
    }
}

export const DeleteAllNotifications = async () => {
    try {
        const res = await axios.delete(`${API_END_POINT}/deleteAllNotification`, {
            headers: getAuthHeaders(),
        })
        return res.data
    } catch (error) {
        console.error('Error While deleting the Notification:', error)
        throw error;
    }
}

