import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Alert,
} from 'react-native';
import MapView, {
  Marker,
  UrlTile,
  Circle,
  Callout,
} from 'react-native-maps';
import { useSelector } from 'react-redux';
import { getDistance } from 'geolib';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import styles from './MapScreenStyles';

const MapScreen = ({ navigation }) => {
  const { events } = useSelector(state => state.events);
  const mapRef = useRef(null);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [range, setRange] = useState('10');
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [address, setAddress] = useState('');
  const [initialRegion, setInitialRegion] = useState({
    latitude: 50.4501,
    longitude: 30.5234,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (!selectedLocation) {
      setNearbyEvents([]);
      setAddress('');
      return;
    }
    findNearbyEvents();
    getAddressFromCoords(selectedLocation.latitude, selectedLocation.longitude);
  }, [selectedLocation, range, events]);

  const findNearbyEvents = () => {
    const foundEvents = events.filter(event => {
      if (event.latitude && event.longitude) {
        const distance = getDistance(
          { latitude: selectedLocation.latitude, longitude: selectedLocation.longitude },
          { latitude: event.latitude, longitude: event.longitude }
        );
        return distance / 1000 <= parseFloat(range);
      }
      return false;
    });
    setNearbyEvents(foundEvents);
  };

  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      let geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode.length > 0) {
        const location = geocode[0];
        const formattedAddress = `${location.name || ''} ${location.street || ''}, ${location.city || ''}`.trim();
        setAddress(formattedAddress);
      } else {
        setAddress('Address not found');
      }
    } catch {
      setAddress('Error fetching address');
    }
  };

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Location permission denied');
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    animateToRegion(latitude, longitude);
    setSelectedLocation({ latitude, longitude });
  };

  const animateToRegion = (latitude, longitude) => {
    mapRef.current.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      1000
    );
  };

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    animateToRegion(latitude, longitude);
    setSelectedLocation({ latitude, longitude });
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Find Nearby Events</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Search Radius (km):</Text>
        <TextInput
          placeholder="e.g., 10"
          style={styles.input}
          value={range}
          onChangeText={setRange}
          keyboardType="numeric"
          placeholderTextColor="#aaa"
        />
      </View>

      <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
        <Ionicons name="locate" size={24} color="white" />
        <Text style={styles.locationButtonText}>My Location</Text>
      </TouchableOpacity>

      {address ? (
        <View style={styles.addressContainer}>
          <Text style={styles.addressText}>Address: {address}</Text>
        </View>
      ) : null}

      <MapView
        ref={mapRef}
        style={styles.map}
        onPress={handleMapPress}
        initialRegion={initialRegion}
      >
        <UrlTile urlTemplate="http://c.tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />

        {selectedLocation && (
          <>
            <Marker coordinate={selectedLocation} pinColor="blue" />
            <Circle
              center={selectedLocation}
              radius={parseFloat(range) * 1000}
              strokeColor="rgba(0, 0, 255, 0.5)"
              fillColor="rgba(0, 0, 255, 0.2)"
            />
          </>
        )}

        {nearbyEvents.map(event => (
          <Marker
            key={event.id}
            coordinate={{ latitude: event.latitude, longitude: event.longitude }}
            title={event.title}
            description={event.location}
            pinColor="red"
            onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
          />
        ))}

      </MapView>
    </View>
  );
};

export default MapScreen;