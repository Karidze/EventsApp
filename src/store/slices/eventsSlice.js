import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../config/supabase';

const initialState = {
  events: [],
  isLoading: false,
  error: null,
  allCategories: [],
  selectedEvent: null, // Состояние для детальной страницы
  bookmarkedEvents: [], // Состояние для избранных событий
  isBookmarksLoading: false, // Состояние загрузки для избранных
  bookmarksError: null, // Ошибки для избранных
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
          time,
          location,
          city,
          event_price,
          image_url,
          category_ids,
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
          time,
          location,
          city,
          event_price,
          image_url,
          category_ids,
          profiles(
            username,
            avatar_url
          )
          `
        )
        .eq('id', eventId)
        .single();

      if (error) {
        console.error("Error fetching single event:", error);
        return rejectWithValue(error.message);
      }
      if (!data) {
          return rejectWithValue('Event not found.');
      }
      return data;
    } catch (err) {
      console.error("Unhandled error in fetchEventById:", err);
      return rejectWithValue(err.message);
    }
  }
);

// --- Асинхронная функция для загрузки избранных событий ---
export const fetchBookmarkedEvents = createAsyncThunk(
  'events/fetchBookmarkedEvents',
  async (userId, { rejectWithValue }) => {
    try {
      // Сначала получаем event_id из таблицы user_bookmarks для данного пользователя
      const { data: bookmarkData, error: bookmarkError } = await supabase
        .from('user_bookmarks')
        .select('event_id')
        .eq('user_id', userId);

      if (bookmarkError) {
        console.error("Error fetching bookmarks:", bookmarkError);
        return rejectWithValue(bookmarkError.message);
      }

      const eventIds = bookmarkData.map(bookmark => bookmark.event_id);

      if (eventIds.length === 0) {
        return []; // Если нет закладок, возвращаем пустой массив
      }

      // Затем получаем полные данные событий, используя полученные event_id
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(
          `
          id,
          title,
          description,
          date,
          time,
          location,
          city,
          event_price,
          image_url,
          category_ids,
          profiles(
            username,
            avatar_url
          )
          `
        )
        .in('id', eventIds) // Выбираем события, ID которых есть в списке eventIds
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (eventsError) {
        console.error("Error fetching bookmarked event details:", eventsError);
        return rejectWithValue(eventsError.message);
      }

      // Добавляем флаг is_bookmarked: true для всех этих событий
      return eventsData.map(event => ({ ...event, is_bookmarked: true, imageUrl: event.image_url }));

    } catch (err) {
      console.error("Unhandled error in fetchBookmarkedEvents:", err);
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
    // УНИВЕРСАЛЬНЫЙ РЕДЬЮСЕР для обновления состояния закладок
    // Он также будет обновлять is_bookmarked для selectedEvent
    updateBookmarkedEvent: (state, action) => {
      const { eventId, isBookmarked } = action.payload;

      // 1. Обновляем массив bookmarkedEvents
      if (isBookmarked) {
        // Добавляем событие в bookmarkedEvents, если его там еще нет
        const eventToAdd = state.events.find(event => event.id === eventId) || state.selectedEvent;
        if (eventToAdd && !state.bookmarkedEvents.some(event => event.id === eventId)) {
          state.bookmarkedEvents.push({ ...eventToAdd, is_bookmarked: true });
        }
      } else {
        // Удаляем событие из bookmarkedEvents
        state.bookmarkedEvents = state.bookmarkedEvents.filter(event => event.id !== eventId);
      }

      // 2. Обновляем selectedEvent, если это то же событие
      if (state.selectedEvent && state.selectedEvent.id === eventId) {
        state.selectedEvent.is_bookmarked = isBookmarked;
      }
    },
    // removeBookmarkLocally удален, так как updateBookmarkedEvent теперь универсален
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
      })
      .addCase(fetchEventById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.selectedEvent = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.isLoading = false;
        // При загрузке EventDetails, проверяем, является ли событие закладкой
        const isBookmarked = state.bookmarkedEvents.some(
          (bookmarkedEvent) => bookmarkedEvent.id === action.payload.id
        );
        state.selectedEvent = {
          ...action.payload,
          imageUrl: action.payload.image_url,
          is_bookmarked: isBookmarked, // Устанавливаем флаг закладки
        };
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to load event details.';
        state.selectedEvent = null;
      })
      // --- ОБРАБОТЧИКИ ДЛЯ fetchBookmarkedEvents ---
      .addCase(fetchBookmarkedEvents.pending, (state) => {
        state.isBookmarksLoading = true;
        state.bookmarksError = null;
        state.bookmarkedEvents = []; // Очищаем перед загрузкой, чтобы избежать дубликатов
      })
      .addCase(fetchBookmarkedEvents.fulfilled, (state, action) => {
        state.isBookmarksLoading = false;
        state.bookmarkedEvents = action.payload; // Записываем избранные события
        // Если selectedEvent открыт, обновляем его статус закладки
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
        // При ошибке загрузки закладок, сбрасываем статус закладки для selectedEvent
        if (state.selectedEvent) {
          state.selectedEvent.is_bookmarked = false;
        }
      });
  },
});

// Экспортируем updateBookmarkedEvent (removeBookmarkLocally удален)
export const { clearEventsError, clearSelectedEvent, updateBookmarkedEvent } = eventsSlice.actions;
export default eventsSlice.reducer;