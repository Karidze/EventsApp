import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EventDetailScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Event Details Screen</Text>
      <Text style={styles.subtitle}>This is a placeholder for event details.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default EventDetailScreen;