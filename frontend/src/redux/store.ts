import { configureStore } from '@reduxjs/toolkit';
import authReducer from "./slice/authSlice";
import vegetableReducer from "./slice/vegesSlice";
import orderReducer from "./slice/ordersSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        vegetables: vegetableReducer,
        orders: orderReducer,
    },
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;