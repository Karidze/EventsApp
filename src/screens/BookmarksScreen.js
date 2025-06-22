import React, { useEffect, useCallback } from 'react';
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
import {
  fetchBookmarkedEvents,
  updateBookmarkedEvent,
  fetchUserCreatedEvents,
} from '../store/slices/eventsSlice';
import EventCard from '../components/EventCard';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { supabase } from '../config/supabase';

const BookmarksScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const {
    bookmarkedEvents,
    isBookmarksLoading,
    bookmarksError,
    userCreatedEvents,
    isUserCreatedEventsLoading,
    userCreatedEventsError,
  } = useSelector((state) => state.events);
  const { session } = useSelector((state) => state.auth);

  const userId = session?.user?.id;

  const loadAllEvents = useCallback(() => {
    if (userId) {
      dispatch(fetchBookmarkedEvents(userId));
      dispatch(fetchUserCreatedEvents(userId));
    }
  }, [dispatch, userId]);

  useEffect(() => {
    if (isFocused && userId) {
      loadAllEvents();
    }
  }, [isFocused, userId, loadAllEvents]);

  useEffect(() => {
    if (bookmarksError) {
      Alert.alert('Error Loading Bookmarks', bookmarksError);
    }
    if (userCreatedEventsError) {
      Alert.alert('Error Loading Your Events', userCreatedEventsError);
    }
  }, [bookmarksError, userCreatedEventsError]);

  const handleEventPress = (event) => {
    navigation.navigate('EventDetail', { eventId: event.id });
  };

  const handleCommentsPress = (event) => {
    navigation.navigate('Comments', { eventId: event.id, eventTitle: event.title });
  };

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
              const { error } = await supabase
                .from('user_bookmarks')
                .delete()
                .eq('user_id', userId)
                .eq('event_id', event.id);

              if (error) {
                throw error;
              }

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

  const renderEventCard = ({ item, isUserCreated = false }) => (
    <EventCard
      event={item}
      onPress={handleEventPress}
      onBookmarkToggle={isUserCreated ? undefined : () => handleRemoveBookmark(item)}
      isBookmarked={!isUserCreated}
      onCommentsPress={handleCommentsPress}
      isBookmarksScreen={true}
      showBookmarkButton={!isUserCreated} // Hide bookmark button for user-created events
    />
  );

  const combinedData = [];
  if (bookmarkedEvents.length > 0) {
    combinedData.push({ type: 'header', title: 'My Bookmarks' });
    combinedData.push(...bookmarkedEvents.map(event => ({ ...event, itemType: 'bookmarked' })));
  }

  if (userCreatedEvents.length > 0) {
    if (combinedData.length > 0) {
      combinedData.push({ type: 'spacer' });
    }
    combinedData.push({ type: 'header', title: 'My Created Events' });
    combinedData.push(...userCreatedEvents.map(event => ({ ...event, itemType: 'created' })));
  }

  const renderItem = ({ item }) => {
    if (item.type === 'header') {
      return <Text style={styles.sectionHeader}>{item.title}</Text>;
    }
    if (item.type === 'spacer') {
      return <View style={styles.spacer} />;
    }
    return renderEventCard({ item, isUserCreated: item.itemType === 'created' });
  };

  if (!userId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Login Required</Text>
        <Text style={styles.subtitle}>Please log in to view your bookmarked and created events.</Text>
      </View>
    );
  }

  const isLoadingAnything = isBookmarksLoading || isUserCreatedEventsLoading;
  const noContent = bookmarkedEvents.length === 0 && userCreatedEvents.length === 0;

  if (isLoadingAnything && noContent) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9933" />
        <Text style={styles.loadingText}>Loading your events...</Text>
      </View>
    );
  }

  if (noContent && !isLoadingAnything && !bookmarksError && !userCreatedEventsError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No Events Found</Text>
        <Text style={styles.subtitle}>You haven't added any events to your favorites or created any events yet.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Events</Text>
      </View>
      <FlatList
        data={combinedData}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id ? item.id.toString() + item.itemType : item.type + index}
        contentContainerStyle={styles.listContentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingAnything}
            onRefresh={loadAllEvents}
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
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: '#FFF8F0',
  },
  spacer: {
    height: 30, 
  },
});

export default BookmarksScreen;