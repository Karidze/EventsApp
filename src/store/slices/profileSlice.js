import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../config/supabase';

const initialState = {
  profile: null,
  isLoading: false,
  error: null,
};

export const fetchUserProfile = createAsyncThunk(
  'profile/fetchUserProfile',
  async (userId, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching user profile:", error);
        return rejectWithValue(error.message);
      }
      return data || null;
    } catch (err) {
      console.error("Unhandled error in fetchUserProfile:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'profile/updateUserProfile',
  async ({ userId, updates }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      if (error) {
        console.error("Error updating user profile:", error);
        return rejectWithValue(error.message);
      }
      return data;
    } catch (err) {
      console.error("Unhandled error in updateUserProfile:", err);
      return rejectWithValue(err.message);
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.profile = null;
    },
    clearProfileError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.profile = null;
        state.error = action.payload || 'Failed to fetch profile.';
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to update profile.';
      });
  },
});

export const { clearProfile, clearProfileError } = profileSlice.actions;
export default profileSlice.reducer;