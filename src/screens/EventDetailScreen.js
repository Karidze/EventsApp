// EventDetailScreen.js (пример, замени своим реальным кодом)
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Импортируем useNavigation

const EventDetailScreen = ({ route }) => {
  const navigation = useNavigation(); // Получаем объект навигации
  const { eventId, eventTitle } = route.params;

  const handleOpenComments = () => {
    // Открываем CommentsScreen как модальный экран
    navigation.navigate('CommentsModal', { eventId, eventTitle });
  };

  return (
    <View style={styles.container}>
      <Text>Event Details for: {eventTitle}</Text>
      <Text>Event ID: {eventId}</Text>

      <Button title="Open Comments" onPress={handleOpenComments} />

      {/* Другой контент EventDetailScreen */}
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
});

export default EventDetailScreen;