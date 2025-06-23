import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  Dimensions,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEvents, clearEventsError, fetchAllCategories, toggleBookmark } from '../../store/slices/eventsSlice';
import EventCard from '../../components/EventCard';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

// Импортируем стили из отдельного файла
import { SLIDER_WIDTH_IN_MODAL, SLIDER_PADDING_HORIZONTAL, SLIDER_EFFECTIVE_TRACK_WIDTH, THUMB_SIZE, styles } from './HomeScreenStyles';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { events, isLoading, error, allCategories } = useSelector((state) => state.events);
  const { session } = useSelector((state) => state.auth);

  const userId = session?.user?.id;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(-Dimensions.get('window').width))[0]; // Используем Dimensions.get('window').width напрямую здесь

  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [minTime, setMinTime] = useState(null);
  const [maxTime, setMaxTime] = useState(null);
  const [showMinTimePicker, setShowMinTimePicker] = useState(false);
  const [showMaxTimePicker, setShowMaxTimePicker] = useState(false);

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);

  const minThumbX = useRef(new Animated.Value(0)).current;
  const maxThumbX = useRef(new Animated.Value(SLIDER_EFFECTIVE_TRACK_WIDTH)).current;

  const _minPrice = useRef(minPrice);
  const _maxPrice = useRef(maxPrice);

  useEffect(() => {
    _minPrice.current = minPrice;
  }, [minPrice]);

  useEffect(() => {
    _maxPrice.current = maxPrice;
  }, [maxPrice]);

  const minThumbPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        minThumbX.setOffset(minThumbX._value);
        minThumbX.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        let newAbsoluteX = minThumbX._offset + gestureState.dx;

        const currentMaxThumbPos = maxThumbX._value;
        const maxAllowedXForMin = currentMaxThumbPos - THUMB_SIZE;

        const constrainedX = Math.max(0, Math.min(newAbsoluteX, maxAllowedXForMin));
        minThumbX.setValue(constrainedX - minThumbX._offset);

        const calculatedPrice = Math.round((constrainedX / SLIDER_EFFECTIVE_TRACK_WIDTH) * 1000);
        setMinPrice(Math.min(Math.max(calculatedPrice, 0), _maxPrice.current));
      },
      onPanResponderRelease: () => {
        minThumbX.flattenOffset();
        const finalPrice = Math.round((minThumbX._value / SLIDER_EFFECTIVE_TRACK_WIDTH) * 1000);
        setMinPrice(Math.min(Math.max(finalPrice, 0), _maxPrice.current));
      },
    })
  ).current;

  const maxThumbPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        maxThumbX.setOffset(maxThumbX._value);
        maxThumbX.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        let newAbsoluteX = maxThumbX._offset + gestureState.dx;

        const currentMinThumbPos = minThumbX._value;
        const minAllowedXForMax = currentMinThumbPos + THUMB_SIZE;

        const constrainedX = Math.max(minAllowedXForMax, Math.min(newAbsoluteX, SLIDER_EFFECTIVE_TRACK_WIDTH));
        maxThumbX.setValue(constrainedX - maxThumbX._offset);

        const calculatedPrice = Math.round((constrainedX / SLIDER_EFFECTIVE_TRACK_WIDTH) * 1000);
        setMaxPrice(Math.max(_minPrice.current, Math.min(calculatedPrice, 1000)));
      },
      onPanResponderRelease: () => {
        maxThumbX.flattenOffset();
        const finalPrice = Math.round((maxThumbX._value / SLIDER_EFFECTIVE_TRACK_WIDTH) * 1000);
        setMaxPrice(Math.max(_minPrice.current, Math.min(finalPrice, 1000)));
      },
    })
  ).current;

  useEffect(() => {
    const newMinX = (minPrice / 1000) * SLIDER_EFFECTIVE_TRACK_WIDTH;
    if (Math.abs(minThumbX._value - newMinX) > 1) {
      minThumbX.setValue(newMinX);
    }
  }, [minPrice, SLIDER_EFFECTIVE_TRACK_WIDTH, minThumbX]);

  useEffect(() => {
    const newMaxX = (maxPrice / 1000) * SLIDER_EFFECTIVE_TRACK_WIDTH;
    if (Math.abs(maxThumbX._value - newMaxX) > 1) {
      maxThumbX.setValue(newMaxX);
    }
  }, [maxPrice, SLIDER_EFFECTIVE_TRACK_WIDTH, maxThumbX]);

  useEffect(() => {
    dispatch(fetchAllCategories());
  }, [dispatch]);

  const loadEvents = useCallback(
    (
      query = '',
      categories = [],
      city = '',
      date = null,
      minT = null,
      maxT = null,
      minP = 0,
      maxP = 1000
    ) => {
      dispatch(
        fetchEvents({
          searchQuery: query,
          selectedCategoryIds: categories,
          city: city,
          date: date ? date.toISOString().split('T')[0] : null,
          minTime: minT ? `${String(minT.getHours()).padStart(2, '0')}:${String(minT.getMinutes()).padStart(2, '0')}` : null,
          maxTime: maxT ? `${String(maxT.getHours()).padStart(2, '0')}:${String(maxT.getMinutes()).padStart(2, '0')}` : null,
          minPrice: minP,
          maxPrice: maxP,
        })
      );
    },
    [dispatch]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      loadEvents(searchQuery, selectedCategoryIds, citySearchQuery, selectedDate, minTime, maxTime, minPrice, maxPrice);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, selectedCategoryIds, citySearchQuery, selectedDate, minTime, maxTime, minPrice, maxPrice, loadEvents]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error Loading Events', error);
      dispatch(clearEventsError());
    }
  }, [error, dispatch]);

  const openFilterModal = () => {
    slideAnim.setValue(-Dimensions.get('window').width); // Используем Dimensions.get('window').width напрямую здесь
    setIsFilterModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const closeFilterModal = () => {
    Animated.timing(slideAnim, {
      toValue: -Dimensions.get('window').width, // Используем Dimensions.get('window').width напрямую здесь
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsFilterModalVisible(false));
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleMinTimeChange = (event, time) => {
    setShowMinTimePicker(Platform.OS === 'ios');
    if (time) {
      setMinTime(time);
    }
  };

  const handleMaxTimeChange = (event, time) => {
    setShowMaxTimePicker(Platform.OS === 'ios');
    if (time) {
      setMaxTime(time);
    }
  };

  const handleEventPress = (event) => {
    navigation.navigate('EventDetail', { eventId: event.id });
  };

  const handleBookmarkToggle = useCallback(async (event) => {
    if (!userId) {
      Alert.alert('Login Required', 'You must be logged in to save events.');
      return;
    }

    try {
      await dispatch(toggleBookmark({
        eventId: event.id,
        userId: userId,
        isBookmarked: event.is_bookmarked
      })).unwrap();
      Alert.alert('Success', `Event "${event.title}" ${event.is_bookmarked ? 'removed from' : 'added to'} your favorites.`);
    } catch (err) {
      Alert.alert('Error', `Failed to update bookmark: ${err.message}`);
    }
  }, [dispatch, userId]);

  const handleCommentsPress = (event) => {
    navigation.navigate('Comments', { eventId: event.id, eventTitle: event.title });
  };

  const handleCategoryToggle = (categoryId) => {
    if (categoryId === 'All') {
      setSelectedCategoryIds([]);
    } else {
      if (selectedCategoryIds.includes(categoryId)) {
        setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== categoryId));
      } else {
        setSelectedCategoryIds([...selectedCategoryIds, categoryId]);
      }
    }
  };

  const handleClearFilters = () => {
    setCitySearchQuery('');
    setSelectedCategoryIds([]);
    setSelectedDate(null);
    setMinTime(null);
    setMaxTime(null);
    setMinPrice(0);
    setMaxPrice(1000);
    minThumbX.setValue(0);
    maxThumbX.setValue(SLIDER_EFFECTIVE_TRACK_WIDTH);
  };

  const handleApplyFilters = () => {
    closeFilterModal();
  };

  const isAllActive = selectedCategoryIds.length === 0;

  const renderEventCard = useCallback(
    ({ item }) => (
      <EventCard
        event={item}
        onPress={handleEventPress}
        onBookmarkToggle={handleBookmarkToggle}
        onCommentsPress={handleCommentsPress}
      />
    ),
    [handleEventPress, handleBookmarkToggle, handleCommentsPress]
  );

  const topLevelCategories = Array.isArray(allCategories) ? allCategories : [];

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upcoming Events</Text>

        <View style={styles.searchFilterContainer}>
          <TouchableOpacity style={styles.filterButtonInsideSearch} onPress={openFilterModal}>
            <Ionicons name="filter-outline" size={24} color="#555" />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="Search events (title, description, location)"
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScrollView}
          contentContainerStyle={styles.categoriesContent}
        >
          <TouchableOpacity
            style={[styles.categoryButton, isAllActive && styles.activeCategoryButton]}
            onPress={() => handleCategoryToggle('All')}
          >
            <Text style={[styles.categoryButtonText, isAllActive && styles.activeCategoryButtonText]}>All</Text>
          </TouchableOpacity>
          {topLevelCategories.map((category) => {
            const isActive = selectedCategoryIds.includes(category.id);
            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryButton, isActive && styles.activeCategoryButton]}
                onPress={() => handleCategoryToggle(category.id)}
              >
                <Text style={[styles.categoryButtonText, isActive && styles.activeCategoryButtonText]}>{category.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <Modal animationType="none" transparent={true} visible={isFilterModalVisible} onRequestClose={closeFilterModal}>
        <View style={styles.filterModalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayBackground}
            onPress={closeFilterModal}
            activeOpacity={1}
          />

          <Animated.View
            style={[styles.filterModalContent, { transform: [{ translateX: slideAnim }] }]}
          >
            <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity style={styles.modalBackButton} onPress={closeFilterModal}>
                  <Ionicons name="arrow-back" size={28} color="#555" />
                </TouchableOpacity>
                <Text style={styles.filterModalTitle}>Detailed Filters</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.modalCategoriesScrollView}
                contentContainerStyle={styles.modalCategoriesContent}
              >
                <TouchableOpacity
                  style={[styles.modalCategoryButton, isAllActive && styles.modalActiveCategoryButton]}
                  onPress={() => handleCategoryToggle('All')}
                >
                  <Text style={[styles.modalCategoryButtonText, isAllActive && styles.modalActiveCategoryButtonText]}>All</Text>
                </TouchableOpacity>
                {topLevelCategories.map((category) => {
                  const isActive = selectedCategoryIds.includes(category.id);
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[styles.modalCategoryButton, isActive && styles.modalActiveCategoryButton]}
                      onPress={() => handleCategoryToggle(category.id)}
                    >
                      <Text style={[styles.modalCategoryButtonText, isActive && styles.modalActiveCategoryButtonText]}>{category.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionHeader}>Search by City:</Text>
                <View style={styles.cityFilterInputContainer}>
                  <TextInput
                    style={styles.cityFilterInput}
                    placeholder="Enter city (e.g., 'Kyiv')"
                    placeholderTextColor="#888"
                    value={citySearchQuery}
                    onChangeText={setCitySearchQuery}
                  />
                  <TouchableOpacity
                    style={styles.mapIconModal}
                    onPress={() => Alert.alert('Map Integration', 'Navigate to map to select a city.')}
                  >
                    <Ionicons name="map-outline" size={24} color="#555" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionHeader}>Filter by Date:</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                  <Text style={styles.datePickerButtonText}>
                    {selectedDate ? selectedDate.toLocaleDateString() : 'Select Date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#555" />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionHeader}>Filter by Time:</Text>
                <View style={styles.timeRangeContainer}>
                  <TouchableOpacity onPress={() => setShowMinTimePicker(true)} style={styles.timePickerButton}>
                    <Text style={styles.timePickerButtonText}>
                      {minTime ? minTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'From'}
                    </Text>
                    <Ionicons name="time-outline" size={20} color="#555" />
                  </TouchableOpacity>
                  {showMinTimePicker && (
                    <DateTimePicker
                      value={minTime || new Date()}
                      mode="time"
                      display="default"
                      onChange={handleMinTimeChange}
                    />
                  )}
                  <Text style={styles.timeSeparator}>-</Text>
                  <TouchableOpacity onPress={() => setShowMaxTimePicker(true)} style={styles.timePickerButton}>
                    <Text style={styles.timePickerButtonText}>
                      {maxTime ? maxTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'To'}
                    </Text>
                    <Ionicons name="time-outline" size={20} color="#555" />
                  </TouchableOpacity>
                  {showMaxTimePicker && (
                    <DateTimePicker
                      value={maxTime || new Date()}
                      mode="time"
                      display="default"
                      onChange={handleMaxTimeChange}
                    />
                  )}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionHeader}>Filter by Price:</Text>
                <Text style={styles.priceRangeText}>
                  {`$${minPrice.toFixed(0)} - $${maxPrice.toFixed(0)}`}
                </Text>

                <View style={styles.customSliderContainer}>
                  <View style={styles.trackBase} />
                  <Animated.View
                    style={[
                      styles.filledTrack,
                      {
                        left: minThumbX.interpolate({
                          inputRange: [0, SLIDER_EFFECTIVE_TRACK_WIDTH],
                          outputRange: [0, SLIDER_EFFECTIVE_TRACK_WIDTH],
                          extrapolate: 'clamp',
                        }),
                        width: Animated.add(
                          maxThumbX,
                          Animated.multiply(minThumbX, -1)
                        ).interpolate({
                          inputRange: [0, SLIDER_EFFECTIVE_TRACK_WIDTH],
                          outputRange: [0, SLIDER_EFFECTIVE_TRACK_WIDTH],
                          extrapolate: 'clamp',
                        }),
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.thumb,
                      {
                        transform: [{ translateX: minThumbX }],
                      },
                    ]}
                    {...minThumbPanResponder.panHandlers}
                  />
                  <Animated.View
                    style={[
                      styles.thumb,
                      {
                        transform: [{ translateX: maxThumbX }],
                      },
                    ]}
                    {...maxThumbPanResponder.panHandlers}
                  />
                </View>

                <View style={styles.priceInputsContainer}>
                  <TextInput
                    style={styles.priceInput}
                    keyboardType="numeric"
                    placeholder="Min. Price"
                    value={minPrice !== null && minPrice !== undefined ? String(minPrice) : ''}
                    onChangeText={(text) => {
                      const cleanedText = text.replace(/[^0-9]/g, '');
                      const num = Number(cleanedText);
                      let newMinPrice = isNaN(num) ? 0 : num;
                      newMinPrice = Math.max(0, Math.min(newMinPrice, 1000));
                      newMinPrice = Math.min(newMinPrice, maxPrice);
                      setMinPrice(newMinPrice);
                    }}
                    onBlur={() => {
                      const num = Number(minPrice);
                      const finalMinPrice = isNaN(num) ? 0 : Math.max(0, Math.min(num, maxPrice, 1000));
                      setMinPrice(finalMinPrice);
                    }}
                  />
                  <Text style={styles.priceSeparator}>-</Text>
                  <TextInput
                    style={styles.priceInput}
                    keyboardType="numeric"
                    placeholder="Max. Price"
                    value={maxPrice !== null && maxPrice !== undefined ? String(maxPrice) : ''}
                    onChangeText={(text) => {
                      const cleanedText = text.replace(/[^0-9]/g, '');
                      const num = Number(cleanedText);
                      let newMaxPrice = isNaN(num) ? 1000 : num;
                      newMaxPrice = Math.max(0, Math.min(newMaxPrice, 1000));
                      newMaxPrice = Math.max(newMaxPrice, minPrice);
                      setMaxPrice(newMaxPrice);
                    }}
                    onBlur={() => {
                      const num = Number(maxPrice);
                      const finalMaxPrice = isNaN(num) ? 1000 : Math.max(minPrice, Math.min(num, 1000));
                      setMaxPrice(finalMaxPrice);
                    }}
                  />
                </View>
              </View>

            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearFiltersButton} onPress={handleClearFilters}>
                <Text style={styles.clearFiltersButtonText}>Clear All Filters</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.applyFiltersButton} onPress={handleApplyFilters}>
                <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loadingSpinner} />
      ) : events.length === 0 ? (
        <Text style={styles.noEventsText}>No events found.</Text>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => loadEvents(searchQuery, selectedCategoryIds, citySearchQuery, selectedDate, minTime, maxTime, minPrice, maxPrice)}
              colors={['#007AFF']}
              tintColor={'#007AFF'}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;