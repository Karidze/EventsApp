import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../config/supabase';

const initialState = {
  events: [],
  isLoading: false,
  error: null,
  allCategories: [], 
};

// Асинхронный thunk для загрузки всех уникальных категорий из таблицы `categories`
export const fetchAllCategories = createAsyncThunk(
  'events/fetchAllCategories',
  async (_, { rejectWithValue }) => {
    try {
      // Запрашиваем ID и имя. parent_id может быть запрошен, но не используется для фильтрации,
      // если иерархии нет. Всегда лучше запросить то, что есть в таблице на случай будущих изменений
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, parent_id') // parent_id остается в запросе, даже если не используется в логике фильтрации
        .order('name', { ascending: true }); // cортируем по имени 

      if (error) {
        console.error("Error fetching categories from 'categories' table:", error);
        return rejectWithValue(error.message);
      }
      return data; // Вернет массив объектов { id, name, parent_id }
    } catch (err) {
      console.error("Unhandled error in fetchAllCategories:", err);
      return rejectWithValue(err.message);
    }
  }
);

// Thunk для загрузки событий, теперь с фильтрацией по ID категорий
export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async ({ searchQuery = '', selectedCategoryIds = [] }, { rejectWithValue, getState }) => {
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          profiles(
            username,
            avatar_url
          )
        `);

      // Логика фильтрации по категориям
      // Если parent_id не используется, то просто фильтруем по выбранным ID.
      if (selectedCategoryIds.length > 0) {
        const finalFilterIds = selectedCategoryIds;

        if (finalFilterIds.length > 0) {
             // Используем .overlaps (&&) для поиска событий,
             // чьи category_ids пересекаются с finalFilterIds.
             // Это означает, что событие будет показано, если оно принадлежит
             // хотя бы к одной из выбранных категорий.
            query = query.overlaps('category_ids', finalFilterIds);
        }
      }

      // Если есть поисковый запрос, применяем фильтрацию по тексту
      if (searchQuery) {
        const searchWords = searchQuery.trim().split(/\s+/).filter(Boolean);
        const searchConditions = searchWords.map(word => {
            const pattern = `%${word}%`;
            return `title.ilike.${pattern},description.ilike.${pattern},city.ilike.${pattern},location.ilike.${pattern}`;
        }).join(',');

        if (searchConditions) {
            query = query.or(searchConditions);
        }
      }

      // cортировка по дате и времени
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
      // Обработка thunk для загрузки всех категорий
      .addCase(fetchAllCategories.fulfilled, (state, action) => {
        state.allCategories = action.payload;
      })
      .addCase(fetchAllCategories.rejected, (state, action) => {
        console.error("Failed to load categories:", action.payload);
        state.allCategories = []; // В случае ошибки загрузки категорий, очищаем их
      });
  },
});

export const { clearEventsError } = eventsSlice.actions;
export default eventsSlice.reducer;