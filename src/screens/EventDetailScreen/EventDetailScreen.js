import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Image,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchEventById,
  clearEventsError,
  fetchAllCategories,
  clearSelectedEvent,
  updateBookmarkedEvent,
} from '../../store/slices/eventsSlice';
import { supabase } from '../../config/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import styles from './EventDetailScreenStyles';

const HEADER_VERTICAL_PADDING = 25;

const EventDetailScreen = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { eventId } = route.params;
  const insets = useSafeAreaInsets();

  const { selectedEvent, isLoading, error, allCategories, bookmarkedEvents } = useSelector((state) => state.events);
  const { session } = useSelector((state) => state.auth);

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

  useEffect(() => {
    if (selectedEvent && bookmarkedEvents) {
      const isBookmarkedInReduxList = bookmarkedEvents.some(
        (bEvent) => bEvent.id === selectedEvent.id
      );
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

    const currentBookmarkedStatus = selectedEvent.is_bookmarked;

    try {
      if (currentBookmarkedStatus) {
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
    image_url,
    category_ids,
    profiles,
    is_bookmarked,
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

    let formattedTime = eventTime;
    if (eventTime && eventTime.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
      formattedTime = eventTime.substring(0, 5);
    } else {
      formattedTime = 'Time not specified';
    }

    return `${formattedDate} at ${formattedTime}`;
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />

      <View style={[styles.header, { paddingTop: insets.top + HEADER_VERTICAL_PADDING }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <TouchableOpacity onPress={handleBookmarkToggle} style={styles.bookmarkIcon}>
          <Ionicons
            name={is_bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={28}
            color={is_bookmarked ? '#FF9933' : '#333'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {image_url && (
          <Image source={{ uri: image_url }} style={styles.eventImage} resizeMode="cover" />
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

          {selectedEvent.externalLink && (
            <TouchableOpacity style={styles.externalLinkButton} onPress={() => handleOpenLink(selectedEvent.externalLink)}>
              <Ionicons name="link-outline" size={20} color="#FF9933" />
              <Text style={styles.externalLinkButtonText}>Learn More / Register</Text>
              <Ionicons name="open-outline" size={18} color="#FF9933" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default EventDetailScreen;