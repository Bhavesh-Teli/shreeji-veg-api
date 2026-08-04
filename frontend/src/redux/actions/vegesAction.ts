import { createAsyncThunk } from '@reduxjs/toolkit';
import { GetAllItems, GetFavorites } from '../../services/vegesAPI';

// Async thunk for fetching all vegetables
export const fetchAllVegetables = createAsyncThunk(
    'vegetables/fetchAll',
    async () => {
        const lang = localStorage.getItem('appLanguage') as 'en' | 'hi' | 'gu'
        const response = await GetAllItems(lang);
        return response.data;
    }
);

// Async thunk for fetching favorite vegetables
export const fetchFavoriteVegetables = createAsyncThunk(
    'vegetables/fetchFavorites',
    async (id: string) => {
        const lang = localStorage.getItem('appLanguage') as 'en' | 'hi' | 'gu'
        const response = await GetFavorites(lang, id);
        return response.data;
    }
);
