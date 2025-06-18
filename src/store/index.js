
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import profileReducer from './slices/profileSlice';
import eventsReducer from './slices/eventsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    events: eventsReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
});