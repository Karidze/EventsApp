import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Image,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchEventById,
  clearEventsError,
  fetchAllCategories,
  clearSelectedEvent,
  updateBookmarkedEvent, // Импортируем универсальный редьюсер
  fetchBookmarkedEvents // Возможно, потребуется для синхронизации, если пользователь НЕ переключал вкладки
} from '../store/slices/eventsSlice';
import moment from 'moment';
import { supabase } from '../config/supabase';

const EventDetailScreen = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { eventId } = route.params;

  const { selectedEvent, isLoading, error, allCategories, bookmarkedEvents } = useSelector((state) => state.events);
  const { session } = useSelector((state) => state.auth);

  // Теперь состояние isBookmarked берется напрямую из selectedEvent, который обновляется Redux'ом
  // const [isBookmarked, setIsBookmarked] = useState(false); // Удаляем локальное состояние

  useEffect(() => {
    if (allCategories.length === 0) {
      dispatch(fetchAllCategories());
    }
    if (eventId) {
      dispatch(fetchEventById(eventId));
    }
    return () => {
      dispatch(clearSelectedEvent());
    };
  }, [dispatch, eventId, allCategories.length]);

  // Этот useEffect заменяет логику checkIfBookmarked и синхронизирует is_bookmarked
  // selectedEvent.is_bookmarked уже устанавливается в fetchEventById.fulfilled
  // и обновляется updateBookmarkedEvent.
  // Тем не менее, можно добавить этот для дополнительной надежности, если bookmarkedEvents
  // обновятся не из этого экрана (например, при переходе с BookmarksScreen)
  useEffect(() => {
    if (selectedEvent && bookmarkedEvents) {
      const isBookmarkedInReduxList = bookmarkedEvents.some(
        (bEvent) => bEvent.id === selectedEvent.id
      );
      // Если текущий статус в selectedEvent отличается от того, что в списке закладок,
      // обновим selectedEvent через updateBookmarkedEvent.
      // Это покроет сценарий, когда пользователь удалил закладку на BookmarksScreen
      // и потом вернулся на EventDetailScreen этого события.
      if (selectedEvent.is_bookmarked !== isBookmarkedInReduxList) {
        dispatch(updateBookmarkedEvent({ eventId: selectedEvent.id, isBookmarked: isBookmarkedInReduxList }));
      }
    }
  }, [selectedEvent, bookmarkedEvents, dispatch]);


  useEffect(() => {
    if (error) {
      Alert.alert('Error Loading Event', error);
      dispatch(clearEventsError());
    }
  }, [error, dispatch]);

  const handleOpenComments = () => {
    if (selectedEvent) {
      navigation.navigate('Comments', { eventId: selectedEvent.id, eventTitle: selectedEvent.title });
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleBookmarkToggle = async () => {
    if (!session?.user?.id) {
      Alert.alert('Login Required', 'Please log in to add events to your favorites.');
      return;
    }

    if (!selectedEvent?.id) {
      Alert.alert('Error', 'Event details not available.');
      return;
    }

    // Берем текущий статус закладки из selectedEvent в Redux
    const currentBookmarkedStatus = selectedEvent.is_bookmarked;

    try {
      if (currentBookmarkedStatus) {
        // Удалить из закладок
        const { error: deleteError } = await supabase
          .from('user_bookmarks')
          .delete()
          .eq('user_id', session.user.id)
          .eq('event_id', selectedEvent.id);

        if (deleteError) {
          throw deleteError;
        }
        Alert.alert('Removed from Favorites', `'${selectedEvent.title}' has been removed from your favorites.`);
      } else {
        // Добавить в закладки
        const { error: insertError } = await supabase
          .from('user_bookmarks')
          .insert([
            { user_id: session.user.id, event_id: selectedEvent.id }
          ]);

        if (insertError) {
          throw insertError;
        }
        Alert.alert('Added to Favorites', `'${selectedEvent.title}' has been added to your favorites!`);
      }
      // Диспатчим универсальный редьюсер, который обновит selectedEvent.is_bookmarked
      // и массив bookmarkedEvents в Redux
      dispatch(updateBookmarkedEvent({ eventId: selectedEvent.id, isBookmarked: !currentBookmarkedStatus }));

    } catch (err) {
      Alert.alert('Error', `Failed to update favorites: ${err.message}`);
      console.error('Bookmark toggle error:', err);
    }
  };

  const handleOpenLink = (url) => {
    if (url) {
      Linking.openURL(url).catch((err) =>
        Alert.alert('Error', `Failed to open link: ${url}\n${err.message}`)
      );
    } else {
      Alert.alert('No Link', 'No external link provided for this event.');
    }
  };

  if (isLoading || (!selectedEvent && !error)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9933" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  if (error || !selectedEvent) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#FF6347" />
        <Text style={styles.errorText}>
          {error || 'Failed to load event details. Please try again.'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => dispatch(fetchEventById(eventId))}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    title,
    description,
    date,
    time,
    location,
    event_price,
    imageUrl,
    // externalLink, // <--- Убедитесь, что externalLink не деструктурируется, если его нет в данных
    category_ids,
    profiles,
    is_bookmarked, // <--- Берем из Redux!
  } = selectedEvent;

  const organizerName = profiles?.username || 'Unknown organizer';

  const displayCategories = allCategories
    .filter((cat) => category_ids?.includes(cat.id))
    .map((cat) => cat.name)
    .join(', ');

  const formatDateTime = (eventDate, eventTime) => {
    if (!eventDate) return 'Date not specified';

    const d = new Date(eventDate);
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = d.toLocaleDateString(undefined, dateOptions);

    // Проверяем, есть ли время и корректно ли оно отформатировано
    let formattedTime = eventTime;
    if (eventTime && eventTime.match(/^\d{2}:\d{2}(:\d{2})?$/)) { // Простая проверка HH:mm или HH:mm:ss
      formattedTime = eventTime.substring(0, 5); // Обрезаем до HH:mm
    } else {
      formattedTime = 'Time not specified';
    }

    return `${formattedDate} at ${formattedTime}`;
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />

      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Details</Text>
          <TouchableOpacity onPress={handleBookmarkToggle} style={styles.bookmarkIcon}>
            <Ionicons
              name={is_bookmarked ? 'bookmark' : 'bookmark-outline'} // Используем is_bookmarked из Redux
              size={28}
              color={is_bookmarked ? '#FF9933' : '#333'} // Используем is_bookmarked из Redux
            />
          </TouchableOpacity>
        </View>

        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.eventImage} resizeMode="cover" />
        )}

        <View style={styles.contentContainer}>
          <Text style={styles.eventTitle}>{title}</Text>
          {displayCategories.length > 0 && (
            <Text style={styles.eventCategory}>
              <Ionicons name="pricetag-outline" size={16} color="#666" /> {displayCategories}
            </Text>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color="#555" />
            <Text style={styles.detailText}>{formatDateTime(date, time)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color="#555" />
            <Text style={styles.detailText}>{location || 'Location not specified'}</Text>
          </View>

          {organizerName && (
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={20} color="#555" />
              <Text style={styles.detailText}>Organized by: {organizerName}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="wallet-outline" size={20} color="#555" />
            <Text style={styles.detailText}>Price: {event_price > 0 ? `${event_price.toFixed(2)} UAH` : 'Free'}</Text>
          </View>

          {description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionHeader}>Description</Text>
              <Text style={styles.descriptionText}>{description}</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleOpenComments}>
              <Ionicons name="chatbubbles-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>View Comments</Text>
            </TouchableOpacity>
          </View>

          {/* Условно рендерим кнопку внешнего линка, если externalLink существует */}
          {selectedEvent.externalLink && ( // Используем selectedEvent.externalLink
            <TouchableOpacity style={styles.externalLinkButton} onPress={() => handleOpenLink(selectedEvent.externalLink)}>
              <Ionicons name="link-outline" size={20} color="#FF9933" />
              <Text style={styles.externalLinkButtonText}>Learn More / Register</Text>
              <Ionicons name="open-outline" size={18} color="#FF9933" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    paddingTop: 0,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
    paddingBottom: 15,
    backgroundColor: '#FFF8F0',
    borderBottomWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  backButton: {
    paddingRight: 10,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  bookmarkIcon: {
    marginLeft: 'auto',
    paddingLeft: 10,
    zIndex: 1,
  },
  eventImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#eee',
  },
  contentContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 30,
  },
  eventTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  eventCategory: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 10,
  },
  descriptionSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 30,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#FF9933',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  externalLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FF9933',
    borderRadius: 10,
    backgroundColor: '#FFF8F0',
    marginTop: 10,
  },
  externalLinkButtonText: {
    color: '#FF9933',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF6347',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF9933',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventDetailScreen;