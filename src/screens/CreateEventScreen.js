
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Button,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from '../config/supabase';
import { fetchAllCategories } from '../store/slices/eventsSlice';

const MAX_CATEGORIES = 5;

const CreateEventScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { allCategories } = useSelector((state) => state.events);
  const { session, user, isAuthenticated } = useSelector((state) => state.auth); 

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [eventPrice, setEventPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // --- ДОБАВЛЕННЫЕ ЛОГИ ДЛЯ ОТЛАДКИ ---
  useEffect(() => {
    console.log('CreateEventScreen mounted. Current Redux State:');
    console.log('  session:', session);
    console.log('  user:', user);
    console.log('  isAuthenticated:', isAuthenticated);
    if (session?.user?.id) {
      console.log('  session.user.id (organizer_id candidate):', session.user.id);
    } else {
      console.log('  Session or session.user.id is NULL/UNDEFINED.');
    }
  }, [session, user, isAuthenticated]); 

  useEffect(() => {
    dispatch(fetchAllCategories());
  }, [dispatch]);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const onChangeTime = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(Platform.OS === 'ios');
    setTime(currentTime);
  };

  const showDatepicker = () => setShowDatePicker(true);
  const showTimepicker = () => setShowTimePicker(true);

  const handleCategoryToggle = (categoryId) => {
    if (selectedCategoryIds.includes(categoryId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== categoryId));
    } else {
      if (selectedCategoryIds.length < MAX_CATEGORIES) {
        setSelectedCategoryIds([...selectedCategoryIds, categoryId]);
      } else {
        Alert.alert(
          'Limit Reached',
          `You can select a maximum of ${MAX_CATEGORIES} categories.`
        );
      }
    }
  };

  const handleCreateEvent = async () => {
  if (!session?.user?.id) {
    Alert.alert('Error', 'You must be logged in to create an event.');
    console.log('DEBUG: handleCreateEvent aborted. session?.user?.id is missing.');
    return;
  }

  if (!title || !description || !location || !city || selectedCategoryIds.length === 0) {
    Alert.alert('Validation Error', 'Please fill in all required fields and select at least one category.');
    return;
  }

  setLoading(true);
  try {
    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          organizer_id: session.user.id,
          title: title,
          description: description,
          date: date.toISOString().split('T')[0],
          time: time.toTimeString().split(' ')[0],
          location: location,
          city: city,
          event_price: parseFloat(eventPrice) || 0,
          image_url: imageUrl || null,
          category_ids: selectedCategoryIds,
        },
      ])
      .select();

    if (error) {
      console.error('Supabase insert error (from catch):', error.message);
      throw error;
    }

    Alert.alert('Success', 'Event created successfully!');
    // Очищаем форму
    setTitle('');
    setDescription('');
    setDate(new Date());
    setTime(new Date());
    setLocation('');
    setCity('');
    setEventPrice('');
    setImageUrl('');
    setSelectedCategoryIds([]);

    navigation.navigate('SearchEvents'); 

  } catch (error) {
    console.error('Error creating event (catch block):', error.message);
    Alert.alert('Error creating event', error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Create New Event</Text>

      <TextInput
        style={styles.input}
        placeholder="Event Title"
        placeholderTextColor="#888"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, styles.descriptionInput]}
        placeholder="Description"
        placeholderTextColor="#888"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <View style={styles.dateTimeContainer}>
        <TouchableOpacity onPress={showDatepicker} style={styles.dateTimeButton}>
          <Ionicons name="calendar-outline" size={20} color="#007AFF" />
          <Text style={styles.dateTimeText}>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            testID="datePicker"
            value={date}
            mode="date"
            display="default"
            onChange={onChangeDate}
          />
        )}

        <TouchableOpacity onPress={showTimepicker} style={styles.dateTimeButton}>
          <Ionicons name="time-outline" size={20} color="#007AFF" />
          <Text style={styles.dateTimeText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            testID="timePicker"
            value={time}
            mode="time"
            display="default"
            onChange={onChangeTime}
          />
        )}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Location (e.g., 'Exhibition Center')"
        placeholderTextColor="#888"
        value={location}
        onChangeText={setLocation}
      />
      <TextInput
        style={styles.input}
        placeholder="City (e.g., 'Kyiv')"
        placeholderTextColor="#888"
        value={city}
        onChangeText={setCity}
      />
      <TextInput
        style={styles.input}
        placeholder="Price (optional, e.g., '150' or leave empty for free)"
        placeholderTextColor="#888"
        keyboardType="numeric"
        value={eventPrice}
        onChangeText={setEventPrice}
      />
      <TextInput
        style={styles.input}
        placeholder="Image URL (optional)"
        placeholderTextColor="#888"
        value={imageUrl}
        onChangeText={setImageUrl}
      />

      <Text style={styles.sectionHeader}>
        Select Categories (Max {MAX_CATEGORIES}):
      </Text>
      <View style={styles.categoriesGrid}>
        {Array.isArray(allCategories) && allCategories.map((category) => {
          const isSelected = selectedCategoryIds.includes(category.id);
          const isDisabled = !isSelected && selectedCategoryIds.length >= MAX_CATEGORIES;
          return (
            <TouchableOpacity
              key={category.id}
              onPress={() => handleCategoryToggle(category.id)}
              disabled={isDisabled}
              style={[
                styles.categoryButton,
                isSelected && styles.selectedCategoryButton,
                isDisabled && styles.disabledCategoryButton,
              ]}
            >
              <Text style={[
                styles.categoryButtonText,
                isDisabled && styles.disabledCategoryButtonText,
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateEvent}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createButtonText}>Create Event</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  descriptionInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    justifyContent: 'center',
  },
  dateTimeText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
    marginTop: 15,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    justifyContent: 'flex-start',
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    margin: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedCategoryButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  disabledCategoryButton: {
    backgroundColor: '#f0f0f0',
    borderColor: '#e0e0e0',
  },
  categoryButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledCategoryButtonText: {
    color: '#aaa',
  },
  createButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CreateEventScreen;