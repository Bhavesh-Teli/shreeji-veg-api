import { createAsyncThunk } from "@reduxjs/toolkit";
import { GetOrder } from "../../services/orderAPI";

interface IDate {
    date?: string;
    fromDate: string;
    toDate: string;
    db_name?: string;
    lang?: 'en' | 'hi' | 'gu';
}


export const fetchOrders = createAsyncThunk("fetchOrders",
    async (payload: IDate) => {
        const lang = localStorage.getItem('appLanguage') as 'en' | 'hi' | 'gu'
        const res = await GetOrder({ ...payload, lang });
        return res.data;
    }
);