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
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching categories:', err);
      return rejectWithValue(err.message || 'Failed to fetch categories');
    }
  }
);

export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async ({ searchQuery, selectedCategoryIds, city, date, minTime, maxTime, minPrice, maxPrice }, { rejectWithValue, getState }) => {
    try {
      let query = supabase
        .from('events')
        .select(`*, profiles(username, avatar_url), user_bookmarks!left(user_id, event_id), comments(count)`);

      if (searchQuery) {
        query = query.or(
          `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`
        );
      }

      if (selectedCategoryIds && selectedCategoryIds.length > 0) {
        query = query.overlaps('category_ids', selectedCategoryIds);
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

      query = query.gte('event_price', minPrice);
      query = query.lte('event_price', maxPrice);

      query = query.order('date', { ascending: true }).order('time', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      const userId = getState().auth.session?.user?.id;
      const allCategories = getState().events.allCategories;
      const categoryMap = new Map(allCategories.map(cat => [cat.id, cat.name]));

      const eventsWithStatus = data.map(event => ({
        ...event,
        is_bookmarked: event.user_bookmarks.some(bookmark => bookmark.user_id === userId),
        comments_count: event.comments[0]?.count || 0,
        category_names: event.category_ids
          ? event.category_ids.map(id => categoryMap.get(id)).filter(Boolean)
          : []
      }));

      return eventsWithStatus;
    } catch (err) {
      console.error('Error fetching events:', err);
      return rejectWithValue(err.message || 'Failed to fetch events');
    }
  }
);

export const fetchEventById = createAsyncThunk(
  'events/fetchEventById',
  async (eventId, { rejectWithValue, getState }) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`*, profiles(username, avatar_url), user_bookmarks!left(user_id, event_id), comments(count)`)
        .eq('id', eventId)
        .single();

      if (error) throw error;
      if (!data) return rejectWithValue('Event not found');

      const userId = getState().auth.session?.user?.id;
      const allCategories = getState().events.allCategories;
      const categoryMap = new Map(allCategories.map(cat => [cat.id, cat.name]));

      const eventWithStatus = {
        ...data,
        is_bookmarked: data.user_bookmarks.some(bookmark => bookmark.user_id === userId),
        comments_count: data.comments[0]?.count || 0,
        category_names: data.category_ids
          ? data.category_ids.map(id => categoryMap.get(id)).filter(Boolean)
          : []
      };

      return eventWithStatus;
    } catch (err) {
      console.error('Error fetching event by ID:', err);
      return rejectWithValue(err.message || 'Failed to fetch event details');
    }
  }
);

export const fetchBookmarkedEvents = createAsyncThunk(
  'events/fetchBookmarkedEvents',
  async (userId, { rejectWithValue, getState }) => {
    try {
      const { data, error } = await supabase
        .from('user_bookmarks')
        .select(`event_id, events(*, profiles(username, avatar_url), comments(count))`)
        .eq('user_id', userId);

      if (error) throw error;

      const allCategories = getState().events.allCategories;
      const categoryMap = new Map(allCategories.map(cat => [cat.id, cat.name]));

      const bookmarkedEvents = data.map((bookmark) => ({
        ...bookmark.events,
        is_bookmarked: true,
        comments_count: bookmark.events.comments[0]?.count || 0,
        category_names: bookmark.events.category_ids
          ? bookmark.events.category_ids.map(id => categoryMap.get(id)).filter(Boolean)
          : []
      }));

      return bookmarkedEvents;
    } catch (err) {
      console.error('Error fetching bookmarked events:', err);
      return rejectWithValue(err.message || 'Failed to fetch bookmarked events');
    }
  }
);

export const fetchUserCreatedEvents = createAsyncThunk(
  'events/fetchUserCreatedEvents',
  async (userId, { rejectWithValue, getState }) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`*, profiles(username, avatar_url), comments(count)`)
        .eq('organizer_id', userId);

      if (error) throw error;

      const allCategories = getState().events.allCategories;
      const categoryMap = new Map(allCategories.map(cat => [cat.id, cat.name]));

      const userCreatedEventsWithCount = data.map(event => ({
        ...event,
        is_bookmarked: false,
        comments_count: event.comments[0]?.count || 0,
        category_names: event.category_ids
          ? event.category_ids.map(id => categoryMap.get(id)).filter(Boolean)
          : []
      }));

      return userCreatedEventsWithCount;
    } catch (err) {
      console.error('Error fetching user created events:', err);
      return rejectWithValue(err.message || 'Failed to fetch user created events');
    }
  }
);

export const toggleBookmark = createAsyncThunk(
  'events/toggleBookmark',
  async ({ eventId, userId, isBookmarked }, { rejectWithValue, dispatch }) => {
    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('user_bookmarks')
          .delete()
          .eq('user_id', userId)
          .eq('event_id', eventId);
        if (error) throw error;
        dispatch(updateBookmarkedEvent({ eventId, isBookmarked: false }));
        return { eventId, isBookmarked: false };
      } else {
        const { error } = await supabase
          .from('user_bookmarks')
          .insert([{ user_id: userId, event_id: eventId }]);
        if (error) throw error;
        dispatch(updateBookmarkedEvent({ eventId, isBookmarked: true }));
        return { eventId, isBookmarked: true };
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
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

      state.events = state.events.map(event =>
        event.id === eventId ? { ...event, is_bookmarked: isBookmarked } : event
      );

      if (state.selectedEvent && state.selectedEvent.id === eventId) {
        state.selectedEvent.is_bookmarked = isBookmarked;
      }

      if (isBookmarked) {
        const eventToAdd = state.events.find(event => event.id === eventId) || state.selectedEvent;
        if (eventToAdd && !state.bookmarkedEvents.some(event => event.id === eventId)) {
            state.bookmarkedEvents.push({ ...eventToAdd, is_bookmarked: true });
        }
      } else {
        state.bookmarkedEvents = state.bookmarkedEvents.filter(event => event.id !== eventId);
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
        console.error('Error loading categories:', action.payload);
      })

      .addCase(fetchEventById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.selectedEvent = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch event details.';
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
        state.events = state.events.map(event => ({
            ...event,
            is_bookmarked: state.bookmarkedEvents.some(bookmarkedEvent => bookmarkedEvent.id === event.id)
        }));
      })
      .addCase(fetchBookmarkedEvents.rejected, (state, action) => {
        state.isBookmarksLoading = false;
        state.bookmarksError = action.payload || 'Failed to load bookmarked events.';
        state.bookmarkedEvents = [];
        if (state.selectedEvent) {
          state.selectedEvent.is_bookmarked = false;
        }
        state.events = state.events.map(event => ({
            ...event,
            is_bookmarked: false
        }));
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
      })

      .addCase(toggleBookmark.rejected, (state, action) => {
        console.error("Failed to toggle bookmark:", action.payload);
      });
  },
});

export const { clearEventsError, clearSelectedEvent, updateBookmarkedEvent } = eventsSlice.actions;
export default eventsSlice.reducer;