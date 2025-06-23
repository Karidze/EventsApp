import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Keyboard,
  TouchableOpacity,
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0', paddingTop: 60 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  backButton: { position: 'absolute', left: 20, zIndex: 1, top: 0 },
  title: { fontSize: 28, fontWeight: '500', textAlign: 'center', color: '#333' },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 15,
  },
  inputLabel: { fontSize: 16, color: '#333', marginRight: 10, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 10,
    padding: 12,
    width: 100,
    textAlign: 'center',
    fontSize: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    color: '#34495e',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4682B4',
    padding: 12,
    marginHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
  },
  locationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
  addressContainer: { alignItems: 'center', marginBottom: 15, paddingHorizontal: 30 },
  addressText: { fontSize: 16, color: '#333', textAlign: 'center' },
  map: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
});

export default MapScreen;
