import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../config/supabase';

const initialState = {
  events: [],
  isLoading: false,
  error: null,
  allCategories: [],
};

export const fetchAllCategories = createAsyncThunk(
  'events/fetchAllCategories',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
        return rejectWithValue(error.message);
      }
      return data;
    } catch (err) {
      console.error("Unhandled error in fetchAllCategories:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async (
    {
      searchQuery = '',
      selectedCategoryIds = [],
      city = '',
      date = null,
      minTime = null, // New: minimum time
      maxTime = null, // New: maximum time
      minPrice = 0,
      maxPrice = 1000,
    },
    { rejectWithValue }
  ) => {
    try {
      let query = supabase
        .from('events')
        .select(
          `
          *,
          profiles(
            username,
            avatar_url
          )
          `
        );

      if (selectedCategoryIds.length > 0) {
        query = query.overlaps('category_ids', selectedCategoryIds);
      }

      if (searchQuery) {
        const searchWords = searchQuery.trim().split(/\s+/).filter(Boolean);
        const searchConditions = searchWords.map(word => {
          const pattern = `%${word}%`;
          return `title.ilike.${pattern},description.ilike.${pattern},location.ilike.${pattern}`;
        }).join(',');

        if (searchConditions) {
          query = query.or(searchConditions);
        }
      }

      if (city) {
        query = query.ilike('city', `%${city}%`);
      }

      if (date) {
        query = query.eq('date', date);
      }

      // Time range filtering
      if (minTime) {
        query = query.gte('time', minTime);
      }
      if (maxTime) {
        query = query.lte('time', maxTime);
      }

      if (minPrice !== null && minPrice !== undefined) {
        query = query.gte('event_price', minPrice);
      }
      if (maxPrice !== null && maxPrice !== undefined) {
        query = query.lte('event_price', maxPrice);
      }

      query = query
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching events:", error);
        return rejectWithValue(error.message);
      }
      return data;
    } catch (err) {
      console.error("Unhandled error in fetchEvents:", err);
      return rejectWithValue(err.message);
    }
  }
);

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearEventsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch events.';
        state.events = [];
      })
      .addCase(fetchAllCategories.fulfilled, (state, action) => {
        state.allCategories = action.payload;
      })
      .addCase(fetchAllCategories.rejected, (state, action) => {
        console.error("Failed to load categories:", action.payload);
        state.allCategories = [];
      });
  },
});

export const { clearEventsError } = eventsSlice.actions;
export default eventsSlice.reducer;