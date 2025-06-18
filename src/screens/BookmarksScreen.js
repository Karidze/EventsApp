import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BookmarksScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Избранное / Мои Ивенты</Text>
      <Text style={styles.subtitle}>Здесь будут отображаться избранные и созданные вами ивенты.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffe4e1',
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

export default BookmarksScreen;