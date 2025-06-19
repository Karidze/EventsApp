
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../config/supabase';
import { fetchUserProfile, clearProfile } from './profileSlice'; 

const initialState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};


export const initializeSession = createAsyncThunk(
  'auth/initializeSession',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Error fetching session in initializeSession:", sessionError);
        return rejectWithValue(sessionError.message);
      }
      if (session?.user) {
        dispatch(fetchUserProfile(session.user.id));
      } else {
        dispatch(clearProfile());
      }
      return session || null;
    } catch (err) {
      console.error("Unhandled error in initializeSession:", err);
      return rejectWithValue(err.message || 'Failed to initialize session. Please try again.'); // Переведено
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) {
        return rejectWithValue(authError.message);
      }
      if (!authData.user || !authData.session) {
        return rejectWithValue("Registration successful, but user or session data is missing."); // Можно перевести при желании
      }

      const newUser = authData.user;
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUser.id,
          email: newUser.email,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profileError) {
        console.error("Error creating user profile after registration:", profileError);
        return rejectWithValue("User registration successful, but profile creation failed: " + profileError.message); // Переведено
      }
      
      dispatch(fetchUserProfile(newUser.id));
      return authData.session;
    } catch (err) {
      console.error("Unhandled error in registerUser:", err);
      return rejectWithValue(err.message || 'Registration failed. Please try again.'); // Переведено
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        return rejectWithValue(authError.message);
      }
      if (!authData.user || !authData.session) {
        return rejectWithValue("Login successful, but user or session data is missing."); // Можно перевести при желании
      }

      const loggedInUser = authData.user;
      dispatch(fetchUserProfile(loggedInUser.id));
      return authData.session;
    } catch (err) {
      console.error("Unhandled error in loginUser:", err);
      return rejectWithValue(err.message || 'Login failed. Please check your credentials.'); // Переведено
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return rejectWithValue(error.message);
      }
      dispatch(clearProfile());
      return true;
    } catch (err) {
      console.error("Unhandled error in logoutUser:", err);
      return rejectWithValue(err.message || 'Logout failed. Please try again.'); // Переведено
    }
  }
);

// ================================================================
// SLICE
// ================================================================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    setSession: (state, action) => {
      state.session = action.payload;
      state.user = action.payload ? action.payload.user : null;
      state.isAuthenticated = !!action.payload;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.session = action.payload;
        state.user = action.payload ? action.payload.user : null;
        state.isAuthenticated = !!action.payload;
      })
      .addCase(initializeSession.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.session = null;
        state.isAuthenticated = false;
        state.error = action.payload || 'Failed to initialize session.'; // Переведено
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.session = action.payload;
        state.user = action.payload ? action.payload.user : null;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.session = null;
        state.isAuthenticated = false;
        state.error = action.payload || 'Registration failed.'; // Переведено
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.session = action.payload;
        state.user = action.payload ? action.payload.user : null;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.session = null;
        state.isAuthenticated = false;
        state.error = action.payload || 'Login failed.'; // Переведено
      })
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.session = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Logout failed.'; // Переведено
        state.user = null;
        state.session = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearAuthError, setSession } = authSlice.actions;
export default authSlice.reducer;