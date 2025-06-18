import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import 'moment/locale/ru'; 

moment.locale('ru');

const EventCard = ({ event, onPress }) => { 
  const {
    title,
    description,
    date,
    time,
    location,
    city,
    event_price,
    image_url,
    profiles: organizerProfile,
  } = event;

  const formattedDate = moment(date).format('D MMMM GG');
  const formattedTime = moment(time, 'HH:mm:ss').format('HH:mm');

  const organizerAvatar = organizerProfile?.avatar_url || 'https://via.placeholder.com/50/CCCCCC/FFFFFF?text=ORG';
  const organizerName = organizerProfile?.username || 'Unknown Organizer';

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(event)}>
      {image_url && <Image source={{ uri: image_url }} style={styles.cardImage} />}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>
          {description.length > 100 ? description.substring(0, 97) + '...' : description}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={14} color="#555" />
          <Text style={styles.infoText}>
            {formattedDate} <Text style={{fontWeight: 'bold'}}>at</Text> {formattedTime}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color="#555" />
          <Text style={styles.infoText}>
            {location}, {city}
          </Text>
        </View>

        {event_price > 0 ? (
          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={14} color="#555" />
            <Text style={styles.infoText}>
              Price: {event_price} UAH
            </Text>
          </View>
        ) : (
          <View style={styles.infoRow}>
            <Ionicons name="wallet-outline" size={14} color="#555" />
            <Text style={styles.infoText}>Free</Text>
          </View>
        )}

        <View style={styles.organizerInfo}>
          <Image source={{ uri: organizerAvatar }} style={styles.organizerAvatar} />
          <Text style={styles.organizerName}>
            Organizer: {organizerName}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    marginLeft: 6,
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  organizerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: '#ccc',
  },
  organizerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default EventCard;