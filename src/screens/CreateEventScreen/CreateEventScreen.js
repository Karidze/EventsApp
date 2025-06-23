import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from '../../config/supabase';
import { fetchAllCategories } from '../../store/slices/eventsSlice';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';

import styles from './CreateEventScreenStyles';

const MAX_CATEGORIES = 5;

const CreateEventScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { allCategories } = useSelector((state) => state.events);
  const { session } = useSelector((state) => state.auth);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [eventPrice, setEventPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const [latitude, setLatitude] = useState(50.4501);
  const [longitude, setLongitude] = useState(30.5234);

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    dispatch(fetchAllCategories());
  }, [dispatch]);

  const onChangeStartDate = (event, selectedDate) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(Platform.OS === 'ios');
    if (endDate && currentDate > endDate) {
      setEndDate(currentDate);
    }
    setStartDate(currentDate);
  };

  const onChangeEndDate = (event, selectedDate) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(Platform.OS === 'ios');
    if (currentDate < startDate) {
      Alert.alert('Invalid Date', 'End date cannot be earlier than start date.');
      setEndDate(startDate);
    } else {
      setEndDate(currentDate);
    }
  };

  const onChangeTime = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(Platform.OS === 'ios');
    setTime(currentTime);
  };

  const showStartDatepicker = () => setShowStartDatePicker(true);
  const showEndDatePickerpicker = () => setShowEndDatePicker(true);
  const showTimepicker = () => setShowTimePicker(true);

  const handleCategoryToggle = (categoryId) => {
    if (selectedCategoryIds.includes(categoryId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== categoryId));
    } else {
      if (selectedCategoryIds.length < MAX_CATEGORIES) {
        setSelectedCategoryIds([...selectedCategoryIds, categoryId]);
      } else {
        Alert.alert('Limit Reached', `You can select a maximum of ${MAX_CATEGORIES} categories.`);
      }
    }
  };

  const handleCreateEvent = async () => {
    if (!session?.user?.id) {
      Alert.alert('Error', 'You must be logged in to create an event.');
      return;
    }

    if (!title || !description || !location || !city || selectedCategoryIds.length === 0) {
      Alert.alert('Validation Error', 'Please fill in all required fields and select at least one category.');
      return;
    }

    if (endDate && endDate < startDate) {
      Alert.alert('Validation Error', 'End date cannot be earlier than start date.');
      return;
    }

    if (latitude === null || longitude === null) {
      Alert.alert('Validation Error', 'Please select a location on the map.');
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
            date: startDate.toISOString().split('T')[0],
            end_date: endDate ? endDate.toISOString().split('T')[0] : null,
            time: time.toTimeString().split(' ')[0],
            location: location,
            city: city,
            event_price: parseFloat(eventPrice) || 0,
            image_url: imageUrl || null,
            category_ids: selectedCategoryIds,
            latitude: latitude,
            longitude: longitude,
          },
        ])
        .select();

      if (error) {
        console.error('Supabase insert error:', error.message);
        throw error;
      }

      Alert.alert('Success', 'Event created successfully!');
      setTitle('');
      setDescription('');
      setStartDate(new Date());
      setEndDate(null);
      setTime(new Date());
      setLocation('');
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
      setShowTimePicker(false);
      setCity('');
      setEventPrice('');
      setImageUrl('');
      setSelectedCategoryIds([]);
      setLatitude(50.4501);
      setLongitude(30.5234);

      navigation.navigate('HomeTab', { screen: 'Home' });

    } catch (error) {
      console.error('Error creating event:', error.message);
      Alert.alert('Error creating event', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (dateToFormat) => {
    return dateToFormat ? dateToFormat.toLocaleDateString() : 'Select Date';
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent} style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <Text style={styles.title}>Create New Event</Text>

      <View style={styles.inputUnderlineContainer}>
        <Ionicons name="pricetag-outline" size={20} color="#999" style={styles.icon} />
        <TextInput
          style={styles.inputUnderline}
          placeholder="Event Title"
          placeholderTextColor="#aaa"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.inputUnderlineContainer}>
        <Ionicons name="document-text-outline" size={20} color="#999" style={styles.icon} />
        <TextInput
          style={[styles.inputUnderline, styles.descriptionInput]}
          placeholder="Description"
          placeholderTextColor="#aaa"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          scrollEnabled={false}
          textAlignVertical="top"
        />
      </View>

      <Text style={styles.sectionHeader}>Event Dates:</Text>
      <View style={styles.dateRangeContainer}>
        <TouchableOpacity onPress={showStartDatepicker} style={styles.dateTimeButton}>
          <Ionicons name="calendar-outline" size={20} color="#333" />
          <Text style={styles.dateTimeText}>From: {formatDisplayDate(startDate)}</Text>
        </TouchableOpacity>
        {showStartDatePicker && (
          <DateTimePicker
            testID="startDatePicker"
            value={startDate}
            mode="date"
            display="default"
            onChange={onChangeStartDate}
            minimumDate={new Date()}
          />
        )}

        <TouchableOpacity onPress={showEndDatePickerpicker} style={styles.dateTimeButton}>
          <Ionicons name="calendar-outline" size={20} color="#333" />
          <Text style={styles.dateTimeText}>To: {formatDisplayDate(endDate || startDate)}</Text>
        </TouchableOpacity>
        {showEndDatePicker && (
          <DateTimePicker
            testID="endDatePicker"
            value={endDate || startDate}
            mode="date"
            display="default"
            onChange={onChangeEndDate}
            minimumDate={startDate}
          />
        )}
      </View>

      <View style={styles.dateTimeContainer}>
        <TouchableOpacity onPress={showTimepicker} style={styles.dateTimeButton}>
          <Ionicons name="time-outline" size={20} color="#333" />
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

      <View style={styles.inputUnderlineContainer}>
        <Ionicons name="location-outline" size={20} color="#999" style={styles.icon} />
        <TextInput
          style={styles.inputUnderline}
          placeholder="Location Name (e.g., 'Exhibition Center')"
          placeholderTextColor="#aaa"
          value={location}
          onChangeText={setLocation}
        />
      </View>

      <View style={styles.inputUnderlineContainer}>
        <Ionicons name="business-outline" size={20} color="#999" style={styles.icon} />
        <TextInput
          style={styles.inputUnderline}
          placeholder="City (e.g., 'Kyiv')"
          placeholderTextColor="#aaa"
          value={city}
          onChangeText={setCity}
        />
      </View>

      <View style={styles.inputUnderlineContainer}>
        <MaterialCommunityIcons name="currency-usd" size={20} color="#999" style={styles.icon} />
        <TextInput
          style={styles.inputUnderline}
          placeholder="Price (optional, e.g., '150' or leave empty for free)"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          value={eventPrice}
          onChangeText={setEventPrice}
        />
      </View>

      <View style={styles.inputUnderlineContainer}>
        <Ionicons name="image-outline" size={20} color="#999" style={styles.icon} />
        <TextInput
          style={styles.inputUnderline}
          placeholder="Image URL (optional)"
          placeholderTextColor="#aaa"
          value={imageUrl}
          onChangeText={setImageUrl}
        />
      </View>

      <Text style={styles.sectionHeader}>Select Event Location on Map:</Text>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPress={(e) => {
          setLatitude(e.nativeEvent.coordinate.latitude);
          setLongitude(e.nativeEvent.coordinate.longitude);
        }}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          draggable
          onDragEnd={(e) => {
            setLatitude(e.nativeEvent.coordinate.latitude);
            setLongitude(e.nativeEvent.coordinate.longitude);
          }}
        />
      </MapView>
      <Text style={styles.selectedCoordinatesText}>
        Selected: Lat {latitude.toFixed(5)}, Lon {longitude.toFixed(5)}
      </Text>

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

export default CreateEventScreen;