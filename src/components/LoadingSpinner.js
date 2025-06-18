import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';

const LoadingSpinner = ({ text = "Загрузка..." }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#0000ff" />
    <Text style={styles.loadingText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});

export default LoadingSpinner;