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
  Button,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEvents,
  clearEventsError,
  fetchAllCategories,
} from '../store/slices/eventsSlice';
import EventCard from '../components/EventCard';
import Ionicons from 'react-native-vector-icons/Ionicons';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { events, isLoading, error, allCategories } = useSelector((state) => state.events);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // Загрузка всех доступных категорий при монтировании компонента
  useEffect(() => {
    dispatch(fetchAllCategories());
  }, [dispatch]);

  // Функция для загрузки ивентов с возможностью фильтрации
  const loadEvents = useCallback((query = '', categories = []) => {
    dispatch(fetchEvents({ searchQuery: query, selectedCategoryIds: categories }));
  }, [dispatch]);

  // Загрузка ивентов при изменении запроса поиска или выбранных категорий
  useEffect(() => {
    const handler = setTimeout(() => {
      loadEvents(searchQuery, selectedCategoryIds);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, selectedCategoryIds, loadEvents]);

  // Обработка ошибок
  useEffect(() => {
    if (error) {
      Alert.alert('Error Loading Events', error);
      dispatch(clearEventsError());
    }
  }, [error, dispatch]);

  const handleEventPress = (event) => {
    Alert.alert('Event Selected', `You selected event: ${event.title}`);
  };

  // --- Логика для выбора нескольких категорий по ID ---
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
    <EventCard event={item} onPress={handleEventPress} allCategories={allCategories} />
  );

  // Фильтруем категории для отображения в быстром поиске (только родительские)
  const topLevelCategories = Array.isArray(allCategories)
    ? allCategories.filter(cat => cat.parent_id === null)
    : [];

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Upcoming Events</Text>
        <View style={styles.searchFilterContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search events (e.g., 'Tech Kyiv')"
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterIconContainer}
            onPress={() => setIsFilterModalVisible(true)}
          >
            <Ionicons name="filter-outline" size={24} color="#555" />
          </TouchableOpacity>
        </View>

        {/* Категории - горизонтальное прокручиваемое меню */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {/* Кнопка "All" */}
          <TouchableOpacity
            style={[
              styles.categoryButton,
              isAllActive && styles.activeCategoryButton,
            ]}
            onPress={() => handleCategoryToggle('All')}
          >
            <Text
              style={[
                styles.categoryButtonText,
                isAllActive && styles.activeCategoryButtonText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {/* Динамические категории верхнего уровня из БД */}
          {topLevelCategories.map((category) => {
            const isActive = selectedCategoryIds.includes(category.id);
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  isActive && styles.activeCategoryButton,
                ]}
                onPress={() => handleCategoryToggle(category.id)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    isActive && styles.activeCategoryButtonText,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Модальное окно фильтрации (пока заглушка) */}
      {isFilterModalVisible && (
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContent}>
            <Text style={styles.filterModalTitle}>Detailed Filters</Text>
            {/* Здесь будут ваши элементы фильтрации */}
            <Button title="Close" onPress={() => setIsFilterModalVisible(false)} />
          </View>
        </View>
      )}

      {isLoading && searchQuery === '' && selectedCategoryIds.length === 0 ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loadingSpinner} />
      ) : events.length === 0 && !isLoading ? (
        <Text style={styles.noEventsText}>No events found.</Text>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 0,
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 15,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  filterIconContainer: {
    padding: 10,
  },
  categoriesContainer: {
    marginBottom: 10,
  },
  categoriesContent: {
    paddingHorizontal: 5,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeCategoryButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
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
  },
  filterModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '85%',
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  filterModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default HomeScreen;