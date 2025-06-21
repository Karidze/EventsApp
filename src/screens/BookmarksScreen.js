import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
// Теперь импортируем updateBookmarkedEvent вместо removeBookmarkLocally
import { fetchBookmarkedEvents, updateBookmarkedEvent } from '../store/slices/eventsSlice';
import EventCard from '../components/EventCard';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { supabase } from '../config/supabase'; // Импортируем supabase для удаления из БД

const BookmarksScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const isFocused = useIsFocused(); // Хук для определения, находится ли экран в фокусе

  const { bookmarkedEvents, isBookmarksLoading, bookmarksError } = useSelector((state) => state.events);
  const { session } = useSelector((state) => state.auth);

  const userId = session?.user?.id;

  // Функция для загрузки закладок
  const loadBookmarks = () => {
    if (userId) {
      dispatch(fetchBookmarkedEvents(userId));
    }
  };

  // Загружаем закладки при фокусе на экране или при изменении user ID
  // Это также поможет обновить список, если пользователь удалил закладку на EventDetailScreen
  useEffect(() => {
    if (isFocused && userId) {
      loadBookmarks();
    }
  }, [isFocused, userId, dispatch]);

  // Обработка ошибок загрузки
  useEffect(() => {
    if (bookmarksError) {
      Alert.alert('Error Loading Bookmarks', bookmarksError);
    }
  }, [bookmarksError]);

  // Обработчик нажатия на событие в списке для перехода к деталям
  const handleEventPress = (event) => {
    navigation.navigate('EventDetail', { eventId: event.id });
  };

  // Обработчик для кнопки комментариев
  const handleCommentsPress = (event) => {
    navigation.navigate('Comments', { eventId: event.id, eventTitle: event.title });
  };

  // --- Функция для удаления события из избранного ---
  const handleRemoveBookmark = async (event) => {
    if (!userId) {
      Alert.alert('Login Required', 'You must be logged in to remove events from your favorites.');
      return;
    }

    Alert.alert(
      'Remove from Favorites',
      `Are you sure you want to remove "${event.title}" from your favorites?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Удаляем запись из таблицы user_bookmarks в Supabase
              const { error } = await supabase
                .from('user_bookmarks')
                .delete()
                .eq('user_id', userId)
                .eq('event_id', event.id);

              if (error) {
                throw error;
              }

              // 2. Диспатчим универсальный редьюсер для обновления состояния в Redux
              // Он удалит событие из bookmarkedEvents и обновит is_bookmarked в selectedEvent
              dispatch(updateBookmarkedEvent({ eventId: event.id, isBookmarked: false }));
              Alert.alert('Removed!', `"${event.title}" has been removed from your favorites.`);
            } catch (err) {
              Alert.alert('Error', `Failed to remove bookmark: ${err.message}`);
              console.error('Remove bookmark error:', err);
            }
          },
        },
      ]
    );
  };

  // Рендеринг каждой карточки события
  const renderEventCard = ({ item }) => (
    <EventCard
      event={item}
      onPress={handleEventPress}
      // Передаем handleRemoveBookmark для кнопки удаления
      onBookmarkToggle={() => handleRemoveBookmark(item)}
      isBookmarked={true} // Всегда true, так как это экран избранных
      onCommentsPress={handleCommentsPress}
      // Этот пропс сигнализирует EventCard, что он на экране закладок
      isBookmarksScreen={true}
    />
  );

  // Состояние загрузки, ошибки и пустой список
  if (!userId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Login Required</Text>
        <Text style={styles.subtitle}>Please log in to view your bookmarked events.</Text>
      </View>
    );
  }

  if (isBookmarksLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9933" />
        <Text style={styles.loadingText}>Loading your favorites...</Text>
      </View>
    );
  }

  if (bookmarkedEvents.length === 0 && !bookmarksError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No Bookmarked Events</Text>
        <Text style={styles.subtitle}>You haven't added any events to your favorites yet.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookmarks</Text>
      </View>
      <FlatList
        data={bookmarkedEvents}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isBookmarksLoading}
            onRefresh={loadBookmarks}
            tintColor="#FF9933"
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
    paddingBottom: 15,
    backgroundColor: '#FFF8F0',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  listContentContainer: {
    paddingBottom: 20,
  },
});

export default BookmarksScreen;