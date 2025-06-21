import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../config/supabase';
import * as FileSystem from 'expo-file-system';
import { decode as atob } from 'base-64';

const initialState = {
  profile: null,
  isLoading: false,
  error: null,
  uploadingAvatar: false,
  avatarUploadError: null,
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
        return rejectWithValue(error.message);
      }
      return data || null;
    } catch (err) {
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
        return rejectWithValue(error.message);
      }
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  'profile/uploadAvatar',
  async ({ userId, imageUri, fileType }, { rejectWithValue }) => {
    try {
      if (!userId || !imageUri || !fileType) {
        return rejectWithValue('User ID, image URI, and file type are required.');
      }

      const fileExtension = fileType.split('/')[1] || imageUri.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExtension}`; 

      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, bytes, {
          contentType: fileType,
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        return rejectWithValue(uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      let publicUrl = publicUrlData.publicUrl;

      if (!publicUrl) {
        return rejectWithValue('Could not get public URL for the uploaded avatar.');
      }

      publicUrl = `${publicUrl}?t=${Date.now()}`;

      const { data: updatedProfile, error: updateDbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)
        .select() 
        .single();

      if (updateDbError) {
        return rejectWithValue(updateDbError.message);
      }

      return updatedProfile; 
    } catch (err) {
      return rejectWithValue(err.message || "An unknown error occurred during avatar upload.");
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
    },
    clearAvatarUploadError: (state) => { 
      state.avatarUploadError = null;
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
      })
      .addCase(uploadAvatar.pending, (state) => {
        state.uploadingAvatar = true;
        state.avatarUploadError = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.uploadingAvatar = false;
        state.profile = action.payload; 
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.uploadingAvatar = false;
        state.avatarUploadError = action.payload || 'Failed to upload avatar.';
      });
  },
});

export const { clearProfile, clearProfileError, clearAvatarUploadError } = profileSlice.actions;
export default profileSlice.reducer;