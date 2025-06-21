import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { fetchEvents, clearEventsError, fetchAllCategories } from '../store/slices/eventsSlice';
import EventCard from '../components/EventCard';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

// Константы для ползунка
// SLIDER_FULL_WIDTH - это вся доступная длина трека, по которой движутся центры ручек
const SLIDER_FULL_WIDTH = width * 0.8 - 40;
const THUMB_SIZE = 30; // Размер ручки (диаметр)

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { events, isLoading, error, allCategories } = useSelector((state) => state.events);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(-width))[0];

  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [minTime, setMinTime] = useState(null);
  const [maxTime, setMaxTime] = useState(null);
  const [showMinTimePicker, setShowMinTimePicker] = useState(false);
  const [showMaxTimePicker, setShowMaxTimePicker] = useState(false);

  // Состояния для цен
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);

  // Animated.Value для положения ручек
  // Изначально minThumbX в начале, maxThumbX в конце
  const minThumbX = useRef(new Animated.Value(0)).current;
  const maxThumbX = useRef(new Animated.Value(SLIDER_FULL_WIDTH)).current;

  // Переменные для отслеживания текущего положения при перетаскивании
  // Используем useRef, чтобы значения были актуальными внутри PanResponder
  const _minPrice = useRef(minPrice);
  const _maxPrice = useRef(maxPrice);
  useEffect(() => {
    _minPrice.current = minPrice;
  }, [minPrice]);
  useEffect(() => {
    _maxPrice.current = maxPrice;
  }, [maxPrice]);


  // PanResponder для МИНИМАЛЬНОЙ ручки
  const minThumbPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        minThumbX.setOffset(minThumbX._value);
        minThumbX.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        let newX = gestureState.dx;

        const currentMaxThumbPos = maxThumbX._value; // Текущая позиция правой ручки
        const maxAllowedX = currentMaxThumbPos - THUMB_SIZE; // Левая ручка не должна заходить за правую

        newX = Math.max(0, Math.min(newX, maxAllowedX)); // Ограничиваем newX в пределах [0, maxAllowedX]

        minThumbX.setValue(newX);

        const calculatedPrice = Math.round((minThumbX._offset + minThumbX._value) / SLIDER_FULL_WIDTH * 1000);
        setMinPrice(Math.max(0, Math.min(calculatedPrice, _maxPrice.current)));
      },
      onPanResponderRelease: (evt, gestureState) => {
        minThumbX.flattenOffset();
        const finalPrice = Math.round((minThumbX._value / SLIDER_FULL_WIDTH) * 1000);
        setMinPrice(Math.max(0, Math.min(finalPrice, _maxPrice.current)));
      },
    })
  ).current;

  // PanResponder для МАКСИМАЛЬНОЙ ручки
  const maxThumbPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        maxThumbX.setOffset(maxThumbX._value);
        maxThumbX.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        let newX = gestureState.dx;

        const currentMinThumbPos = minThumbX._value; // Текущая позиция левой ручки
        const minAllowedX = currentMinThumbPos + THUMB_SIZE; // Правая ручка не должна заходить за левую

        // !!! ИСПРАВЛЕНИЕ: Ограничиваем абсолютную позицию, а затем вычитаем смещение для относительного newX
        const absoluteNewX = maxThumbX._offset + newX; // Абсолютная позиция, которую мы хотим получить
        const constrainedAbsoluteX = Math.max(minAllowedX, Math.min(absoluteNewX, SLIDER_FULL_WIDTH));
        newX = constrainedAbsoluteX - maxThumbX._offset; // Переводим обратно в относительное dx для setValue

        maxThumbX.setValue(newX);

        const calculatedPrice = Math.round((maxThumbX._offset + maxThumbX._value) / SLIDER_FULL_WIDTH * 1000);
        setMaxPrice(Math.min(1000, Math.max(calculatedPrice, _minPrice.current)));
      },
      onPanResponderRelease: (evt, gestureState) => {
        maxThumbX.flattenOffset();
        const finalPrice = Math.round((maxThumbX._value / SLIDER_FULL_WIDTH) * 1000);
        setMaxPrice(Math.min(1000, Math.max(finalPrice, _minPrice.current)));
      },
    })
  ).current;


  // Обновляем позиции ручек при изменении minPrice/maxPrice через TextInput
  useEffect(() => {
    minThumbX.setValue((minPrice / 1000) * SLIDER_FULL_WIDTH);
  }, [minPrice, SLIDER_FULL_WIDTH]);

  useEffect(() => {
    maxThumbX.setValue((maxPrice / 1000) * SLIDER_FULL_WIDTH);
  }, [maxPrice, SLIDER_FULL_WIDTH]);


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
    slideAnim.setValue(-width);
    setIsFilterModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const closeFilterModal = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
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

  const handleBookmarkToggle = (event) => {
    Alert.alert('Bookmark', `Toggle bookmark for: ${event.title}`);
  };

  const handleCommentsPress = (event) => {
    navigation.navigate('Comments', {
      eventId: event.id,
      eventTitle: event.title,
    });
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
    // Сбрасываем Animated.Value для рендера
    minThumbX.setValue(0);
    maxThumbX.setValue(SLIDER_FULL_WIDTH);
  };

  const isAllActive = selectedCategoryIds.length === 0;

  const renderEventCard = useCallback(
    ({ item }) => (
      <EventCard event={item} onPress={handleEventPress} onBookmarkToggle={handleBookmarkToggle} onCommentsPress={handleCommentsPress} />
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
            style={{ flex: 1, height: '100%' }}
            onPress={closeFilterModal}
            activeOpacity={1}
          />

          <Animated.View
            style={[styles.filterModalContent, { transform: [{ translateX: slideAnim }] }]}
          >
            <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.modalHeaderRow}>
                <TouchableOpacity style={styles.modalBackButton} onPress={closeFilterModal}>
                  <Text>
                    <Ionicons name="arrow-back" size={28} color="#555" />
                  </Text>
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

                {/* --- Кастомный ползунок диапазона на PanResponder --- */}
                <View style={styles.customSliderContainer}>
                  {/* Базовая линия трека */}
                  <View style={styles.trackBase} />

                  {/* Заполненная часть трека */}
                  <Animated.View
                    style={[
                      styles.filledTrack,
                      {
                        // Начало заполненной части - позиция левой ручки
                        left: minThumbX.interpolate({
                          inputRange: [0, SLIDER_FULL_WIDTH],
                          outputRange: [0, SLIDER_FULL_WIDTH],
                          extrapolate: 'clamp',
                        }),
                        // Ширина заполненной части - разница между правой и левой ручкой
                        width: Animated.add(
                          maxThumbX,
                          Animated.multiply(minThumbX, -1) // maxThumbX - minThumbX
                        ).interpolate({
                          inputRange: [0, SLIDER_FULL_WIDTH], // min range can be 0, max is full width
                          outputRange: [0, SLIDER_FULL_WIDTH],
                          extrapolate: 'clamp',
                        }),
                      },
                    ]}
                  />

                  {/* Ручка минимальной цены */}
                  <Animated.View
                    style={[
                      styles.thumb,
                      {
                        transform: [{ translateX: minThumbX }],
                      },
                    ]}
                    {...minThumbPanResponder.panHandlers}
                  />

                  {/* Ручка максимальной цены */}
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
                {/* --- Конец кастомного ползунка диапазона --- */}

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
                      newMinPrice = Math.min(newMinPrice, maxPrice); // Не даем minPrice быть больше maxPrice

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
                      newMaxPrice = Math.max(newMaxPrice, minPrice); // Не даем maxPrice быть меньше minPrice

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

              <TouchableOpacity style={styles.closeModalButton} onPress={closeFilterModal}>
                <Text style={styles.closeModalButtonText}>Apply Filters</Text>
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

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    paddingTop: 0,
  },
  header: {
    backgroundColor: '#FFF8F0',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 25 : 25,
    paddingBottom: 25,
    borderBottomWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 5,
  },
  filterButtonInsideSearch: {
    padding: 10,
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 10,
  },
  categoriesScrollView: {
    marginHorizontal: -5,
    marginTop: 5,
  },
  categoriesContent: {
    paddingHorizontal: 5,
  },
  categoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FFEBCC',
    borderWidth: 1,
    borderColor: '#FFDDAA',
    marginHorizontal: 5,
  },
  activeCategoryButton: {
    backgroundColor: '#FF9933',
    borderColor: '#FF9933',
  },
  categoryButtonText: {
    color: '#664422',
    fontSize: 14,
    fontWeight: '600',
  },
  activeCategoryButtonText: {
    color: '#fff',
  },
  loadingSpinner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noEventsText: {
    flex: 1,
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: '#888',
  },
  listContent: {
    paddingBottom: 20,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    flexDirection: 'row-reverse',
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderRadius: 0,
    width: width * 0.8,
    height: '100%',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 20,
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  modalBackButton: {
    zIndex: 10,
    padding: 5,
    marginRight: 10,
  },
  filterModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 0,
    textAlign: 'left',
    color: '#333',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 10,
  },
  modalFooter: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  filterSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  filterSectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  cityFilterInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  cityFilterInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
    paddingRight: 10,
  },
  mapIconModal: {
    padding: 5,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 5,
  },
  timePickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  timeSeparator: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginHorizontal: 10,
  },
  priceRangeText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  priceInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  priceInput: {
    width: '45%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  priceSeparator: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  clearFiltersButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  clearFiltersButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  closeModalButton: {
    backgroundColor: '#FF9933',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // --- Стили для кастомного ползунка с PanResponder ---
  customSliderContainer: {
    height: THUMB_SIZE, // Высота контейнера равна высоте ручки
    justifyContent: 'center',
    alignSelf: 'stretch',
    position: 'relative',
    marginHorizontal: THUMB_SIZE / 2, // Отступ для корректного отображения ручек по краям
  },
  trackBase: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#D3D3D3',
    borderRadius: 2,
    left: 0,
    right: 0,
  },
  filledTrack: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#FF9933',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FF9933',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 10, // Чтобы ручки были поверх всего
    left: -THUMB_SIZE / 2, // Сдвиг, чтобы центр ручки был на нужной координате X
  },
  modalCategoriesScrollView: {
    marginHorizontal: -5,
    marginBottom: 20,
  },
  modalCategoriesContent: {
    paddingHorizontal: 15,
  },
  modalCategoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 5,
  },
  modalActiveCategoryButton: {
    backgroundColor: '#FF9933',
    borderColor: '#FF9933',
  },
  modalCategoryButtonText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '600',
  },
  modalActiveCategoryButtonText: {
    color: '#fff',
  },
});

export default HomeScreen;