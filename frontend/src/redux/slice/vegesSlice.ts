import { createSlice } from "@reduxjs/toolkit";
import { fetchAllVegetables, fetchFavoriteVegetables } from "../actions/vegesAction";

interface Vegetable {
    Itm_ID?: number;
    Itm_Id?: number;
    Itm_Name: string;
    Sale_Rate: number;
    Uni_ID?: number;
    Uni_Name?: string;
    Itm_Code?: string;
    Sort_Index?: number;
    Itm_Name_en?: string;
    Photo?: string | null;
    IGP_NAME?: string;
}

interface VegetablesState {
    all: Vegetable[];
    favorites: Vegetable[];
    loading: boolean;
    error: string | null;
}

const initialState: VegetablesState = {
    all: [],
    favorites: [],
    loading: false,
    error: null,
};


const vegetableSlice = createSlice({
    name: 'vegetables',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // All vegetables
            .addCase(fetchAllVegetables.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllVegetables.fulfilled, (state, action) => {
                state.loading = false;
                state.all = action.payload;
            })
            .addCase(fetchAllVegetables.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string | null;
            })

            // Favorite vegetables
            .addCase(fetchFavoriteVegetables.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFavoriteVegetables.fulfilled, (state, action) => {
                state.loading = false;
                state.favorites = action.payload;
            })
            .addCase(fetchFavoriteVegetables.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string | null;
            });
    },
});

export type { Vegetable, VegetablesState };
export default vegetableSlice.reducer;