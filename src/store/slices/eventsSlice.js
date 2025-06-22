import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../config/supabase';

const initialState = {
  events: [],
  isLoading: false,
  error: null,
  allCategories: [],
  selectedEvent: null,
  bookmarkedEvents: [],
  isBookmarksLoading: false,
  bookmarksError: null,
  userCreatedEvents: [],
  isUserCreatedEventsLoading: false,
  userCreatedEventsError: null,
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
        return rejectWithValue(error.message);
      }
      return data;
    } catch (err) {
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
      minTime = null,
      maxTime = null,
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
          id,
          title,
          description,
          date,
          end_date,
          time,
          location,
          city,
          event_price,
          image_url,
          category_ids,
          profiles(
            username,
            avatar_url
          ),
          comments(count)
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
        return rejectWithValue(error.message);
      }

      const eventsWithCommentsCount = data.map(event => ({
        ...event,
        comments_count: event.comments ? event.comments[0].count : 0,
        comments: undefined
      }));

      return eventsWithCommentsCount;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchEventById = createAsyncThunk(
  'events/fetchEventById',
  async (eventId, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(
          `
          id,
          title,
          description,
          date,
          end_date,
          time,
          location,
          city,
          event_price,
          image_url,
          category_ids,
          profiles(
            username,
            avatar_url
          ),
          comments(count) 
          `
        )
        .eq('id', eventId)
        .single();

      if (error) {
        return rejectWithValue(error.message);
      }
      if (!data) {
        return rejectWithValue('Event not found.');
      }

      const eventWithCommentCount = {
        ...data,
        comments_count: data.comments ? data.comments[0].count : 0,
        comments: undefined
      };

      return eventWithCommentCount;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchBookmarkedEvents = createAsyncThunk(
  'events/fetchBookmarkedEvents',
  async (userId, { rejectWithValue }) => {
    try {
      const { data: bookmarkData, error: bookmarkError } = await supabase
        .from('user_bookmarks')
        .select('event_id')
        .eq('user_id', userId);

      if (bookmarkError) {
        return rejectWithValue(bookmarkError.message);
      }

      const eventIds = bookmarkData.map(bookmark => bookmark.event_id);

      if (eventIds.length === 0) {
        return [];
      }

      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(
          `
          id,
          title,
          description,
          date,
          end_date,
          time,
          location,
          city,
          event_price,
          image_url,
          category_ids,
          profiles(
            username,
            avatar_url
          ),
          comments(count)
          `
        )
        .in('id', eventIds)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (eventsError) {
        return rejectWithValue(eventsError.message);
      }

      const bookmarkedEventsWithCount = eventsData.map(event => ({
        ...event,
        is_bookmarked: true,
        imageUrl: event.image_url,
        comments_count: event.comments ? event.comments[0].count : 0,
        comments: undefined
      }));

      return bookmarkedEventsWithCount;

    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchUserCreatedEvents = createAsyncThunk(
  'events/fetchUserCreatedEvents',
  async (userId, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(
          `
          id,
          title,
          description,
          date,
          end_date,
          time,
          location,
          city,
          event_price,
          image_url,
          category_ids,
          profiles(
            username,
            avatar_url
          ),
          comments(count)
          `
        )
        .eq('organizer_id', userId)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        return rejectWithValue(error.message);
      }
      const userCreatedEventsWithCount = data.map(event => ({
        ...event,
        imageUrl: event.image_url,
        comments_count: event.comments ? event.comments[0].count : 0,
        comments: undefined
      }));

      return userCreatedEventsWithCount;
    } catch (err) {
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
    clearSelectedEvent: (state) => {
      state.selectedEvent = null;
    },
    updateBookmarkedEvent: (state, action) => {
      const { eventId, isBookmarked } = action.payload;

      if (isBookmarked) {
        const eventToAdd = state.events.find(event => event.id === eventId) || state.selectedEvent;
        if (eventToAdd && !state.bookmarkedEvents.some(event => event.id === eventId)) {
          state.bookmarkedEvents.push({ ...eventToAdd, is_bookmarked: true });
        }
      } else {
        state.bookmarkedEvents = state.bookmarkedEvents.filter(event => event.id !== eventId);
      }

      if (state.selectedEvent && state.selectedEvent.id === eventId) {
        state.selectedEvent.is_bookmarked = isBookmarked;
      }
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
        state.allCategories = [];
      })
      .addCase(fetchEventById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.selectedEvent = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.isLoading = false;
        const isBookmarked = state.bookmarkedEvents.some(
          (bookmarkedEvent) => bookmarkedEvent.id === action.payload.id
        );
        state.selectedEvent = {
          ...action.payload,
          imageUrl: action.payload.image_url,
          is_bookmarked: isBookmarked,
        };
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to load event details.';
        state.selectedEvent = null;
      })
      .addCase(fetchBookmarkedEvents.pending, (state) => {
        state.isBookmarksLoading = true;
        state.bookmarksError = null;
        state.bookmarkedEvents = [];
      })
      .addCase(fetchBookmarkedEvents.fulfilled, (state, action) => {
        state.isBookmarksLoading = false;
        state.bookmarkedEvents = action.payload;
        if (state.selectedEvent) {
          state.selectedEvent.is_bookmarked = state.bookmarkedEvents.some(
            (event) => event.id === state.selectedEvent.id
          );
        }
      })
      .addCase(fetchBookmarkedEvents.rejected, (state, action) => {
        state.isBookmarksLoading = false;
        state.bookmarksError = action.payload || 'Failed to load bookmarked events.';
        state.bookmarkedEvents = [];
        if (state.selectedEvent) {
          state.selectedEvent.is_bookmarked = false;
        }
      })
      .addCase(fetchUserCreatedEvents.pending, (state) => {
        state.isUserCreatedEventsLoading = true;
        state.userCreatedEventsError = null;
        state.userCreatedEvents = [];
      })
      .addCase(fetchUserCreatedEvents.fulfilled, (state, action) => {
        state.isUserCreatedEventsLoading = false;
        state.userCreatedEvents = action.payload;
      })
      .addCase(fetchUserCreatedEvents.rejected, (state, action) => {
        state.isUserCreatedEventsLoading = false;
        state.userCreatedEventsError = action.payload || 'Failed to load user created events.';
        state.userCreatedEvents = [];
      });
  },
});

export const { clearEventsError, clearSelectedEvent, updateBookmarkedEvent } = eventsSlice.actions;
export default eventsSlice.reducer;