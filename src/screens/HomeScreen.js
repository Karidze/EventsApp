import React, { useEffect, useCallback, useState } from 'react';
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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEvents,
  clearEventsError,
  fetchAllCategories,
} from '../store/slices/eventsSlice';
import EventCard from '../components/EventCard';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { events, isLoading, error, allCategories } = useSelector((state) => state.events);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(-width))[0];

  useEffect(() => {
    dispatch(fetchAllCategories());
  }, [dispatch]);

  const loadEvents = useCallback((query = '', categories = []) => {
    dispatch(fetchEvents({ searchQuery: query, selectedCategoryIds: categories }));
  }, [dispatch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadEvents(searchQuery, selectedCategoryIds);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, selectedCategoryIds, loadEvents]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error Loading Events', error);
      dispatch(clearEventsError());
    }
  }, [error, dispatch]);

  const openFilterModal = () => {
    setIsFilterModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
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

  const handleEventPress = (event) => {
    navigation.navigate('EventDetail', { eventId: event.id });
  };

  const handleBookmarkToggle = (event) => {
    Alert.alert('Bookmark Toggle', `Toggle bookmark for: ${event.title}`);
  };

  const handleCommentsPress = (event) => {
    navigation.navigate('CommentsScreen', { eventId: event.id, eventTitle: event.title });
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

  const isAllActive = selectedCategoryIds.length === 0;

  const renderEventCard = ({ item }) => (
    <EventCard
      event={item}
      onPress={handleEventPress}
      onBookmarkToggle={handleBookmarkToggle}
      onCommentsPress={handleCommentsPress}
    />
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
            placeholder="Search events (e.g., 'Tech Kyiv')"
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
            <Text
              style={[styles.categoryButtonText, isAllActive && styles.activeCategoryButtonText]}
            >
              All
            </Text>
          </TouchableOpacity>
          {topLevelCategories.map((category) => {
            const isActive = selectedCategoryIds.includes(category.id);
            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryButton, isActive && styles.activeCategoryButton]}
                onPress={() => handleCategoryToggle(category.id)}
              >
                <Text
                  style={[styles.categoryButtonText, isActive && styles.activeCategoryButtonText]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <Modal
        animationType="none"
        transparent={true}
        visible={isFilterModalVisible}
        onRequestClose={closeFilterModal}
      >
        <TouchableOpacity
          style={styles.filterModalOverlay}
          activeOpacity={1}
          onPressOut={closeFilterModal}
        >
          <Animated.View style={[styles.filterModalContent, { transform: [{ translateX: slideAnim }] }]}>
            <TouchableOpacity style={styles.modalBackButton} onPress={closeFilterModal}>
              <Ionicons name="arrow-back" size={28} color="#555" />
            </TouchableOpacity>

            <Text style={styles.filterModalTitle}>Detailed Filters</Text>
            <View style={styles.modalCategoryList}>
              <Text style={styles.modalCategoryHeader}>Filter by Category:</Text>
              {allCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.modalCategoryItem,
                    selectedCategoryIds.includes(category.id) && styles.modalCategoryItemActive,
                  ]}
                  onPress={() => handleCategoryToggle(category.id)}
                >
                  <Text
                    style={[
                      styles.modalCategoryItemText,
                      selectedCategoryIds.includes(category.id) && styles.modalCategoryItemTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.closeModalButton} onPress={closeFilterModal}>
              <Text style={styles.closeModalButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {isLoading && searchQuery === '' && selectedCategoryIds.length === 0 ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loadingSpinner} />
      ) : events.length === 0 && !isLoading ? (
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
              onRefresh={() => loadEvents(searchQuery, selectedCategoryIds)}
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
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderRadius: 0,
    padding: 20,
    width: width * 0.75,
    height: '100%',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  modalBackButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 30,
    left: 10,
    zIndex: 10,
    padding: 5,
  },
  filterModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight + 40 : 60,
    marginBottom: 25,
    textAlign: 'left',
    color: '#333',
  },
  modalCategoryList: {
    marginBottom: 20,
  },
  modalCategoryHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalCategoryItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#FFEBCC',
  },
  modalCategoryItemActive: {
    backgroundColor: '#FF9933',
  },
  modalCategoryItemText: {
    fontSize: 16,
    color: '#664422',
  },
  modalCategoryItemTextActive: {
    color: '#fff',
  },
  closeModalButton: {
    backgroundColor: '#FF9933',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 'auto',
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;