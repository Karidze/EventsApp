// components/EventCard.js
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import moment from 'moment';
import 'moment/locale/en-gb';

moment.locale('en-gb');

const EventCard = ({ event, onPress, onBookmarkToggle, onCommentsPress }) => {
  const {
    title,
    description,
    date,
    end_date,
    time,
    location,
    city,
    event_price,
    image_url,
    profiles: organizerProfile, 
    is_bookmarked = false,      
    comments_count = 0,         
  } = event;

  const formattedDate = moment(date).format('D MMMM');
  const formattedTime = moment(time, 'HH:mm:ss').format('HH:mm');

  const hasEndDateAndIsDifferent = end_date && moment(date).format('YYYY-MM-DD') !== moment(end_date).format('YYYY-MM-DD');
  const formattedEndDate = hasEndDateAndIsDifferent ? moment(end_date).format('D MMMM') : null;

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

        {/* Date and Time */}
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.infoText}>
            {formattedDate}
            {hasEndDateAndIsDifferent ? ` - ${formattedEndDate}` : ''}
            <Text style={{ fontWeight: 'bold' }}> at</Text> {formattedTime}
          </Text>
        </View>

        {/* Location */}
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.infoText}>
            {location}, {city}
          </Text>
        </View>

        {/* Price */}
        {event_price > 0 ? (
          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              Price: {event_price} UAH
            </Text>
          </View>
        ) : (
          <View style={styles.infoRow}>
            <Ionicons name="wallet-outline" size={16} color="#666" />
            <Text style={styles.infoText}>Free</Text>
          </View>
        )}

        {/* Organizer Info */}
        <View style={styles.organizerInfo}>
          <Image source={{ uri: organizerAvatar }} style={styles.organizerAvatar} />
          <Text style={styles.organizerName}>
            Organizer: {organizerName}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onCommentsPress(event)}>
            <Ionicons name="chatbubble-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Comments ({comments_count})</Text>
          </TouchableOpacity>

          {/* "Save Event" / "Saved" Button */}
          {onBookmarkToggle && ( 
            <TouchableOpacity style={styles.actionButton} onPress={() => onBookmarkToggle(event)}>
              <Ionicons
                name={is_bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={is_bookmarked ? '#007AFF' : '#666'}
              />
              <Text style={[styles.actionButtonText, is_bookmarked && styles.bookmarkedText]}>
                {is_bookmarked ? 'Saved' : 'Save Event'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 10,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  organizerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#ccc',
  },
  organizerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F7F7F7',
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  bookmarkedText: {
    color: '#007AFF',
  },
});

export default EventCard;